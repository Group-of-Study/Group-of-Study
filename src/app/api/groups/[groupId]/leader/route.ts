
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

const TransferLeadershipSchema = z
  .object({
    userId: z.string().trim().min(1).max(100),
  })
  .strict();

// POST: transferir liderança (somente o líder atual)
export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();
    const currentUser = session?.user;

    if (!currentUser?.id) {
      return unauthorized();
    }

    const { groupId } = await params;

    if (!groupId?.trim()) {
      return NextResponse.json(
        { error: "Identificador do grupo inválido." },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "O corpo da requisição deve ser um JSON válido." },
        { status: 400 },
      );
    }

    const validation = TransferLeadershipSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
          issues: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const { userId: newLeaderId } = validation.data;

    const result = await prisma.$transaction(
      async (tx) => {
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

        if (group.leaderId !== currentUser.id) {
          return {
            status: 403,
            body: {
              error: "Somente o líder atual pode transferir a liderança.",
            },
          };
        }

        if (newLeaderId === currentUser.id) {
          return {
            status: 409,
            body: { error: "Você já é o líder deste grupo." },
          };
        }

        const membership = await tx.groupMember.findUnique({
          where: {
            userId_groupId: {
              userId: newLeaderId,
              groupId,
            },
          },
          select: { id: true },
        });

        if (!membership) {
          return {
            status: 409,
            body: {
              error: "O novo líder precisa ser participante deste grupo.",
            },
          };
        }

        const update = await tx.group.updateMany({
          where: {
            id: groupId,
            leaderId: currentUser.id,
          },
          data: {
            leaderId: newLeaderId,
          },
        });

        if (update.count === 0) {
          return {
            status: 409,
            body: {
              error: "A liderança foi alterada simultaneamente. Tente novamente.",
            },
          };
        }

        return {
          status: 200,
          body: {
            message: "Liderança transferida com sucesso.",
            data: {
              groupId,
              previousLeaderId: currentUser.id,
              newLeaderId,
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
          error: "O grupo foi alterado simultaneamente. Tente novamente.",
        },
        { status: 409 },
      );
    }

    console.error("[POST /api/groups/:groupId/leader]", error);

    return NextResponse.json(
      { error: "Não foi possível transferir a liderança." },
      { status: 500 },
    );
  }
}
