
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    groupId: string;
    userId: string;
  }>;
};

// DELETE: remover participante do grupo (somente o líder)
export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return unauthorized();
    }

    const currentUserId = session.user.id;
    const { groupId, userId } = await params;

    if (!groupId?.trim() || !userId?.trim()) {
      return NextResponse.json(
        { error: "Identificador do grupo ou usuário inválido." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Verifica se o grupo existe e identifica o líder.
        const group = await tx.group.findUnique({
          where: { id: groupId },
          select: {
            id: true,
            leaderId: true,
          },
        });

        if (!group) {
          return {
            status: 404,
            body: { error: "Grupo não encontrado." },
          };
        }

        // Somente o líder pode remover participantes.
        if (group.leaderId !== currentUserId) {
          return {
            status: 403,
            body: {
              error: "Somente o líder pode remover participantes deste grupo.",
            },
          };
        }

        // O líder não pode remover a si mesmo.
        if (userId === currentUserId) {
          return {
            status: 409,
            body: {
              error:
                "O líder não pode remover a si mesmo. Utilize a opção de sair do grupo ou transfira a liderança.",
            },
          };
        }

        // Verifica se o usuário participa do grupo.
        const membership = await tx.groupMember.findUnique({
          where: {
            userId_groupId: {
              userId,
              groupId,
            },
          },
          select: {
            id: true,
          },
        });

        if (!membership) {
          return {
            status: 404,
            body: {
              error: "Este usuário não participa deste grupo.",
            },
          };
        }

        // Remove somente a participação do usuário.
        await tx.groupMember.delete({
          where: {
            userId_groupId: {
              userId,
              groupId,
            },
          },
        });

        // Conta os participantes restantes.
        const remainingMembers = await tx.groupMember.count({
          where: { groupId },
        });

        return {
          status: 200,
          body: {
            message: "Participante removido do grupo com sucesso.",
            data: {
              groupId,
              removedUserId: userId,
              remainingMembers,
            },
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
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2034") {
        return NextResponse.json(
          {
            error:
              "O grupo foi alterado simultaneamente. Tente novamente.",
          },
          { status: 409 },
        );
      }

      if (error.code === "P2025") {
        return NextResponse.json(
          {
            error:
              "O participante não foi encontrado ou já foi removido.",
          },
          { status: 404 },
        );
      }
    }

    console.error(
      "[DELETE /api/groups/:groupId/members/:userId]",
      error,
    );

    return NextResponse.json(
      { error: "Não foi possível remover o participante." },
      { status: 500 },
    );
  }
}
