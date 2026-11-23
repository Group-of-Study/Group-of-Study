"use client";

import { Plus, RefreshCw, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listMyGoals } from "../api";
import { formatDayHeading, goalViews, groupByDueDay, undatedGoals, weekRhythm } from "../dates";
import type { GoalGroup, GoalWithGroup } from "../types";
import { useGoalsController } from "../use-goals";
import { GoalDeleteDialog } from "./goal-delete-dialog";
import { GoalFormDialog } from "./goal-form-dialog";
import { GoalItem } from "./goal-item";

// Figma: App / 05 · Metas. Todas as metas dos grupos da pessoa, em abas.
// O painel "XP disponível" fica de fora até a gamificação existir (GOS-044).

const TABS = [
    { id: "week", label: "Esta semana", empty: "Nenhuma meta com prazo nesta semana." },
    { id: "today", label: "Hoje", empty: "Nada para hoje. Que tal adiantar uma meta da semana?" },
    { id: "overdue", label: "Atrasadas", empty: "Nenhuma meta atrasada. Tudo em dia!" },
    { id: "completed", label: "Concluídas", empty: "Nenhuma meta concluída nos últimos 30 dias." },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ALL_GROUPS = "todos";
const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

type GoalsBoardProps = {
    groups: GoalGroup[];
    currentUserId: string;
};

export function GoalsBoard({ groups, currentUserId }: GoalsBoardProps) {
    const [now] = useState(() => new Date());
    const [tab, setTab] = useState<TabId>("week");
    const [groupFilter, setGroupFilter] = useState(ALL_GROUPS);

    const groupsById = new Map(groups.map((group) => [group.id, group]));
    const activeGroups = groups.filter((group) => group.status === "ACTIVE");

    const controller = useGoalsController<GoalWithGroup>({
        key: "minhas-metas",
        load: (signal) => listMyGoals(signal),
        groupIdOf: (goal) => goal.group.id,
        // A meta recém-criada chega sem o grupo: ele vem da lista de grupos da página.
        decorate: (goal, groupId) => ({ ...goal, group: groupsById.get(groupId)! }),
    });

    if (groups.length === 0) {
        return (
            <EmptyState
                icon={<Target size={28} className="text-text-brand" aria-hidden />}
                title="Você ainda não participa de nenhum grupo"
                description="As metas são combinadas dentro dos grupos. Entre em um grupo ou crie o seu."
            >
                <Link href="/grupos" className={buttonClassName({ variant: "primary", size: "ds-md" })}>
                    Ver grupos
                </Link>
            </EmptyState>
        );
    }

    const goals =
        groupFilter === ALL_GROUPS ? controller.goals : controller.goals.filter((goal) => goal.group.id === groupFilter);
    const views = {
        week: goalViews.week(goals, now),
        today: goalViews.today(goals, now),
        overdue: goalViews.overdue(goals, now),
        completed: goalViews.completed(goals),
    };
    const undated = undatedGoals(goals);
    const counts: Record<TabId, number> = {
        week: views.week.length + undated.length,
        today: views.today.length,
        overdue: views.overdue.length,
        completed: views.completed.length,
    };
    const ready = controller.state === "ready";
    // Na criação, o grupo do filtro já vem escolhido (se der para criar nele).
    const defaultGroupId = activeGroups.some((group) => group.id === groupFilter) ? groupFilter : activeGroups[0]?.id;

    function renderList(list: GoalWithGroup[]) {
        return (
            <ul className="flex flex-col gap-2">
                {list.map((goal) => {
                    const active = goal.group.status === "ACTIVE";
                    const canEdit = active && (goal.author?.id === currentUserId || goal.group.leaderId === currentUserId);
                    return (
                        <GoalItem
                            key={goal.id}
                            goal={goal}
                            now={now}
                            context={goal.group.name}
                            canToggle={active}
                            canEdit={canEdit}
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

    function renderTab() {
        if (controller.state === "loading") {
            return (
                <div aria-hidden className="flex flex-col gap-2">
                    {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="h-16 rounded-xl bg-bg-subtle motion-safe:animate-pulse" />
                    ))}
                </div>
            );
        }
        if (!ready) {
            return (
                <EmptyState
                    icon={<Target size={28} className="text-text-brand" aria-hidden />}
                    title="Não foi possível carregar as metas"
                    description={controller.error ?? "Tente novamente."}
                >
                    <Button
                        variant="ds-secondary"
                        size="ds-md"
                        onClick={controller.reload}
                        leadingIcon={<RefreshCw size={16} aria-hidden />}
                    >
                        Tentar novamente
                    </Button>
                </EmptyState>
            );
        }

        const empty = TABS.find((item) => item.id === tab)!.empty;
        if (counts[tab] === 0) {
            return <p className="rounded-xl border border-dashed border-border-default p-6 text-center text-body-sm text-text-secondary">{empty}</p>;
        }

        if (tab !== "week") return renderList(views[tab]);

        // Esta semana: um bloco por dia ("Hoje · qua, 21/10  1/3") e as sem prazo no fim.
        return (
            <div className="flex flex-col gap-6">
                {groupByDueDay(views.week).map(({ day, goals: dayGoals }) => (
                    <DaySection
                        key={day.toISOString()}
                        title={formatDayHeading(day, now)}
                        done={dayGoals.filter((goal) => goal.status === "COMPLETED").length}
                        total={dayGoals.length}
                    >
                        {renderList(dayGoals)}
                    </DaySection>
                ))}
                {undated.length > 0 && (
                    <DaySection title="Sem prazo" done={0} total={undated.length}>
                        {renderList(undated)}
                    </DaySection>
                )}
            </div>
        );
    }

    const rhythm = weekRhythm(goals, now);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div role="tablist" aria-label="Filtrar metas" className="flex flex-1 overflow-x-auto border-b border-border-default">
                    {TABS.map((item) => {
                        const selected = tab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                role="tab"
                                id={`aba-${item.id}`}
                                aria-selected={selected}
                                aria-controls="metas-painel"
                                onClick={() => setTab(item.id)}
                                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-label-md transition ${
                                    selected
                                        ? "border-border-brand text-foreground"
                                        : "border-transparent text-text-secondary hover:text-foreground"
                                }`}
                            >
                                {item.label}
                                {ready && (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-caption ${
                                            selected ? "bg-bg-brand-subtle text-text-brand" : "bg-bg-muted text-text-secondary"
                                        }`}
                                    >
                                        {counts[item.id]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="sr-only" htmlFor="filtro-grupo">
                        Grupo
                    </label>
                    <select
                        id="filtro-grupo"
                        value={groupFilter}
                        onChange={(event) => setGroupFilter(event.target.value)}
                        className="h-11 rounded-md border border-border-default bg-bg-surface px-3 text-body-sm text-foreground outline-none focus:border-[1.5px] focus:border-border-brand focus:shadow-focus sm:w-56"
                    >
                        <option value={ALL_GROUPS}>Todos os grupos</option>
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="primary"
                        size="ds-lg"
                        onClick={controller.form.openCreate}
                        disabled={activeGroups.length === 0}
                        title={activeGroups.length === 0 ? "Seus grupos não estão ativos" : undefined}
                        leadingIcon={<Plus size={18} aria-hidden />}
                    >
                        Nova meta
                    </Button>
                </div>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <section id="metas-painel" role="tabpanel" aria-labelledby={`aba-${tab}`} className="min-w-0">
                    {renderTab()}
                </section>

                <aside className="flex flex-col gap-6">
                    <section aria-labelledby="ritmo-titulo" className="flex flex-col gap-4 rounded-xl border border-border-default bg-bg-surface p-5">
                        <h2 id="ritmo-titulo" className="text-h4 text-foreground">
                            Seu ritmo na semana
                        </h2>
                        <p className="flex items-baseline gap-2 text-text-secondary">
                            <span className="text-h2 text-foreground">
                                {rhythm.done} de {rhythm.total}
                            </span>
                            <span className="text-body-sm">metas concluídas</span>
                        </p>
                        <WeekBars perDay={rhythm.perDay} today={(now.getDay() + 6) % 7} />
                        <p className="text-caption text-text-secondary">
                            Conclusões por dia nos seus grupos. Sem pressa: o importante é a constância.
                        </p>
                    </section>

                    <section className="flex gap-3 rounded-xl bg-bg-info-subtle p-5 text-text-info">
                        <Sparkles size={20} aria-hidden className="mt-0.5 shrink-0" />
                        <div className="flex flex-col gap-1">
                            <h2 className="text-label-md">Dica do grupo</h2>
                            <p className="text-body-sm">
                                Quebre metas grandes em passos de até 30 minutos. Metas pequenas = menos estresse.
                            </p>
                        </div>
                    </section>
                </aside>
            </div>

            <GoalFormDialog
                open={controller.form.open}
                goal={controller.form.editing}
                groups={activeGroups.map(({ id, name }) => ({ id, name }))}
                defaultGroupId={controller.form.editing?.group.id ?? defaultGroupId}
                onClose={controller.form.close}
                onSubmit={(input, groupId) => controller.form.submit(input, groupId ?? defaultGroupId ?? "")}
            />
            <GoalDeleteDialog removal={controller.removal} />
        </div>
    );
}

function DaySection({ title, done, total, children }: { title: string; done: number; total: number; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="flex items-center gap-3 text-label-md text-foreground">
                {title}
                {title !== "Sem prazo" && (
                    <span className="font-mono text-caption text-text-tertiary" aria-label={`${done} de ${total} concluídas`}>
                        {done}/{total}
                    </span>
                )}
                <span aria-hidden className="h-px flex-1 bg-border-default" />
            </h3>
            {children}
        </div>
    );
}

// Barras de segunda a domingo; o dia de hoje fica destacado.
function WeekBars({ perDay, today }: { perDay: number[]; today: number }) {
    const max = Math.max(1, ...perDay);
    return (
        <div className="flex h-32 items-end justify-between gap-2" role="img" aria-label={`Conclusões por dia: ${perDay.join(", ")}`}>
            {perDay.map((count, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-24 w-full items-end">
                        <div
                            className={`w-full rounded-sm ${count > 0 ? (index === today ? "bg-bg-accent" : "bg-bg-brand") : "bg-bg-muted"}`}
                            style={{ height: count > 0 ? `${(count / max) * 100}%` : "4px" }}
                        />
                    </div>
                    <span className={`text-caption ${index === today ? "font-semibold text-text-brand" : "text-text-tertiary"}`}>
                        {WEEKDAYS[index]}
                    </span>
                </div>
            ))}
        </div>
    );
}
