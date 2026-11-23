"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/frontend/components/ui/toast";
import type { ApiResult } from "@/frontend/lib/api-client";
import { createSession, deleteSession, listSessions, updateSession } from "./api";
import type { StudySession, StudySessionInput } from "@/shared/features/sessions/types";

export type SessionsLoadState = "loading" | "ready" | "forbidden" | "error";

const byStart = (a: StudySession, b: StudySession) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();

// Agenda de um grupo: o card "Próximo encontro" da visão geral e a aba "Agenda" dividem
// a mesma lista e os mesmos modais. Os encontros anteriores só são buscados quando a
// pessoa pede ("Ver encontros anteriores").
export function useGroupSessions(groupId: string, reloadKey = 0) {
    const toast = useToast();
    const [attempt, setAttempt] = useState(0);
    // O resultado guarda a qual carga ele responde; enquanto a atual não chega, "loading".
    const key = `${groupId}|${reloadKey}|${attempt}`;
    const [loaded, setLoaded] = useState<{
        key: string;
        state: Exclude<SessionsLoadState, "loading">;
        sessions: StudySession[];
        error: string | null;
    } | null>(null);
    const current = loaded?.key === key ? loaded : null;
    const state: SessionsLoadState = current?.state ?? "loading";
    const sessions = current?.sessions ?? [];

    const [past, setPast] = useState<{ key: string; sessions: StudySession[] } | null>(null);
    const [pastLoading, setPastLoading] = useState(false);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<StudySession | null>(null);
    const [deleting, setDeleting] = useState<StudySession | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        listSessions(groupId, "upcoming", controller.signal).then((result) => {
            if (controller.signal.aborted) return;
            if (result.ok) {
                setLoaded({ key, state: "ready", sessions: result.data, error: null });
            } else {
                // 403: a pessoa não participa do grupo (a agenda é só dos membros).
                const failed = result.status === 403 ? "forbidden" : "error";
                setLoaded({ key, state: failed, sessions: [], error: result.error });
            }
        });
        return () => controller.abort();
    }, [groupId, key]);

    const reload = useCallback(() => setAttempt((n) => n + 1), []);

    function setSessions(update: (list: StudySession[]) => StudySession[]) {
        setLoaded((previous) => (previous ? { ...previous, sessions: update(previous.sessions).sort(byStart) } : previous));
    }

    async function loadPast() {
        setPastLoading(true);
        const result = await listSessions(groupId, "past");
        setPastLoading(false);
        if (result.ok) setPast({ key, sessions: result.data });
        else toast.fromResult(result);
    }

    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(session: StudySession) {
        setEditing(session);
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditing(null);
    }

    async function submit(input: StudySessionInput): Promise<ApiResult<StudySession>> {
        const result = editing
            ? await updateSession(groupId, editing.id, input)
            : await createSession(groupId, input);
        if (result.ok) {
            const saved = result.data;
            setSessions((list) => (editing ? list.map((item) => (item.id === saved.id ? saved : item)) : [...list, saved]));
            toast.success(editing ? "Encontro atualizado." : "Encontro marcado.");
            closeForm();
        }
        return result;
    }

    async function confirmDelete() {
        if (!deleting) return;
        setDeleteBusy(true);
        const result = await deleteSession(groupId, deleting.id);
        setDeleteBusy(false);
        toast.fromResult(result, { success: "Encontro excluído." });
        if (result.ok) {
            const removedId = deleting.id;
            setSessions((list) => list.filter((item) => item.id !== removedId));
            setPast((previous) =>
                previous ? { ...previous, sessions: previous.sessions.filter((item) => item.id !== removedId) } : previous,
            );
            setDeleting(null);
        }
    }

    return {
        sessions,
        state,
        error: current?.error ?? null,
        reload,
        // Anteriores: null enquanto não foram pedidos (ou a lista recarregou).
        past: past?.key === key ? past.sessions : null,
        pastLoading,
        loadPast,
        form: { open: formOpen, editing, openCreate, openEdit, close: closeForm, submit },
        removal: {
            session: deleting,
            busy: deleteBusy,
            ask: setDeleting,
            cancel: () => setDeleting(null),
            confirm: confirmDelete,
        },
    };
}

export type GroupSessionsController = ReturnType<typeof useGroupSessions>;
