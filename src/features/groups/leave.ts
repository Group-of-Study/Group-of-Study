import type { GroupStatus, Prisma } from "@/generated/prisma/client";

// O grupo como a regra de saída precisa dele (quem chama já buscou dentro da transação).
export type LeavingGroup = {
    id: string;
    name: string;
    status: GroupStatus;
    leaderId: string | null;
};

export type LeaveOutcome = {
    status: GroupStatus;
    leaderId: string | null;
    remainingMembers: number;
};

// Regra de saída de um grupo, usada por "Sair do grupo" (POST /api/groups/[groupId]/leave)
// e pela exclusão de conta (GOS-036), para as duas nunca divergirem:
// - sem ninguém restante, o grupo é encerrado (CLOSED, sem líder);
// - se quem sai é o líder, o participante mais antigo assume e recebe uma notificação.
//
// Quem chama já conferiu que a pessoa participa do grupo e roda isto dentro de uma
// transação Serializable (prisma.$transaction), junto com as próprias checagens.
export async function leaveGroup(
    tx: Prisma.TransactionClient,
    group: LeavingGroup,
    userId: string,
): Promise<LeaveOutcome> {
    await tx.groupMember.delete({
        where: { userId_groupId: { userId, groupId: group.id } },
    });

    // Participantes restantes, do mais antigo ao mais recente.
    const remainingMembers = await tx.groupMember.findMany({
        where: { groupId: group.id },
        select: { userId: true },
        orderBy: [{ joinedAt: "asc" }, { userId: "asc" }],
    });

    if (remainingMembers.length === 0) {
        await tx.group.update({
            where: { id: group.id },
            data: { status: "CLOSED", leaderId: null },
        });
        return { status: "CLOSED", leaderId: null, remainingMembers: 0 };
    }

    if (group.leaderId !== userId) {
        return { status: group.status, leaderId: group.leaderId, remainingMembers: remainingMembers.length };
    }

    const newLeaderId = remainingMembers[0].userId;
    await tx.group.update({
        where: { id: group.id },
        data: { leaderId: newLeaderId },
    });
    await tx.notification.create({
        data: {
            userId: newLeaderId,
            type: "BECAME_LEADER",
            data: { groupId: group.id, groupName: group.name, previousLeaderId: userId },
        },
    });
    return { status: group.status, leaderId: newLeaderId, remainingMembers: remainingMembers.length };
}
