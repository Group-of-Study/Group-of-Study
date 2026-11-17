import type { Prisma } from "@/generated/prisma/client";

// Formato de um encontro em todas as respostas da API da agenda.
export const SESSION_SELECT = {
    id: true,
    title: true,
    description: true,
    startsAt: true,
    endsAt: true,
    location: true,
    link: true,
    createdAt: true,
    updatedAt: true,
    createdBy: {
        select: {
            id: true,
            name: true,
        },
    },
} satisfies Prisma.StudySessionSelect;
