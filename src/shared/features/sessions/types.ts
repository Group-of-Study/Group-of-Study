// Encontro como chega no front (datas em texto ISO). Mesmo formato do SESSION_SELECT.
export type StudySession = {
    id: string;
    title: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    location: string | null;
    link: string | null;
    createdAt: string;
    updatedAt: string;
    // null quando a conta de quem marcou foi apagada.
    createdBy: { id: string; name: string } | null;
};

// O que o formulário manda (o mesmo corpo do POST e do PATCH).
export type StudySessionInput = {
    title: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    location: string | null;
    link: string | null;
};
