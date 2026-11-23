"use client";

import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { Avatar } from "@/frontend/components/ui/avatar";
import { formatDueLabel, isOverdue } from "@/shared/features/goals/dates";
import type { Goal } from "@/shared/features/goals/types";

type GoalItemProps<T extends Goal> = {
    goal: T;
    now: Date;
    // Primeiro item da linha de detalhes: "Grupo X" na página /metas, "Responsável: Ana" no grupo.
    context: string;
    // Concluir/reabrir (qualquer participante de grupo ativo).
    canToggle: boolean;
    // Editar/excluir (autor ou líder).
    canEdit: boolean;
    busy?: boolean;
    onToggle: (goal: T) => void;
    onEdit: (goal: T) => void;
    onDelete: (goal: T) => void;
};

// Figma: linha de meta (Metas e Grupo — Visão geral).
export function GoalItem<T extends Goal>({
    goal,
    now,
    context,
    canToggle,
    canEdit,
    busy = false,
    onToggle,
    onEdit,
    onDelete,
}: GoalItemProps<T>) {
    const done = goal.status === "COMPLETED";
    const late = isOverdue(goal, now);
    const authorName = goal.author?.name ?? "Conta excluída";

    return (
        <li className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-surface px-4 py-3">
            <span className="relative inline-flex size-5 shrink-0">
                <input
                    type="checkbox"
                    checked={done}
                    disabled={!canToggle || busy}
                    onChange={() => onToggle(goal)}
                    aria-label={done ? `Reabrir a meta "${goal.title}"` : `Concluir a meta "${goal.title}"`}
                    className="peer size-5 cursor-pointer appearance-none rounded-sm border-[1.5px] border-border-strong bg-bg-surface checked:border-bg-brand checked:bg-bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:opacity-60"
                />
                <Image
                    src="/icons/check.svg"
                    width={14}
                    height={14}
                    alt=""
                    className="pointer-events-none absolute inset-0 m-auto hidden peer-checked:block"
                />
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className={`truncate text-body-sm font-medium ${done ? "text-text-secondary" : "text-foreground"}`}>
                    {goal.title}
                </p>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-text-secondary">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-bg-brand" />
                        <span className="truncate">{context}</span>
                    </span>
                    <span aria-hidden>·</span>
                    <span className={`inline-flex items-center gap-1 ${late ? "text-text-danger" : ""}`}>
                        <CalendarDays size={13} aria-hidden />
                        {formatDueLabel(goal, now)}
                    </span>
                </p>
            </div>

            {canEdit && (
                <div className="flex shrink-0 items-center">
                    <IconButton label={`Editar a meta "${goal.title}"`} onClick={() => onEdit(goal)} disabled={busy}>
                        <Pencil size={16} aria-hidden />
                    </IconButton>
                    <IconButton label={`Excluir a meta "${goal.title}"`} onClick={() => onDelete(goal)} disabled={busy}>
                        <Trash2 size={16} aria-hidden />
                    </IconButton>
                </div>
            )}

            <span title={`Criada por ${authorName}`} className="shrink-0">
                <Avatar name={authorName} size="sm" />
            </span>
        </li>
    );
}

function IconButton({
    label,
    onClick,
    disabled,
    children,
}: {
    label: string;
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className="rounded-sm p-1.5 text-text-tertiary hover:bg-bg-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-border-focus disabled:opacity-50"
        >
            {children}
        </button>
    );
}
