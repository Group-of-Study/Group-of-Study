import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession, unauthorized } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    groupId: string;
    inviteId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return unauthorized();
    }

    const { groupId, inviteId } = await params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        leaderId: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupo não encontrado." },
        { status: 404 },
      );
    }

    if (group.leaderId !== session.user.id) {
      return NextResponse.json(
        { error: "Somente o líder pode revogar convites." },
        { status: 403 },
      );
    }

    const invite = await prisma.groupInvite.findFirst({
      where: {
        id: inviteId,
        groupId,
      },
      select: {
        id: true,
        revokedAt: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Convite não encontrado." },
        { status: 404 },
      );
    }

    if (invite.revokedAt) {
      return NextResponse.json(
        { error: "Este convite já foi revogado." },
        { status: 409 },
      );
    }

    const result = await prisma.groupInvite.updateMany({
      where: {
        id: inviteId,
        groupId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Este convite já foi revogado." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: "Convite revogado com sucesso.",
    });
  } catch (error) {
    console.error("[DELETE /api/groups/:groupId/invites/:inviteId]", error);

    return NextResponse.json(
      { error: "Erro interno ao revogar convite." },
      { status: 500 },
    );
  }
}