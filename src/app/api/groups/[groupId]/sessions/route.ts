import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { checkSessionAccess } from "@/backend/features/sessions/access";
import { sessionInputSchema, toIssues } from "@/shared/features/sessions/schema";
import { SESSION_SELECT } from "@/backend/features/sessions/session-select";
import { getSession, unauthorized } from "@/backend/lib/session";
import { prisma } from "@/backend/lib/prisma";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

// Próximos: ainda não acabaram (do mais próximo ao mais distante).
// Anteriores: já acabaram (do mais recente ao mais antigo).
const ListSessionsSchema = z.object({
  when: z.enum(["upcoming", "past"]).default("upcoming"),
});

const LIMIT = { upcoming: 50, past: 20 } as const;

// GET: agenda do grupo (participantes)
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const query = Object.fromEntries(request.nextUrl.searchParams);
    const session = await getSession();
    const user = session?.user;

    if (!user?.id) {
      return unauthorized();
    }

    const validation = ListSessionsSchema.safeParse(query);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: toIssues(validation.error) },
        { status: 400 },
      );
    }

    const { groupId } = await params;
    const access = await checkSessionAccess(groupId, user.id);

    if (!access.ok) {
      return access.response;
    }

    const { when } = validation.data;
    const now = new Date();

    const sessions = await prisma.studySession.findMany({
      where: {
        groupId,
        endsAt: when === "upcoming" ? { gt: now } : { lte: now },
      },
      orderBy: { startsAt: when === "upcoming" ? "asc" : "desc" },
      take: LIMIT[when],
      select: SESSION_SELECT,
    });

    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error("[GET /api/groups/:groupId/sessions]", error);

    return NextResponse.json(
      { error: "Não foi possível carregar a agenda." },
      { status: 500 },
    );
  }
}

// POST: marcar encontro (somente o líder, grupo ativo)
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.id) {
      return unauthorized();
    }

    const { groupId } = await params;
    const access = await checkSessionAccess(groupId, user.id, { manage: true });

    if (!access.ok) {
      return access.response;
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

    const validation = sessionInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: toIssues(validation.error) },
        { status: 400 },
      );
    }

    const created = await prisma.studySession.create({
      data: {
        ...validation.data,
        groupId,
        createdById: user.id,
      },
      select: SESSION_SELECT,
    });

    return NextResponse.json(
      { message: "Encontro marcado.", data: created },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/groups/:groupId/sessions]", error);

    return NextResponse.json(
      { error: "Não foi possível marcar o encontro." },
      { status: 500 },
    );
  }
}
