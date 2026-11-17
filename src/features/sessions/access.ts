import { NextResponse } from "next/server";
import type { GroupStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Quem pode o quê na agenda (GOS-042):
// - ver: participantes do grupo (qualquer status);
// - marcar, editar e excluir: só o líder, com o grupo ativo.

export type SessionGroup = {
    id: string;
    name: string;
    status: GroupStatus;
    leaderId: string | null;
};

type Access = { ok: true; group: SessionGroup } | { ok: false; response: Response };

function fail(status: number, error: string): Access {
    return { ok: false, response: NextResponse.json({ error }, { status }) };
}

// Confere grupo e participação. Com `manage`, confere também se é o líder de um grupo
// ativo. Devolve o grupo ou a resposta de erro pronta para a rota devolver.
export async function checkSessionAccess(
    groupId: string,
    userId: string,
    { manage = false }: { manage?: boolean } = {},
): Promise<Access> {
    if (!groupId?.trim()) {
        return fail(400, "Identificador do grupo inválido.");
    }

    const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { id: true, name: true, status: true, leaderId: true },
    });

    if (!group) {
        return fail(404, "Grupo não encontrado.");
    }

    const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } },
        select: { id: true },
    });

    if (!membership) {
        return fail(403, "Você não participa deste grupo.");
    }

    if (manage) {
        if (group.leaderId !== userId) {
            return fail(403, "Somente o líder pode marcar, editar ou excluir encontros.");
        }
        if (group.status !== "ACTIVE") {
            return fail(409, "A agenda de um grupo que não está ativo fica só para consulta.");
        }
    }

    return { ok: true, group };
}
