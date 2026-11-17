// Meta como chega no front (datas em texto ISO). Mesmo formato do GOAL_SELECT da API
// (src/features/goals/goal-select.ts).
export type GoalStatus = "PENDING" | "COMPLETED";

export type Goal = {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    status: GoalStatus;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    // null quando a conta de quem criou foi apagada de vez (GOS-036).
    author: { id: string; name: string } | null;
};

// O que o formulário manda para criar ou editar.
export type GoalInput = {
    title: string;
    description: string | null;
    dueDate: string | null;
};
