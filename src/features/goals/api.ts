import { type ApiResult, fetchApi } from "@/lib/api-client";
import type { Goal, GoalInput } from "./types";

// Chamadas às rotas de metas (src/app/api/groups/[groupId]/goals) a partir dos Client
// Components. Como o fetchApi, nunca lançam erro: devolvem { ok, data } ou { ok, error }.

function goalsUrl(groupId: string, goalId?: string): string {
    const base = `/api/groups/${encodeURIComponent(groupId)}/goals`;
    return goalId ? `${base}/${encodeURIComponent(goalId)}` : base;
}

export function listGroupGoals(groupId: string, signal?: AbortSignal): Promise<ApiResult<Goal[]>> {
    return fetchApi<Goal[]>(goalsUrl(groupId), { signal, cache: "no-store" });
}

export function createGoal(groupId: string, input: GoalInput): Promise<ApiResult<Goal>> {
    return fetchApi<Goal>(goalsUrl(groupId), { method: "POST", json: input });
}

export function updateGoal(groupId: string, goalId: string, input: GoalInput): Promise<ApiResult<Goal>> {
    return fetchApi<Goal>(goalsUrl(groupId, goalId), { method: "PATCH", json: input });
}

export function deleteGoal(groupId: string, goalId: string): Promise<ApiResult<unknown>> {
    return fetchApi(goalsUrl(groupId, goalId), { method: "DELETE" });
}

// Concluir (PATCH) ou reabrir (DELETE) a mesma rota.
export function setGoalCompleted(groupId: string, goalId: string, completed: boolean): Promise<ApiResult<Goal>> {
    return fetchApi<Goal>(`${goalsUrl(groupId, goalId)}/complete`, { method: completed ? "PATCH" : "DELETE" });
}
