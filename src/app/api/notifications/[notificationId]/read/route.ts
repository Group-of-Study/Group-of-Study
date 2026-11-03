import { NextResponse } from "next/server";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ notificationId: string }>;
};

export async function PATCH(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return unauthorized();
    }

    const { notificationId } = await params;

    if (!notificationId || notificationId.trim().length === 0) {
      return NextResponse.json(
        { error: "Identificador da notificação inválido." },
        { status: 400 },
      );
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      select: {
        id: true,
        readAt: true,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificação não encontrada." },
        { status: 404 },
      );
    }

    if (notification.readAt) {
      return NextResponse.json({
        message: "Esta notificação já foi marcada como lida.",
        data: notification,
      });
    }

    const readAt = new Date();

    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: session.user.id,
        readAt: null,
      },
      data: {
        readAt,
      },
    });

    const updatedNotification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      select: {
        id: true,
        readAt: true,
      },
    });

    if (!updatedNotification) {
      return NextResponse.json(
        { error: "Notificação não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Notificação marcada como lida.",
      data: updatedNotification,
    });
  } catch (error) {
    console.error("[PATCH /api/notifications/:notificationId/read]", error);

    return NextResponse.json(
      { error: "Não foi possível marcar a notificação como lida." },
      { status: 500 },
    );
  }
}