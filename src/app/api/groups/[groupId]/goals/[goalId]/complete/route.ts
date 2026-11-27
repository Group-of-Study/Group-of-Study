import { NextResponse } from "next/server";

import type { GoalStatus } from "@/backend/generated/prisma/client";
import { GOAL_SELECT } from "@/backend/features/goals/goal-select";
import { getSession, unauthorized } from "@/backend/lib/session";
import { prisma } from "@/backend/lib/prisma";

type RouteContext = {
  params: Promise<{
    groupId: string;
    goalId: string;
  }>;
};

// Concluir (PATCH) e reabrir (DELETE) seguem as mesmas regras: qualquer participante,
// só em grupo ativo. A diferença é o status de partida e o de chegada.
const TRANSITIONS = {
  complete: {
    from: "PENDING",
    to: "COMPLETED",
    verb: "concluir",
    alreadyDone: "Esta meta já foi concluída.",
    conflict: "A meta já foi concluída ou foi alterada simultaneamente.",
    success: "Meta concluída com sucesso.",
    failure: "Não foi possível concluir a meta.",
  },
  reopen: {
    from: "COMPLETED",
    to: "PENDING",
    verb: "reabrir",
    alreadyDone: "Esta meta ainda não foi concluída.",
    conflict: "A meta já foi reaberta ou foi alterada simultaneamente.",
    success: "Meta reaberta.",
    failure: "Não foi possível reabrir a meta.",
  },
} satisfies Record<
  string,
  {
    from: GoalStatus;
    to: GoalStatus;
    verb: string;
    alreadyDone: string;
    conflict: string;
    success: string;
    failure: string;
  }
>;

type Transition = keyof typeof TRANSITIONS;

async function changeStatus(
  transition: Transition,
  { params }: RouteContext,
) {
  const rule = TRANSITIONS[transition];

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
      select: {
        id: true,
        status: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupo não encontrado." },
        { status: 404 },
      );
    }

    if (group.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: `Não é possível ${rule.verb} metas de um grupo que não está ativo.`,
        },
        { status: 409 },
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

    if (goal.status !== rule.from) {
      return NextResponse.json(
        { error: rule.alreadyDone },
        { status: 409 },
      );
    }

    // Só muda se o status ainda for o de partida: duas pessoas clicando ao mesmo
    // tempo não concluem (nem reabrem) a meta duas vezes.
    const result = await prisma.goal.updateMany({
      where: {
        id: goalId,
        groupId,
        status: rule.from,
      },
      data: {
        status: rule.to,
        completedAt: rule.to === "COMPLETED" ? new Date() : null,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: rule.conflict },
        { status: 409 },
      );
    }

    const updatedGoal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: GOAL_SELECT,
    });

    return NextResponse.json({
      message: rule.success,
      data: updatedGoal,
    });
  } catch (error) {
    console.error(
      `[${transition === "complete" ? "PATCH" : "DELETE"} /api/groups/:groupId/goals/:goalId/complete]`,
      error,
    );

    return NextResponse.json(
      { error: rule.failure },
      { status: 500 },
    );
  }
}

// PATCH: concluir meta (somente membros de grupos ativos)
export async function PATCH(_request: Request, context: RouteContext) {
  return changeStatus("complete", context);
}

// DELETE: reabrir meta concluída (desmarcar), com as mesmas regras
export async function DELETE(_request: Request, context: RouteContext) {
  return changeStatus("reopen", context);
}
