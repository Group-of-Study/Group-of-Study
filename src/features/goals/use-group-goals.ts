"use client";

import { listGroupGoals } from "./api";
import type { Goal } from "./types";
import { type GoalsController, useGoalsController } from "./use-goals";

export type { GoalsLoadState } from "./use-goals";

// Metas de um grupo, divididas entre a visão geral ("Metas da semana") e a aba "Metas"
// da página do grupo: as duas mostram a mesma lista e os mesmos modais.
// `reloadKey` muda quando a pessoa entra ou sai do grupo (a lista depende disso).
export function useGroupGoals(groupId: string, reloadKey = 0): GroupGoalsController {
    return useGoalsController<Goal>({
        key: `${groupId}|${reloadKey}`,
        load: (signal) => listGroupGoals(groupId, signal),
        groupIdOf: () => groupId,
        decorate: (goal) => goal,
    });
}

export type GroupGoalsController = GoalsController<Goal>;
