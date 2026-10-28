
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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

        if (group.status !== "ACTIVE") {
          return {
            status: 409,
            body: { error: "Este grupo não está ativo." },
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

        await tx.groupMember.delete({
          where: {
            userId_groupId: { userId, groupId },
          },
        });

        const remainingMembers = await tx.groupMember.findMany({
          where: { groupId },
          select: { userId: true },
          orderBy: { joinedAt: "asc" },
        });

        if (remainingMembers.length === 0) {
          await tx.group.update({
            where: { id: groupId },
            data: {
              status: "CLOSED",
              leaderId: null,
            },
          });

          return {
            status: 200,
            body: {
              message:
                "Você saiu do grupo. Como não restaram participantes, o grupo foi encerrado.",
              data: {
                groupId,
                status: "CLOSED",
                leaderId: null,
                remainingMembers: 0,
              },
            },
          };
        }

        let newLeaderId = group.leaderId;

        if (group.leaderId === userId) {
          const randomIndex = Math.floor(
            Math.random() * remainingMembers.length,
          );

          newLeaderId = remainingMembers[randomIndex].userId;

          await tx.group.update({
            where: { id: groupId },
            data: { leaderId: newLeaderId },
          });
        }

        return {
          status: 200,
          body: {
            message: "Você saiu do grupo com sucesso.",
            data: {
              groupId,
              status: "ACTIVE",
              leaderId: newLeaderId,
              remainingMembers: remainingMembers.length,
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
