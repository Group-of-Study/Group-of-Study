
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    groupId: string;
    goalId: string;
  }>;
};

const DueDateSchema = z.preprocess(
  (value) => value === "" ? null : value,
  z.coerce.date().nullable(),
);

const UpdateGoalSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    dueDate: DueDateSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.dueDate !== undefined,
    {
      message: "Informe ao menos um campo para atualizar.",
    },
  );

// PATCH: editar meta (somente autor ou líder)
export async function PATCH(
  request: Request,
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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "O corpo da requisição deve ser um JSON válido." },
        { status: 400 },
      );
    }

    const validation = UpdateGoalSchema.safeParse(body);

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
        authorId: true,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: "Meta não encontrada neste grupo." },
        { status: 404 },
      );
    }

    if (goal.authorId !== user.id && group.leaderId !== user.id) {
      return NextResponse.json(
        { error: "Somente o autor ou o líder pode editar esta meta." },
        { status: 403 },
      );
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: validation.data,
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Meta atualizada com sucesso.",
      data: updatedGoal,
    });
  } catch (error) {
    console.error("[PATCH /api/groups/:groupId/goals/:goalId]", error);

    return NextResponse.json(
      { error: "Não foi possível atualizar a meta." },
      { status: 500 },
    );
  }
}


export async function DELETE(
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
        authorId: true,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: "Meta não encontrada neste grupo." },
        { status: 404 },
      );
    }

    if (goal.authorId !== user.id && group.leaderId !== user.id) {
      return NextResponse.json(
        { error: "Somente o autor ou o líder pode excluir esta meta." },
        { status: 403 },
      );
    }

    await prisma.goal.delete({
      where: { id: goalId },
    });

    return NextResponse.json({
      message: "Meta excluída com sucesso.",
      data: {
        goalId,
        groupId,
      },
    });
  } catch (error) {
    console.error("[DELETE /api/groups/:groupId/goals/:goalId]", error);

    return NextResponse.json(
      { error: "Não foi possível excluir a meta." },
      { status: 500 },
    );
  }
}

