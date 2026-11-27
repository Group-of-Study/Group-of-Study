import Link from "next/link";
import { Check } from "lucide-react";
import type { Onboarding, OnboardingStep } from "@/shared/features/onboarding/steps";
import { DismissOnboardingButton } from "./dismiss-button";

// Figma: 11 · Início — novo usuário › "Primeiros passos". Sem o "+50 XP" e sem o card
// de nível ao lado: a gamificação ainda não existe (GOS-044).
export function OnboardingChecklist({ onboarding }: { onboarding: Onboarding }) {
    const { steps, doneCount, availableCount, complete } = onboarding;
    const percent = Math.round((doneCount / availableCount) * 100);

    return (
        <section
            aria-labelledby="primeiros-passos"
            className="flex flex-col gap-5 rounded-xl border border-border-default bg-bg-surface p-5 lg:p-8"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h2 id="primeiros-passos" className="text-h3 text-text-primary">
                        {complete ? "Tudo pronto!" : "Primeiros passos"}
                    </h2>
                    <p className="text-body-sm text-text-secondary">
                        {complete
                            ? "Você já pode estudar com seu grupo. Este guia não aparece mais depois de fechado."
                            : "Complete os passos para começar a estudar com seu grupo."}
                    </p>
                </div>
                <DismissOnboardingButton label={complete ? "Fechar" : "Pular"} />
            </div>

            <div
                role="progressbar"
                aria-label="Progresso dos primeiros passos"
                aria-valuemin={0}
                aria-valuemax={availableCount}
                aria-valuenow={doneCount}
                aria-valuetext={`${doneCount} de ${availableCount} passos`}
                className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted"
            >
                <div className="h-full rounded-full bg-bg-brand transition-all" style={{ width: `${percent}%` }} />
            </div>

            <ol className="flex flex-col gap-3">
                {steps.map((step) => (
                    <StepRow key={step.id} step={step} />
                ))}
            </ol>
        </section>
    );
}

const STATUS_LABEL = { done: "Concluído", pending: "Pendente", soon: "Em breve" } as const;

function StepRow({ step }: { step: OnboardingStep }) {
    const done = step.status === "done";

    return (
        <li className="flex items-center gap-4 rounded-lg border border-border-default p-4">
            {/* Só visual (não é um checkbox de verdade): o estado vai em texto para o leitor de tela. */}
            <span
                aria-hidden
                className={`flex size-6 shrink-0 items-center justify-center rounded-sm border-[1.5px] ${
                    done ? "border-bg-brand bg-bg-brand text-text-on-brand" : "border-border-strong"
                }`}
            >
                {done && <Check size={16} strokeWidth={3} />}
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p
                    className={`text-label-md ${done ? "text-text-tertiary line-through" : "text-text-primary"} ${
                        step.status === "soon" ? "text-text-tertiary" : ""
                    }`}
                >
                    {step.title}
                    <span className="sr-only"> ({STATUS_LABEL[step.status]})</span>
                </p>
                <p className="text-body-sm text-text-secondary">{step.description}</p>
            </div>

            {step.id === "group" && step.status === "pending" && (
                <Link
                    href="/grupos"
                    className="inline-flex h-8 shrink-0 items-center rounded-sm bg-bg-brand px-3 text-label-sm text-text-on-brand hover:bg-bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                >
                    Encontrar grupo
                </Link>
            )}
            {step.status === "soon" && (
                <span className="shrink-0 rounded-full bg-bg-muted px-2 py-0.5 text-caption text-text-secondary">
                    Em breve
                </span>
            )}
        </li>
    );
}
