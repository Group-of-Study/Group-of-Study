
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

const CreateGoalSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
  })
  .strict();

// GET: listar metas do grupo
export async function GET(
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

    if (!groupId?.trim()) {
      return NextResponse.json(
        { error: "Identificador do grupo inválido." },
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

    const goals = await prisma.goal.findMany({
      where: { groupId },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        createdAt: true,
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
      data: goals,
    });
  } catch (error) {
    console.error("[GET /api/groups/:groupId/goals]", error);

    return NextResponse.json(
      { error: "Não foi possível listar as metas." },
      { status: 500 },
    );
  }
}

// POST: criar meta no grupo
export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.id) {
      return unauthorized();
    }

    const { groupId } = await params;

    if (!groupId?.trim()) {
      return NextResponse.json(
        { error: "Identificador do grupo inválido." },
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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "O corpo da requisição deve ser um JSON válido." },
        { status: 400 },
      );
    }

    const validation = CreateGoalSchema.safeParse(body);

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

    const { title, description, dueDate } = validation.data;

    const goal = await prisma.goal.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ?? null,
        status: "PENDING",
        groupId,
        authorId: user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Meta criada com sucesso.",
        data: goal,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/groups/:groupId/goals]", error);

    return NextResponse.json(
      { error: "Não foi possível criar a meta." },
      { status: 500 },
    );
  }
}
