
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
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.visibility !== undefined,
    {
      message: "Informe ao menos um campo para atualizar.",
    },
  );

// GET: buscar detalhes do grupo e seus membros
export async function GET(
  _request: NextRequest,
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
      where: {
        id: groupId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        status: true,
        visibility: true,
        creatorId: true,
        leaderId: true,

        creator: {
          select: {
            id: true,
            name: true,
          },
        },

        leader: {
          select: {
            id: true,
            name: true,
          },
        },

        members: {
          orderBy: {
            joinedAt: "asc",
          },
          select: {
            id: true,
            userId: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupo não encontrado." },
        { status: 404 },
      );
    }

    const isMember = group.members.some(
      (member) => member.userId === user.id,
    );

    const canAccessPrivateGroup =
      isMember ||
      group.creatorId === user.id ||
      group.leaderId === user.id;

    if (
      group.visibility === "PRIVATE" &&
      !canAccessPrivateGroup
    ) {
      return NextResponse.json(
        { error: "Grupo não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        id: group.id,
        name: group.name,
        description: group.description,
        createdAt: group.createdAt,
        status: group.status,
        visibility: group.visibility,
        creator: group.creator,
        leader: group.leader,
        members: group.members.map((member) => ({
          id: member.id,
          joinedAt: member.joinedAt,
          user: member.user,
        })),
        _count: group._count,
      },
    });
  } catch (error) {
    console.error("[GET /api/groups/:groupId]", error);

    return NextResponse.json(
      { error: "Não foi possível carregar os detalhes do grupo." },
      { status: 500 },
    );
  }
}

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
            path: issue.path.join("."),
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
        ...(validation.data.visibility !== undefined
          ? { visibility: validation.data.visibility }
          : {}),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        {
          error:
            "Não foi possível atualizar o grupo. A liderança pode ter sido alterada.",
        },
        { status: 409 },
      );
    }

    const updatedGroup = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
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
