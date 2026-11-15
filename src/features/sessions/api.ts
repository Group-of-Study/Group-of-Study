import { type ApiResult, fetchApi } from "@/lib/api-client";
import type { StudySession, StudySessionInput } from "./types";

// Chamadas à API da agenda (src/app/api/groups/[groupId]/sessions). Como o fetchApi,
// nunca lançam erro: devolvem { ok, data } ou { ok, error }.

function sessionsUrl(groupId: string, sessionId?: string): string {
    const base = `/api/groups/${encodeURIComponent(groupId)}/sessions`;
    return sessionId ? `${base}/${encodeURIComponent(sessionId)}` : base;
}

export function listSessions(
    groupId: string,
    when: "upcoming" | "past",
    signal?: AbortSignal,
): Promise<ApiResult<StudySession[]>> {
    const url = when === "past" ? `${sessionsUrl(groupId)}?when=past` : sessionsUrl(groupId);
    return fetchApi<StudySession[]>(url, { signal, cache: "no-store" });
}

export function createSession(groupId: string, input: StudySessionInput): Promise<ApiResult<StudySession>> {
    return fetchApi<StudySession>(sessionsUrl(groupId), { method: "POST", json: input });
}

export function updateSession(
    groupId: string,
    sessionId: string,
    input: StudySessionInput,
): Promise<ApiResult<StudySession>> {
    return fetchApi<StudySession>(sessionsUrl(groupId, sessionId), { method: "PATCH", json: input });
}

export function deleteSession(groupId: string, sessionId: string): Promise<ApiResult<unknown>> {
    return fetchApi(sessionsUrl(groupId, sessionId), { method: "DELETE" });
}
