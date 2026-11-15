import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { leaveGroup } from "@/features/groups/leave";
import { recordAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

// Exclusão de conta (GOS-036, LGPD). Em duas etapas:
// 1. Na hora (softDeleteAccount): a pessoa sai dos grupos, perde o acesso e os dados
//    pessoais somem (nome e e-mail anonimizados). A linha do usuário continua só para
//    não quebrar o que ficou nos grupos (metas, grupos criados por ela).
// 2. Depois de PURGE_AFTER_DAYS (purgeDeletedAccounts): a linha é apagada de vez.

export const DELETED_USER_NAME = "Conta excluída";
export const PURGE_AFTER_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

// O e-mail é único no banco, então cada conta excluída ganha um diferente. O domínio
// .invalid é reservado (RFC 2606): nunca recebe e-mail de verdade. O e-mail original
// fica livre para um cadastro novo.
export function anonymizedEmail(userId: string): string {
    return `excluida-${userId}@contas.invalid`;
}

export type SoftDeleteOptions = {
    // IP de quem pediu a exclusão, para o audit log (GOS-037).
    ipAddress: string | null;
    now?: Date;
};

export async function softDeleteAccount(userId: string, { ipAddress, now = new Date() }: SoftDeleteOptions): Promise<void> {
    await prisma.$transaction(
        async (tx) => {
            // Um soft delete não dispara os onDelete do banco: sair dos grupos é feito
            // aqui, com a mesma regra do "Sair do grupo" (passa a liderança ou encerra).
            const memberships = await tx.groupMember.findMany({
                where: { userId },
                orderBy: { joinedAt: "asc" },
                select: { group: { select: { id: true, name: true, status: true, leaderId: true } } },
            });
            for (const { group } of memberships) {
                await leaveGroup(tx, group, userId);
            }

            // Sem sessões, sem senha e sem 2FA: ninguém entra mais nesta conta.
            await tx.session.deleteMany({ where: { userId } });
            await tx.account.deleteMany({ where: { userId } });
            await tx.twoFactor.deleteMany({ where: { userId } });
            // Notificações e convites recebidos são só dela.
            await tx.notification.deleteMany({ where: { userId } });
            await tx.groupInvite.deleteMany({ where: { recipientId: userId } });

            await tx.user.update({
                where: { id: userId },
                data: {
                    name: DELETED_USER_NAME,
                    email: anonymizedEmail(userId),
                    image: null,
                    emailVerified: false,
                    twoFactorEnabled: false,
                    deletedAt: now,
                },
            });

            await recordAuditLog(tx, {
                action: "ACCOUNT_DELETED",
                actorId: userId,
                targetType: "USER",
                targetId: userId,
                metadata: { groupsLeft: memberships.length },
                ipAddress,
            });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
}

// Apaga de vez as contas excluídas há mais de PURGE_AFTER_DAYS. Aqui os onDelete do
// schema fazem o resto: Cascade nas tabelas da pessoa e SetNull em grupos e metas.
// Ainda não roda sozinho: o agendamento entra com a fila de jobs (GOS-048).
export async function purgeDeletedAccounts(now: Date = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - PURGE_AFTER_DAYS * DAY_MS);
    const { count } = await prisma.user.deleteMany({
        where: { deletedAt: { not: null, lte: cutoff } },
    });
    return count;
}
