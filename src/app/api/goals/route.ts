import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { GOAL_WITH_GROUP_SELECT } from "@/features/goals/goal-select";
import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Concluídas entram só a partir desta data (padrão: 30 dias), para a lista não crescer
// para sempre; as pendentes vêm todas. Mais de 90 dias não é aceito.
const DEFAULT_COMPLETED_DAYS = 30;
const MAX_COMPLETED_DAYS = 90;
// Teto de segurança: ninguém tem tantas metas abertas nos grupos.
const MAX_GOALS = 500;

const DAY_MS = 24 * 60 * 60 * 1000;

const ListMyGoalsSchema = z.object({
  completedSince: z.coerce.date().optional(),
  groupId: z.string().trim().min(1).max(100).optional(),
});

// GET: metas de todos os grupos de que a pessoa participa (página /metas).
// Cada meta vem com o grupo (nome, status e líder) para a tela saber o que mostrar
// e quem pode editar.
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const session = await getSession();
    const user = session?.user;

    if (!user?.id) {
      return unauthorized();
    }

    const validation = ListMyGoalsSchema.safeParse(params);

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

    const now = Date.now();
    const oldest = new Date(now - MAX_COMPLETED_DAYS * DAY_MS);
    const requested =
      validation.data.completedSince ?? new Date(now - DEFAULT_COMPLETED_DAYS * DAY_MS);
    const completedSince = requested < oldest ? oldest : requested;
    const { groupId } = validation.data;

    const goals = await prisma.goal.findMany({
      where: {
        // Só grupos de que a pessoa participa (grupos encerrados não têm participantes).
        group: { members: { some: { userId: user.id } } },
        ...(groupId && { groupId }),
        OR: [
          { status: "PENDING" },
          { status: "COMPLETED", completedAt: { gte: completedSince } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: MAX_GOALS,
      select: GOAL_WITH_GROUP_SELECT,
    });

    return NextResponse.json({
      data: goals,
      completedSince: completedSince.toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/goals]", error);

    return NextResponse.json(
      { error: "Não foi possível listar as metas." },
      { status: 500 },
    );
  }
}
