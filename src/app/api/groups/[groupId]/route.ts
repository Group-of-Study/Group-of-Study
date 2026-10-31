
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

const UpdateGroupSchema = z
  .object({
    name: z.string().trim().min(3).max(80).optional(),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.name !== undefined || data.description !== undefined,
    {
      message: "Informe ao menos um campo para atualizar.",
    },
  );

// PATCH: atualizar grupo (somente o líder)
export async function PATCH(
  request: NextRequest,
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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "O corpo da requisição deve ser um JSON válido." },
        { status: 400 },
      );
    }

    const validation = UpdateGroupSchema.safeParse(body);

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

    if (group.leaderId !== user.id) {
      return NextResponse.json(
        { error: "Somente o líder pode atualizar este grupo." },
        { status: 403 },
      );
    }

    // Atualiza somente se o usuário continuar sendo o líder.
    const result = await prisma.group.updateMany({
      where: {
        id: groupId,
        leaderId: user.id,
      },
      data: {
        ...(validation.data.name !== undefined
          ? { name: validation.data.name }
          : {}),
        ...(validation.data.description !== undefined
          ? { description: validation.data.description || null }
          : {}),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Não foi possível atualizar o grupo. Verifique a liderança." },
        { status: 403 },
      );
    }

    const updatedGroup = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!updatedGroup) {
      return NextResponse.json(
        { error: "Grupo não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Grupo atualizado com sucesso.",
      data: updatedGroup,
    });
  } catch (error) {
    console.error("[PATCH /api/groups/:groupId]", error);

    return NextResponse.json(
      { error: "Não foi possível atualizar o grupo." },
      { status: 500 },
    );
  }
}
