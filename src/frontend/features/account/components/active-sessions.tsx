"use client";

import { useActionState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { revokeSessionAction } from "@/backend/features/account/actions";
import { type AccountFormState, REVOKE_OTHERS } from "@/shared/features/account/form-state";
import type { ActiveSession } from "@/backend/features/account/sessions";
import { FormFeedback } from "./form-feedback";

const initialState: AccountFormState = {};

// "Conta e segurança" não tem tela desenhada no Figma: segue o padrão dos outros
// blocos do painel (título h3 + descrição, Button Secondary, Alert de retorno).
// Um formulário só: cada botão manda em "target" o id da sessão ou REVOKE_OTHERS.
export function ActiveSessions({ sessions }: { sessions: ActiveSession[] }) {
    const [state, formAction, pending] = useActionState(revokeSessionAction, initialState);
    const hasOthers = sessions.some((session) => !session.current);

    return (
        <form action={formAction} aria-labelledby="sessoes-ativas" className="flex flex-col gap-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <h3 id="sessoes-ativas" className="text-label-md text-foreground">
                        Sessões ativas
                    </h3>
                    <p className="text-body-sm text-text-secondary">
                        Onde sua conta está conectada. Encerre o que você não reconhecer.
                    </p>
                </div>
                {hasOthers && (
                    <Button
                        type="submit"
                        name="target"
                        value={REVOKE_OTHERS}
                        variant="ds-secondary"
                        size="ds-sm"
                        disabled={pending}
                    >
                        Encerrar todas as outras
                    </Button>
                )}
            </div>

            <ul className="flex flex-col divide-y divide-border-subtle rounded-md border border-border-default">
                {sessions.map((session) => {
                    const Icon = session.mobile ? Smartphone : Monitor;
                    return (
                        <li key={session.id} className="flex items-center gap-3 p-3">
                            <span
                                aria-hidden
                                className="flex size-10 shrink-0 items-center justify-center rounded-md bg-bg-subtle text-text-secondary"
                            >
                                <Icon size={20} />
                            </span>

                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <p className="flex flex-wrap items-center gap-2 text-label-md text-foreground">
                                    {session.device}
                                    {session.current && (
                                        <span className="rounded-full bg-bg-brand-subtle px-2 py-0.5 text-caption text-text-brand">
                                            Esta sessão
                                        </span>
                                    )}
                                </p>
                                <p className="text-body-sm text-text-secondary">
                                    {session.ipAddress ? `IP ${session.ipAddress}` : "IP desconhecido"} · Conectou em{" "}
                                    {session.connectedAt}
                                </p>
                            </div>

                            {!session.current && (
                                <Button
                                    type="submit"
                                    name="target"
                                    value={session.id}
                                    variant="ds-secondary"
                                    size="ds-sm"
                                    disabled={pending}
                                    // O texto visível é só "Encerrar"; o leitor de tela ouve qual sessão.
                                    aria-label={`Encerrar sessão: ${session.device}, conectou em ${session.connectedAt}`}
                                >
                                    Encerrar
                                </Button>
                            )}
                        </li>
                    );
                })}
            </ul>

            {!hasOthers && (
                <p className="text-body-sm text-text-secondary">Sua conta não está conectada em nenhum outro lugar.</p>
            )}

            <FormFeedback state={state} />
        </form>
    );
}
