// Checklist "Primeiros passos" do Início (GOS-040, Figma: 11 · Início — novo usuário).
// Os passos são calculados a partir dos dados da pessoa, então não precisam ser
// salvos um a um: só fica salvo quando ela pula ou fecha o checklist (onboardingDoneAt).

export type StepStatus = "done" | "pending" | "soon";

export type OnboardingStep = {
    id: "account" | "group" | "goal";
    title: string;
    description: string;
    status: StepStatus;
};

export type Onboarding = {
    steps: OnboardingStep[];
    // Passos que dá para fazer hoje (os "Em breve" ficam de fora da conta).
    doneCount: number;
    availableCount: number;
    complete: boolean;
};

export function buildOnboarding({ groupsCount }: { groupsCount: number }): Onboarding {
    const steps: OnboardingStep[] = [
        {
            id: "account",
            title: "Criar sua conta",
            description: "Feito! Boas-vindas ao Group of Study.",
            status: "done",
        },
        {
            id: "group",
            title: "Entrar ou criar um grupo",
            description:
                groupsCount > 0
                    ? `Você está em ${groupsCount} ${groupsCount === 1 ? "grupo" : "grupos"}.`
                    : "Estude com colegas da sua turma ou de um objetivo em comum.",
            status: groupsCount > 0 ? "done" : "pending",
        },
        {
            // Ainda não existe tela para criar meta: o passo aparece, mas como "Em breve".
            // Quando a tela de Metas existir, trocar para done/pending pela contagem de metas.
            id: "goal",
            title: "Definir sua primeira meta",
            description: 'Algo pequeno, para esta semana. Ex.: "Revisar o capítulo 1".',
            status: "soon",
        },
    ];

    const available = steps.filter((step) => step.status !== "soon");
    const doneCount = available.filter((step) => step.status === "done").length;

    return {
        steps,
        doneCount,
        availableCount: available.length,
        complete: doneCount === available.length,
    };
}
