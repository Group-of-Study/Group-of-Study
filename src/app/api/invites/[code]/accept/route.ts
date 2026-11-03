import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { getSession, unauthorized } from "@/lib/session";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return unauthorized();
    }

    const { code } = await params;
    const now = new Date();

    const result = await prisma.$transaction(
      async (tx) => {
        const invite = await tx.groupInvite.findUnique({
          where: { code },
          select: {
            id: true,
            groupId: true,
            expiresAt: true,
            maxUses: true,
            uses: true,
            revokedAt: true,
            recipientId: true,
            group: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        });

        if (!invite) {
          return {
            ok: false as const,
            reason: "NOT_FOUND" as const,
          };
        }

        // Convites direcionados só podem ser aceitos pelo destinatário.
        if (
          invite.recipientId &&
          invite.recipientId !== session.user.id
        ) {
          return {
            ok: false as const,
            reason: "NOT_RECIPIENT" as const,
          };
        }

        if (invite.revokedAt) {
          return {
            ok: false as const,
            reason: "REVOKED" as const,
          };
        }

        if (invite.expiresAt && invite.expiresAt <= now) {
          return {
            ok: false as const,
            reason: "EXPIRED" as const,
          };
        }

        if (
          invite.maxUses !== null &&
          invite.uses >= invite.maxUses
        ) {
          return {
            ok: false as const,
            reason: "LIMIT_REACHED" as const,
          };
        }

        if (invite.group.status !== "ACTIVE") {
          return {
            ok: false as const,
            reason: "GROUP_INACTIVE" as const,
          };
        }

        const existingMembership = await tx.groupMember.findUnique({
          where: {
            userId_groupId: {
              userId: session.user.id,
              groupId: invite.groupId,
            },
          },
        });

        if (existingMembership) {
          return {
            ok: false as const,
            reason: "ALREADY_MEMBER" as const,
          };
        }

        const updatedInvite = await tx.groupInvite.updateMany({
          where: {
            id: invite.id,
            revokedAt: null,
            uses: {
              equals: invite.uses,
              ...(invite.maxUses !== null
                ? { lt: invite.maxUses }
                : {}),
            },
            ...(invite.expiresAt
              ? { expiresAt: { gt: now } }
              : {}),
          },
          data: {
            uses: {
              increment: 1,
            },
          },
        });

        if (updatedInvite.count === 0) {
          return {
            ok: false as const,
            reason: "UNAVAILABLE" as const,
          };
        }

        await tx.groupMember.create({
          data: {
            groupId: invite.groupId,
            userId: session.user.id,
          },
        });

        return {
          ok: true as const,
          data: {
            groupId: invite.groupId,
            groupName: invite.group.name,
            inviteId: invite.id,
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    if (!result.ok) {
      switch (result.reason) {
        case "NOT_FOUND":
          return NextResponse.json(
            { error: "Convite não encontrado." },
            { status: 404 },
          );

        case "NOT_RECIPIENT":
          return NextResponse.json(
            {
              error: "Este convite foi direcionado a outro usuário.",
            },
            { status: 403 },
          );

        case "REVOKED":
          return NextResponse.json(
            { error: "Este convite foi revogado." },
            { status: 409 },
          );

        case "EXPIRED":
          return NextResponse.json(
            { error: "Este convite expirou." },
            { status: 409 },
          );

        case "LIMIT_REACHED":
          return NextResponse.json(
            {
              error: "O convite atingiu o limite de utilizações.",
            },
            { status: 409 },
          );

        case "GROUP_INACTIVE":
          return NextResponse.json(
            { error: "Este grupo não está ativo." },
            { status: 409 },
          );

        case "ALREADY_MEMBER":
          return NextResponse.json(
            { error: "Você já participa deste grupo." },
            { status: 409 },
          );

        case "UNAVAILABLE":
          return NextResponse.json(
            {
              error: "Este convite não está mais disponível.",
            },
            { status: 409 },
          );
      }
    }

    return NextResponse.json(
      {
        message: "Você entrou no grupo com sucesso.",
        data: result.data,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        return NextResponse.json(
          {
            error:
              "O convite foi utilizado simultaneamente. Tente novamente.",
          },
          { status: 409 },
        );
      }

      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Você já participa deste grupo." },
          { status: 409 },
        );
      }
    }

    console.error("[POST /api/invites/:code/accept]", error);

    return NextResponse.json(
      { error: "Não foi possível aceitar o convite." },
      { status: 500 },
    );
  }
}