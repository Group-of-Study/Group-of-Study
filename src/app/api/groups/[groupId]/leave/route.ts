
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { leaveGroup } from "@/features/groups/leave";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return unauthorized();
    }

    const userId = session.user.id;
    const { groupId } = await params;

    if (!groupId?.trim()) {
      return NextResponse.json(
        { error: "Identificador do grupo inválido." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const group = await tx.group.findUnique({
          where: { id: groupId },
          select: {
            id: true,
            name: true,
            status: true,
            leaderId: true,
          },
        });

        if (!group) {
          return {
            status: 404,
            body: { error: "Grupo não encontrado." },
          };
        }

        // Somente grupos encerrados impedem a saída.
        // Grupos arquivados também permitem que participantes saiam.
        if (group.status === "CLOSED") {
          return {
            status: 409,
            body: { error: "Este grupo já foi encerrado." },
          };
        }

        const membership = await tx.groupMember.findUnique({
          where: {
            userId_groupId: { userId, groupId },
          },
          select: { id: true },
        });

        if (!membership) {
          return {
            status: 404,
            body: { error: "Você não participa deste grupo." },
          };
        }

        const outcome = await leaveGroup(tx, group, userId);

        return {
          status: 200,
          body: {
            message:
              outcome.status === "CLOSED"
                ? "Você saiu do grupo. Como não restaram participantes, o grupo foi encerrado."
                : "Você saiu do grupo com sucesso.",
            data: { groupId, ...outcome },
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json(result.body, {
      status: result.status,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          error:
            "O grupo foi alterado simultaneamente. Tente novamente.",
        },
        { status: 409 },
      );
    }

    console.error("[POST /api/groups/:groupId/leave]", error);

    return NextResponse.json(
      { error: "Não foi possível sair do grupo." },
      { status: 500 },
    );
  }
}
