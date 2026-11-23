"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { ApiResult } from "@/lib/api-client";
import { createGoal, deleteGoal, setGoalCompleted, updateGoal } from "./api";
import type { Goal, GoalInput } from "./types";

export type GoalsLoadState = "loading" | "ready" | "forbidden" | "error";

type GoalsControllerOptions<T extends Goal> = {
    // Muda quando a lista precisa ser carregada de novo (outro grupo, entrou/saiu...).
    key: string;
    load: (signal: AbortSignal) => Promise<ApiResult<T[]>>;
    // Grupo da meta (as rotas de editar, concluir e excluir são por grupo).
    groupIdOf: (goal: T) => string;
    // A API devolve só a meta; na página /metas cada item também leva o grupo.
    decorate: (goal: Goal, groupId: string) => T;
};

// Estado de uma lista de metas e dos modais de criar/editar/excluir. Usado pela página
// do grupo (useGroupGoals) e pela página /metas (todas as metas dos meus grupos).
export function useGoalsController<T extends Goal>({ key, load, groupIdOf, decorate }: GoalsControllerOptions<T>) {
    const toast = useToast();
    const [attempt, setAttempt] = useState(0);
    // O resultado guarda a qual carga ele responde. Enquanto a carga atual não chega,
    // o estado é "loading" (derivado, sem setState dentro do efeito).
    const loadKey = `${key}|${attempt}`;
    const [loaded, setLoaded] = useState<{
        key: string;
        state: Exclude<GoalsLoadState, "loading">;
        goals: T[];
        error: string | null;
    } | null>(null);
    const current = loaded?.key === loadKey ? loaded : null;
    const state: GoalsLoadState = current?.state ?? "loading";
    const goals = current?.goals ?? [];
    const error = current?.error ?? null;

    // Meta com uma ação em andamento (o checkbox e os botões dela ficam desabilitados).
    const [busyId, setBusyId] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<T | null>(null);
    const [deleting, setDeleting] = useState<T | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    // A função de carregar muda a cada render; só a key decide quando recarregar.
    const runLoad = useEffectEvent((signal: AbortSignal) => load(signal));

    useEffect(() => {
        const controller = new AbortController();
        runLoad(controller.signal).then((result) => {
            if (controller.signal.aborted) return;
            if (result.ok) {
                setLoaded({ key: loadKey, state: "ready", goals: result.data, error: null });
            } else {
                // 403: a pessoa não participa do grupo (as metas são só dos membros).
                const failed = result.status === 403 ? "forbidden" : "error";
                setLoaded({ key: loadKey, state: failed, goals: [], error: result.error });
            }
        });
        return () => controller.abort();
    }, [loadKey]);

    const reload = useCallback(() => setAttempt((n) => n + 1), []);

    // Mudanças locais (criar, editar, concluir, excluir) sem recarregar a lista.
    function setGoals(update: (list: T[]) => T[]) {
        setLoaded((previous) => (previous ? { ...previous, goals: update(previous.goals) } : previous));
    }

    // Junta a resposta da API com o que a lista já tinha (ex.: o grupo, na página /metas).
    function replace(goal: Goal) {
        setGoals((list) => list.map((item) => (item.id === goal.id ? { ...item, ...goal } : item)));
    }

    async function toggle(goal: T) {
        setBusyId(goal.id);
        const result = await setGoalCompleted(groupIdOf(goal), goal.id, goal.status === "PENDING");
        setBusyId(null);
        if (result.ok) replace(result.data);
        else toast.fromResult(result);
    }

    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(goal: T) {
        setEditing(goal);
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditing(null);
    }

    // groupId: em que grupo criar (na edição, o grupo é o da própria meta).
    async function submit(input: GoalInput, groupId: string): Promise<ApiResult<Goal>> {
        const result = editing
            ? await updateGoal(groupIdOf(editing), editing.id, input)
            : await createGoal(groupId, input);
        if (result.ok) {
            if (editing) replace(result.data);
            else setGoals((list) => [decorate(result.data, groupId), ...list]);
            toast.success(editing ? "Meta atualizada." : "Meta criada.");
            closeForm();
        }
        return result;
    }

    async function confirmDelete() {
        if (!deleting) return;
        setDeleteBusy(true);
        const result = await deleteGoal(groupIdOf(deleting), deleting.id);
        setDeleteBusy(false);
        toast.fromResult(result, { success: "Meta excluída." });
        if (result.ok) {
            const removedId = deleting.id;
            setGoals((list) => list.filter((item) => item.id !== removedId));
            setDeleting(null);
        }
    }

    return {
        goals,
        state,
        error,
        reload,
        busyId,
        toggle,
        form: { open: formOpen, editing, openCreate, openEdit, close: closeForm, submit },
        removal: {
            goal: deleting,
            busy: deleteBusy,
            ask: setDeleting,
            cancel: () => setDeleting(null),
            confirm: confirmDelete,
        },
    };
}

export type GoalsController<T extends Goal = Goal> = ReturnType<typeof useGoalsController<T>>;
