
import { NextResponse } from "next/server";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

// POST: arquivar grupo (somente o líder)
export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.id) {
      return unauthorized();
    }

    const { groupId } = await params;

    if (!groupId || groupId.trim().length === 0) {
      return NextResponse.json(
        { error: "Identificador do grupo inválido." },
        { status: 400 },
      );
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        leaderId: true,
        status: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupo não encontrado." },
        { status: 404 },
      );
    }

    if (group.leaderId !== user.id) {
      return NextResponse.json(
        { error: "Somente o líder pode arquivar este grupo." },
        { status: 403 },
      );
    }

    if (group.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Somente grupos ativos podem ser arquivados." },
        { status: 409 },
      );
    }

    // Arquiva somente se o usuário continuar sendo o líder
    // e o grupo ainda estiver ativo.
    const result = await prisma.group.updateMany({
      where: {
        id: groupId,
        leaderId: user.id,
        status: "ACTIVE",
      },
      data: {
        status: "ARCHIVED",
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "O grupo não está mais disponível para arquivamento." },
        { status: 409 },
      );
    }

    const archivedGroup = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!archivedGroup) {
      return NextResponse.json(
        { error: "Grupo não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Grupo arquivado com sucesso.",
      data: archivedGroup,
    });
  } catch (error) {
    console.error("[POST /api/groups/:groupId/archive]", error);

    return NextResponse.json(
      { error: "Não foi possível arquivar o grupo." },
      { status: 500 },
    );
  }
}
