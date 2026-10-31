
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const CreateGroupSchema = z
  .object({
    name: z.string().trim().min(3).max(80),
    description: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),
  })
  .strict();

const ListGroupsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(100).optional(),
  q: z.string().trim().max(100).optional(),
  member: z.enum(["me"]).optional(),
});

// POST: criar um grupo de estudo
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.id) {
      return unauthorized();
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

    const validation = CreateGroupSchema.safeParse(body);

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

    const { name, description } = validation.data;

    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        status: "ACTIVE",
        creatorId: user.id,
        leaderId: user.id,
        members: {
          create: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
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
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json({ data: group }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/groups]", error);

    return NextResponse.json(
      { error: "Não foi possível criar o grupo." },
      { status: 500 },
    );
  }
}

// GET: listar grupos ativos com busca, filtros e paginação
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.id) {
      return unauthorized();
    }

    const params = request.nextUrl.searchParams;

    const validation = ListGroupsSchema.safeParse({
      limit: params.get("limit") ?? "20",
      cursor: params.get("cursor") ?? undefined,
      q: params.get("q") ?? undefined,
      member: params.get("member") ?? undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Parâmetros de consulta inválidos." },
        { status: 400 },
      );
    }

    const { limit, cursor, q, member } = validation.data;

    // Filtros compartilhados entre a validação do cursor e a listagem.
    const where = {
      status: "ACTIVE",

      ...(q
        ? {
            OR: [
              {
                name: {
                  contains: q,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: q,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),

      ...(member === "me"
        ? {
            members: {
              some: {
                userId: user.id,
              },
            },
          }
        : {}),
    };

    // Verifica se o cursor pertence ao resultado filtrado.
    if (cursor) {
      const cursorGroup = await prisma.group.findFirst({
        where: {
          id: cursor,
          ...where,
        },
        select: { id: true },
      });

      if (!cursorGroup) {
        return NextResponse.json(
          { error: "Cursor inválido ou grupo não encontrado." },
          { status: 400 },
        );
      }
    }

    const groups = await prisma.group.findMany({
      where,
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
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
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    const hasMore = groups.length > limit;
    const data = hasMore ? groups.slice(0, limit) : groups;

    return NextResponse.json({
      data,
      pagination: {
        limit,
        nextCursor: hasMore ? data[data.length - 1].id : null,
      },
    });
  } catch (error) {
    console.error("[GET /api/groups]", error);

    return NextResponse.json(
      { error: "Não foi possível listar os grupos." },
      { status: 500 },
    );
  }
}
