import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSession, unauthorized } from "@/lib/session";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

const CreateInviteSchema = z
  .object({
    expiresAt: z.iso.datetime({ offset: true }).nullable().optional(),
    maxUses: z.number().int().positive().max(1000).nullable().optional(),
    recipientId: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

// POST: criar convite (somente o líder)
export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return unauthorized();
    }

    const { groupId } = await params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        leaderId: true,
        status: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupo não encontrado." },
        { status: 404 },
      );
    }

    if (group.leaderId !== session.user.id) {
      return NextResponse.json(
        { error: "Somente o líder pode criar convites." },
        { status: 403 },
      );
    }

    if (group.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Não é possível criar convites para este grupo." },
        { status: 409 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corpo da requisição inválido." },
        { status: 400 },
      );
    }

    const validation = CreateInviteSchema.safeParse(body);

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

    const { recipientId } = validation.data;

    const expiresAt = validation.data.expiresAt
      ? new Date(validation.data.expiresAt)
      : null;

    if (expiresAt && expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "A expiração precisa ser uma data futura." },
        { status: 400 },
      );
    }

    if (recipientId) {
      if (recipientId === session.user.id) {
        return NextResponse.json(
          { error: "Você não pode enviar um convite para si mesmo." },
          { status: 400 },
        );
      }

      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true },
      });

      if (!recipient) {
        return NextResponse.json(
          { error: "Usuário destinatário não encontrado." },
          { status: 404 },
        );
      }

      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: recipientId,
            groupId,
          },
        },
      });

      if (membership) {
        return NextResponse.json(
          { error: "Esse usuário já participa do grupo." },
          { status: 409 },
        );
      }
    }

    const invite = await prisma.$transaction(async (tx) => {
      const createdInvite = await tx.groupInvite.create({
        data: {
          code: randomBytes(24).toString("base64url"),
          expiresAt,
          maxUses: recipientId
            ? 1
            : (validation.data.maxUses ?? null),
          groupId,
          createdById: session.user.id,
          recipientId: recipientId ?? null,
        },
        select: {
          id: true,
          code: true,
          expiresAt: true,
          maxUses: true,
          uses: true,
          recipientId: true,
          createdAt: true,
        },
      });

      if (recipientId) {
        await tx.notification.create({
          data: {
            userId: recipientId,
            type: "GROUP_INVITE",
            data: {
              inviteId: createdInvite.id,
              code: createdInvite.code,
              groupId: group.id,
              groupName: group.name,
              invitedById: session.user.id,
            },
          },
        });
      }

      return createdInvite;
    });

    return NextResponse.json(
      {
        message: "Convite criado com sucesso.",
        data: invite,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/groups/:groupId/invites]", error);

    return NextResponse.json(
      { error: "Erro interno ao criar convite." },
      { status: 500 },
    );
  }
}

// GET: listar convites do grupo (somente o líder)
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
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

    if (group.leaderId !== session.user.id) {
      return NextResponse.json(
        { error: "Somente o líder pode listar os convites." },
        { status: 403 },
      );
    }

    const invites = await prisma.groupInvite.findMany({
      where: { groupId },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        code: true,
        expiresAt: true,
        maxUses: true,
        uses: true,
        revokedAt: true,
        recipientId: true,
        createdAt: true,
        recipient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: invites,
    });
  } catch (error) {
    console.error("[GET /api/groups/:groupId/invites]", error);

    return NextResponse.json(
      { error: "Não foi possível listar os convites." },
      { status: 500 },
    );
  }
}