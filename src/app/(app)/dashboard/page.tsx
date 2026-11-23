import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Users } from "lucide-react";
import GroupCard from "@/frontend/components/groups/GroupCard";
import { OnboardingChecklist } from "@/frontend/features/onboarding/components/onboarding-checklist";
import { buildOnboarding } from "@/shared/features/onboarding/steps";
import { prisma } from "@/backend/lib/prisma";
import { requireSession } from "@/backend/lib/session";
import type { Group } from "@/shared/types/group";

export const metadata: Metadata = {
    title: "Início | Group of Study",
};

// Início (GOS-040). Por enquanto: o checklist "Primeiros passos" de quem acabou de
// chegar (Figma: 11 · Início — novo usuário) e os grupos da pessoa. O resto do
// Figma 01 · Dashboard (nível, XP, sequência, ranking) depende da gamificação (GOS-044).
export default function DashboardPage() {
    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 lg:px-8 lg:py-8">
            {/* A sessão só existe na hora do request: fica dentro do <Suspense>. */}
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardContent />
            </Suspense>
        </div>
    );
}

async function DashboardContent() {
    const { user } = await requireSession();

    const account = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            onboardingDoneAt: true,
            memberships: {
                where: { group: { status: "ACTIVE" } },
                orderBy: { joinedAt: "desc" },
                select: {
                    group: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            createdAt: true,
                            creator: { select: { id: true, name: true } },
                            leader: { select: { id: true, name: true } },
                            _count: { select: { members: true } },
                        },
                    },
                },
            },
        },
    });

    const groups: Group[] = (account?.memberships ?? []).map(({ group }) => ({
        ...group,
        createdAt: group.createdAt.toISOString(),
    }));
    const showOnboarding = !account?.onboardingDoneAt;
    const firstName = user.name.trim().split(/\s+/)[0];

    return (
        <>
            <header className="flex flex-col gap-1">
                <h1 className="text-h2 text-text-primary">
                    {showOnboarding ? `Boas-vindas, ${firstName}!` : `Olá, ${firstName}!`}
                </h1>
                <p className="text-body-sm text-text-secondary">
                    {showOnboarding
                        ? "Vamos configurar seu espaço de estudos em poucos passos."
                        : "Seus grupos de estudo estão aqui."}
                </p>
            </header>

            {showOnboarding && <OnboardingChecklist onboarding={buildOnboarding({ groupsCount: groups.length })} />}

            <section aria-labelledby="seus-grupos" className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 id="seus-grupos" className="text-h4 text-text-primary">
                        Seus grupos
                    </h2>
                    {groups.length > 0 && (
                        <Link href="/grupos" className="text-label-md text-text-brand hover:underline">
                            Ver grupos
                        </Link>
                    )}
                </div>

                {groups.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {groups.map((group) => (
                            <GroupCard key={group.id} group={group} />
                        ))}
                    </div>
                ) : (
                    <NoGroups />
                )}
            </section>
        </>
    );
}

// Figma: 11 · Início — novo usuário › "Você ainda não está em nenhum grupo".
function NoGroups() {
    const link =
        "inline-flex h-10 items-center gap-2 rounded-md px-4 text-label-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus";

    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-default bg-bg-surface px-6 py-12 text-center">
            <span
                aria-hidden
                className="flex size-14 items-center justify-center rounded-xl bg-bg-brand-subtle text-text-brand"
            >
                <Users size={28} />
            </span>
            <p className="text-h4 text-text-primary">Você ainda não está em nenhum grupo</p>
            <p className="max-w-md text-body-sm text-text-secondary">
                Crie um grupo para estudar com amigos ou explore grupos abertos da comunidade.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Link
                    href="/grupos"
                    className={`${link} border border-border-default bg-bg-surface text-text-primary hover:bg-bg-subtle`}
                >
                    Explorar grupos
                </Link>
                <Link href="/grupos/novo" className={`${link} bg-bg-brand text-text-on-brand hover:bg-bg-brand-hover`}>
                    <Plus size={18} aria-hidden />
                    Criar grupo
                </Link>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div aria-hidden className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <div className="h-8 w-64 animate-pulse rounded-md bg-bg-muted" />
                <div className="h-5 w-80 animate-pulse rounded-md bg-bg-subtle" />
            </div>
            <div className="h-72 animate-pulse rounded-xl bg-bg-subtle" />
        </div>
    );
}
