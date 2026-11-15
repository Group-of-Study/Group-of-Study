import { NextResponse } from "next/server";

import { checkSessionAccess } from "@/features/sessions/access";
import { sessionInputSchema, toIssues } from "@/features/sessions/schema";
import { SESSION_SELECT } from "@/features/sessions/session-select";
import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ groupId: string; sessionId: string }>;
};

// Encontro deste grupo (o id de outro grupo dá 404, nunca edita o encontro alheio).
function findSession(groupId: string, sessionId: string) {
  return prisma.studySession.findFirst({
    where: { id: sessionId, groupId },
    select: { id: true, endsAt: true },
  });
}

// PATCH: editar encontro (somente o líder). Recebe o encontro inteiro, como o POST.
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.id) {
      return unauthorized();
    }

    const { groupId, sessionId } = await params;
    const access = await checkSessionAccess(groupId, user.id, { manage: true });

    if (!access.ok) {
      return access.response;
    }

    const existing = await findSession(groupId, sessionId);

    if (!existing) {
      return NextResponse.json(
        { error: "Encontro não encontrado neste grupo." },
        { status: 404 },
      );
    }

    // O que já aconteceu fica como registro; dá para excluir, não para editar.
    if (existing.endsAt <= new Date()) {
      return NextResponse.json(
        { error: "Este encontro já aconteceu e não pode mais ser editado." },
        { status: 409 },
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

    const validation = sessionInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: toIssues(validation.error) },
        { status: 400 },
      );
    }

    const updated = await prisma.studySession.update({
      where: { id: sessionId },
      data: validation.data,
      select: SESSION_SELECT,
    });

    return NextResponse.json({ message: "Encontro atualizado.", data: updated });
  } catch (error) {
    console.error("[PATCH /api/groups/:groupId/sessions/:sessionId]", error);

    return NextResponse.json(
      { error: "Não foi possível atualizar o encontro." },
      { status: 500 },
    );
  }
}

// DELETE: excluir encontro (somente o líder)
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user?.id) {
      return unauthorized();
    }

    const { groupId, sessionId } = await params;
    const access = await checkSessionAccess(groupId, user.id, { manage: true });

    if (!access.ok) {
      return access.response;
    }

    // deleteMany com o groupId no where: só apaga se o encontro for deste grupo.
    const { count } = await prisma.studySession.deleteMany({
      where: { id: sessionId, groupId },
    });

    if (count === 0) {
      return NextResponse.json(
        { error: "Encontro não encontrado neste grupo." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Encontro excluído.",
      data: { sessionId, groupId },
    });
  } catch (error) {
    console.error("[DELETE /api/groups/:groupId/sessions/:sessionId]", error);

    return NextResponse.json(
      { error: "Não foi possível excluir o encontro." },
      { status: 500 },
    );
  }
}
