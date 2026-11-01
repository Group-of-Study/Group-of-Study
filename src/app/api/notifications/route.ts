import { NextResponse } from "next/server";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");

    const limit = limitParam === null ? 20 : Number(limitParam);

    if (
      limitParam !== null &&
      (!/^\d+$/.test(limitParam) ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100)
    ) {
      return NextResponse.json(
        { error: "O limite deve ser um número entre 1 e 100." },
        { status: 400 },
      );
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
        take: limit,
        select: {
          id: true,
          type: true,
          data: true,
          readAt: true,
          createdAt: true,
        },
      }),

      prisma.notification.count({
        where: {
          userId: session.user.id,
          readAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      data: notifications,
      unreadCount,
      limit,
    });
  } catch (error) {
    console.error("[GET /api/notifications]", error);

    return NextResponse.json(
      { error: "Não foi possível listar as notificações." },
      { status: 500 },
    );
  }
}