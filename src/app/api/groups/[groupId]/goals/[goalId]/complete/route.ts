
import { NextResponse } from "next/server";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    groupId: string;
    goalId: string;
  }>;
};

// PATCH: concluir meta (somente membros do grupo)
export async function PATCH(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.id) {
      return unauthorized();
    }

    const { groupId, goalId } = await params;

    if (!groupId?.trim() || !goalId?.trim()) {
      return NextResponse.json(
        { error: "Identificador do grupo ou meta inválido." },
        { status: 400 },
      );
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupo não encontrado." },
        { status: 404 },
      );
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Você não participa deste grupo." },
        { status: 403 },
      );
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        groupId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: "Meta não encontrada neste grupo." },
        { status: 404 },
      );
    }

    if (goal.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Esta meta já foi concluída." },
        { status: 409 },
      );
    }

    // Atualiza somente se a meta ainda estiver pendente.
    const result = await prisma.goal.updateMany({
      where: {
        id: goalId,
        groupId,
        status: "PENDING",
      },
      data: {
        status: "COMPLETED",
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "A meta já foi concluída ou foi alterada simultaneamente." },
        { status: 409 },
      );
    }

    const completedGoal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Meta concluída com sucesso.",
      data: completedGoal,
    });
  } catch (error) {
    console.error(
      "[PATCH /api/groups/:groupId/goals/:goalId/complete]",
      error,
    );

    return NextResponse.json(
      { error: "Não foi possível concluir a meta." },
      { status: 500 },
    );
  }
}
