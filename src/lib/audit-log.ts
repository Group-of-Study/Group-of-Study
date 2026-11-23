import { getIP } from "better-auth/api";
import type { AuditAction, AuditTargetType, Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";

// Audit log de ações sensíveis (GOS-037). Ver docs/auditoria.md.

export type AuditEntry = {
    action: AuditAction;
    actorId: string;
    targetType: AuditTargetType;
    targetId: string;
    // Só ids: nada de nome ou e-mail (o registro sobrevive à exclusão da conta).
    metadata?: Prisma.InputJsonObject;
    ipAddress: string | null;
};

// IP de quem fez a ação, pelo mesmo critério do Better Auth (o mesmo que fica na
// sessão e no rate limit). null quando não dá para saber com segurança.
export function requestIp(headers: Headers): string | null {
    return getIP(headers, auth.options) ?? null;
}

// Grava dentro da transação da própria ação: ou as duas acontecem, ou nenhuma.
// Se o registro falhar, a ação é desfeita (melhor do que uma ação sensível sem rastro).
export async function recordAuditLog(tx: Prisma.TransactionClient, entry: AuditEntry): Promise<void> {
    await tx.auditLog.create({
        data: {
            action: entry.action,
            actorId: entry.actorId,
            targetType: entry.targetType,
            targetId: entry.targetId,
            metadata: entry.metadata,
            ipAddress: entry.ipAddress,
        },
    });
}
