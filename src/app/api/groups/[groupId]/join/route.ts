
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  try {
  
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Você precisa estar autenticado para entrar em um grupo." },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const { groupId } = await params;

   
    if (!groupId || groupId.trim().length === 0) {
      return NextResponse.json(
        { error: "Identificador do grupo inválido." },
        { status: 400 },
      );
    }

    
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
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
        { error: "Não é possível entrar em um grupo que não está ativo." },
        { status: 409 },
      );
    }

    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      select: { id: true },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Você já participa deste grupo." },
        { status: 409 },
      );
    }

   
    const membership = await prisma.groupMember.create({
      data: {
        userId,
        groupId,
      },
      select: {
        id: true,
        userId: true,
        groupId: true,
        joinedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Você entrou no grupo com sucesso.",
        data: {
          membership,
          group: {
            id: group.id,
            name: group.name,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
  
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Você já participa deste grupo." },
        { status: 409 },
      );
    }

    console.error("[POST /api/groups/:groupId/join]", error);

    return NextResponse.json(
      { error: "Não foi possível entrar no grupo." },
      { status: 500 },
    );
  }
}
