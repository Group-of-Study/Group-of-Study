import type { Metadata } from "next";
import { Suspense } from "react";
import { GoalsBoard } from "@/features/goals/components/goals-board";
import type { GoalGroup } from "@/features/goals/types";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
    title: "Metas | Group of Study",
};

// Figma: App / 05 · Metas. Todas as metas dos grupos da pessoa (ver docs/metas.md).
export default function GoalsPage() {
    return (
        // <div>, não <main>: o layout do (app) já tem o <main> da página.
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-h2 text-foreground">Metas</h1>
                <p className="text-body-sm text-text-secondary">Organize o que estudar — sozinho ou com o grupo.</p>
            </header>

            {/* A sessão só existe na hora do request: fica dentro do <Suspense>. */}
            <Suspense fallback={<BoardSkeleton />}>
                <GoalsContent />
            </Suspense>
        </div>
    );
}

async function GoalsContent() {
    const { user } = await requireSession();

    // Grupos da pessoa: o filtro "Todos os grupos" e o campo Grupo do modal. Grupos
    // encerrados não têm participantes, então só sobram ativos e arquivados.
    const memberships = await prisma.groupMember.findMany({
        where: { userId: user.id },
        orderBy: { group: { name: "asc" } },
        select: { group: { select: { id: true, name: true, status: true, leaderId: true } } },
    });
    const groups: GoalGroup[] = memberships.map(({ group }) => group);

    return <GoalsBoard groups={groups} currentUserId={user.id} />;
}

function BoardSkeleton() {
    return (
        <div aria-hidden className="flex flex-col gap-6">
            <div className="h-12 rounded-md bg-bg-subtle motion-safe:animate-pulse" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="h-96 rounded-xl bg-bg-subtle motion-safe:animate-pulse" />
                <div className="h-64 rounded-xl bg-bg-subtle motion-safe:animate-pulse" />
            </div>
        </div>
    );
}
