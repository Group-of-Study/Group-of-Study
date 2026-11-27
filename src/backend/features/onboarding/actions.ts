"use server";

import { refresh } from "next/cache";
import { prisma } from "@/backend/lib/prisma";
import { requireSession } from "@/backend/lib/session";

// "Pular" ou "Fechar" no checklist do Início (GOS-040). Fica salvo na conta, então
// o checklist não volta em nenhum aparelho.
export async function dismissOnboardingAction(): Promise<void> {
    const { user } = await requireSession();
    try {
        await prisma.user.update({
            where: { id: user.id },
            data: { onboardingDoneAt: new Date() },
        });
    } catch (error) {
        // Falhou ao salvar: o checklist continua na tela e a pessoa pode tentar de novo.
        console.error("[onboarding] dismiss falhou", error);
        return;
    }
    refresh();
}
