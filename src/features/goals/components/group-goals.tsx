"use client";

import { ChevronRight, Plus, RefreshCw, Target } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { GroupDetails } from "@/types/group";
import { sortGoals, weekGoals } from "../dates";
import type { Goal } from "../types";
import type { GroupGoalsController } from "../use-group-goals";
import { GoalDeleteDialog } from "./goal-delete-dialog";
import { GoalFormDialog } from "./goal-form-dialog";
import { GoalItem } from "./goal-item";

// Metas dentro da página do grupo (Figma: Grupo — Visão geral › "Metas da semana" e a
// aba "Metas"). As regras de permissão espelham as da API:
// - ver, criar, concluir e reabrir: participantes, com o grupo ativo;
// - editar e excluir: quem criou a meta ou o líder.

type GroupGoalsProps = {
    controller: GroupGoalsController;
    group: GroupDetails;
    isMember: boolean;
    isLeader: boolean;
};

const WEEK_LIMIT = 4;

// "Agora" fica fixo enquanto a página está aberta (rótulos como "Hoje, 19h").
function useNow(): Date {
    const [now] = useState(() => new Date());
    return now;
}

function GoalList({
    goals,
    controller,
    group,
    isLeader,
}: {
    goals: Goal[];
    controller: GroupGoalsController;
    group: GroupDetails;
    isLeader: boolean;
}) {
    const now = useNow();
    const active = group.status === "ACTIVE";

    return (
        <ul className="flex flex-col gap-2">
            {goals.map((goal) => {
                const mine = goal.author?.id === group.currentUserId;
                return (
                    <GoalItem
                        key={goal.id}
                        goal={goal}
                        now={now}
                        context={`Criada por ${mine ? "você" : (goal.author?.name ?? "Conta excluída")}`}
                        canToggle={active}
                        canEdit={active && (mine || isLeader)}
                        busy={controller.busyId === goal.id}
                        onToggle={controller.toggle}
                        onEdit={controller.form.openEdit}
                        onDelete={controller.removal.ask}
                    />
                );
            })}
        </ul>
    );
}

// Carregando, erro ou "não participa": o mesmo para a visão geral e a aba.
function GoalsStatus({ controller, isMember }: { controller: GroupGoalsController; isMember: boolean }) {
    if (!isMember || controller.state === "forbidden") {
        return (
            <EmptyState
                icon={<Target size={28} className="text-text-brand" aria-hidden />}
                title="Metas são só para participantes"
                description="Entre no grupo para ver as metas e criar as suas."
            />
        );
    }
    if (controller.state === "loading") {
        return (
            <div aria-hidden className="flex flex-col gap-2">
                {[0, 1, 2].map((item) => (
                    <div key={item} className="h-16 rounded-xl bg-bg-subtle motion-safe:animate-pulse" />
                ))}
            </div>
        );
    }
    return (
        <EmptyState
            icon={<Target size={28} className="text-text-brand" aria-hidden />}
            title="Não foi possível carregar as metas"
            description={controller.error ?? "Tente novamente."}
        >
            <Button variant="ds-secondary" size="ds-md" onClick={controller.reload} leadingIcon={<RefreshCw size={16} aria-hidden />}>
                Tentar novamente
            </Button>
        </EmptyState>
    );
}

function NewGoalButton({ controller, size = "ds-md" }: { controller: GroupGoalsController; size?: "ds-sm" | "ds-md" }) {
    return (
        <Button variant="primary" size={size} onClick={controller.form.openCreate} leadingIcon={<Plus size={16} aria-hidden />}>
            Nova meta
        </Button>
    );
}

// Aba "Metas": todas as metas, pendentes e concluídas.
export function GroupGoalsTab({ controller, group, isMember, isLeader }: GroupGoalsProps) {
    const active = group.status === "ACTIVE";
    const ready = isMember && controller.state === "ready";
    const sorted = sortGoals(controller.goals);
    const pending = sorted.filter((goal) => goal.status === "PENDING");
    const completed = sorted.filter((goal) => goal.status === "COMPLETED");

    return (
        <section aria-labelledby="metas-titulo" className="flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 id="metas-titulo" className="text-h3 text-foreground">
                        Metas do grupo
                    </h2>
                    <p className="mt-1 text-body-sm text-text-secondary">
                        {active
                            ? "Passos concretos que o grupo combinou. Marque quando concluir."
                            : "O grupo não está ativo: as metas ficam só para consulta."}
                    </p>
                </div>
                {ready && active && <NewGoalButton controller={controller} />}
            </header>

            {!ready ? (
                <GoalsStatus controller={controller} isMember={isMember} />
            ) : controller.goals.length === 0 ? (
                <EmptyState
                    icon={<Target size={28} className="text-text-brand" aria-hidden />}
                    title="Nenhuma meta ainda"
                    description="Crie a primeira meta do grupo: algo que dê para fazer em poucos dias."
                >
                    {active && <NewGoalButton controller={controller} />}
                </EmptyState>
            ) : (
                <>
                    <GoalSection title="Pendentes" count={pending.length} empty="Tudo em dia! Nenhuma meta pendente.">
                        <GoalList goals={pending} controller={controller} group={group} isLeader={isLeader} />
                    </GoalSection>
                    {completed.length > 0 && (
                        <GoalSection title="Concluídas" count={completed.length}>
                            <GoalList goals={completed} controller={controller} group={group} isLeader={isLeader} />
                        </GoalSection>
                    )}
                </>
            )}
        </section>
    );
}

function GoalSection({
    title,
    count,
    empty,
    children,
}: {
    title: string;
    count: number;
    empty?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-label-md text-foreground">
                {title}
                <span className="rounded-full bg-bg-muted px-2 py-0.5 text-caption text-text-secondary">{count}</span>
            </h3>
            {count === 0 && empty ? <p className="text-body-sm text-text-secondary">{empty}</p> : children}
        </div>
    );
}

// Visão geral: até 4 metas da semana (pendentes até domingo, atrasadas e concluídas desde segunda).
export function GroupWeekGoals({ controller, group, isMember, isLeader, onSeeAll }: GroupGoalsProps & { onSeeAll: () => void }) {
    const now = useNow();
    const ready = isMember && controller.state === "ready";
    const week = ready ? weekGoals(controller.goals, now) : [];

    return (
        <section aria-labelledby="metas-semana-titulo" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <h2 id="metas-semana-titulo" className="text-h4 text-foreground">
                    Metas da semana
                </h2>
                {ready && (
                    <button
                        type="button"
                        onClick={onSeeAll}
                        className="inline-flex items-center gap-1 text-label-sm text-text-brand hover:underline"
                    >
                        Ver todas
                        <ChevronRight size={15} aria-hidden />
                    </button>
                )}
            </div>

            {!ready ? (
                <GoalsStatus controller={controller} isMember={isMember} />
            ) : week.length === 0 ? (
                <EmptyState
                    icon={<Target size={28} className="text-text-brand" aria-hidden />}
                    title="Nenhuma meta para esta semana"
                    description={
                        controller.goals.length > 0
                            ? "As metas pendentes têm prazo depois de domingo ou não têm prazo."
                            : "Quando uma meta for criada, ela aparece aqui para todo o grupo acompanhar."
                    }
                >
                    {group.status === "ACTIVE" && <NewGoalButton controller={controller} />}
                </EmptyState>
            ) : (
                <GoalList goals={week.slice(0, WEEK_LIMIT)} controller={controller} group={group} isLeader={isLeader} />
            )}
        </section>
    );
}

// Modais de criar/editar e de confirmar a exclusão (uma vez por página).
export function GroupGoalDialogs({ controller, groupId }: { controller: GroupGoalsController; groupId: string }) {
    const { form, removal } = controller;

    return (
        <>
            <GoalFormDialog open={form.open} goal={form.editing} onClose={form.close} onSubmit={(input) => form.submit(input, groupId)} />
            <GoalDeleteDialog removal={removal} />
        </>
    );
}

// Números para os cards e a aba ("Metas 12").
export function goalCounts(controller: GroupGoalsController): { total: number; completed: number } | null {
    if (controller.state !== "ready") return null;
    return {
        total: controller.goals.length,
        completed: controller.goals.filter((goal) => goal.status === "COMPLETED").length,
    };
}
