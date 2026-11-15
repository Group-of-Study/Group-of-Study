"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { ApiResult } from "@/lib/api-client";
import { createGoal, deleteGoal, listGroupGoals, setGoalCompleted, updateGoal } from "./api";
import type { Goal, GoalInput } from "./types";

export type GoalsLoadState = "loading" | "ready" | "forbidden" | "error";

// Estado das metas de um grupo, dividido entre a visão geral ("Metas da semana") e a
// aba "Metas" da página do grupo: as duas mostram a mesma lista e os mesmos modais.
// `reloadKey` muda quando a pessoa entra ou sai do grupo (a lista depende disso).
export function useGroupGoals(groupId: string, reloadKey = 0) {
    const toast = useToast();
    const [attempt, setAttempt] = useState(0);
    // O resultado guarda a qual carga ele responde (key). Enquanto a carga atual não
    // chega, o estado é "loading" (derivado, sem setState dentro do efeito).
    const key = `${groupId}|${reloadKey}|${attempt}`;
    const [loaded, setLoaded] = useState<{
        key: string;
        state: Exclude<GoalsLoadState, "loading">;
        goals: Goal[];
        error: string | null;
    } | null>(null);
    const current = loaded?.key === key ? loaded : null;
    const state: GoalsLoadState = current?.state ?? "loading";
    const goals = current?.goals ?? [];
    const error = current?.error ?? null;
    // Meta com uma ação em andamento (o checkbox e os botões dela ficam desabilitados).
    const [busyId, setBusyId] = useState<string | null>(null);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Goal | null>(null);
    const [deleting, setDeleting] = useState<Goal | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        listGroupGoals(groupId, controller.signal).then((result) => {
            if (controller.signal.aborted) return;
            if (result.ok) {
                setLoaded({ key, state: "ready", goals: result.data, error: null });
            } else {
                // 403: a pessoa não participa do grupo (as metas são só dos membros).
                const state = result.status === 403 ? "forbidden" : "error";
                setLoaded({ key, state, goals: [], error: result.error });
            }
        });
        return () => controller.abort();
    }, [groupId, key]);

    // Mudanças locais (criar, editar, concluir, excluir) sem recarregar a lista.
    function setGoals(update: (goals: Goal[]) => Goal[]) {
        setLoaded((previous) => (previous ? { ...previous, goals: update(previous.goals) } : previous));
    }

    const reload = useCallback(() => setAttempt((n) => n + 1), []);

    function replace(goal: Goal) {
        setGoals((list) => list.map((item) => (item.id === goal.id ? goal : item)));
    }

    async function toggle(goal: Goal) {
        setBusyId(goal.id);
        const result = await setGoalCompleted(groupId, goal.id, goal.status === "PENDING");
        setBusyId(null);
        if (result.ok) replace(result.data);
        else toast.fromResult(result);
    }

    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(goal: Goal) {
        setEditing(goal);
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditing(null);
    }

    async function submit(input: GoalInput): Promise<ApiResult<Goal>> {
        const result = editing ? await updateGoal(groupId, editing.id, input) : await createGoal(groupId, input);
        if (result.ok) {
            if (editing) replace(result.data);
            else setGoals((list) => [result.data, ...list]);
            toast.success(editing ? "Meta atualizada." : "Meta criada.");
            closeForm();
        }
        return result;
    }

    async function confirmDelete() {
        if (!deleting) return;
        setDeleteBusy(true);
        const result = await deleteGoal(groupId, deleting.id);
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

export type GroupGoalsController = ReturnType<typeof useGroupGoals>;
