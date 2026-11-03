import { NextResponse } from "next/server";

import { getSession, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  try {
    const session = await getSession();

    if (!session?.user.id) {
      return unauthorized();
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Notificações marcadas como lidas.",
      data: {
        updatedCount: result.count,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/notifications/read-all]", error);

    return NextResponse.json(
      { error: "Não foi possível marcar as notificações como lidas." },
      { status: 500 },
    );
  }
}