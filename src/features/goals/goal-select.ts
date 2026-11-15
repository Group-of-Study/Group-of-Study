import type { Prisma } from "@/generated/prisma/client";

// Formato de uma meta em todas as respostas da API de metas (listar, criar, editar,
// concluir, reabrir). O front troca a meta da lista pela resposta, então todas as
// rotas precisam devolver os mesmos campos. Tipo do lado do front: src/features/goals/types.ts.
export const GOAL_SELECT = {
    id: true,
    title: true,
    description: true,
    dueDate: true,
    status: true,
    completedAt: true,
    createdAt: true,
    updatedAt: true,
    author: {
        select: {
            id: true,
            name: true,
        },
    },
} satisfies Prisma.GoalSelect;
