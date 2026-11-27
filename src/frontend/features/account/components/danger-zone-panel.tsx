"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { TextField } from "@/frontend/components/ui/text-field";
import { signOutAction } from "@/backend/features/auth/actions";
import { deleteAccountAction } from "@/backend/features/account/actions";
import type { AccountFormState } from "@/shared/features/account/form-state";
import { FormFeedback } from "./form-feedback";
import { SettingsPanel } from "./settings-panel";

const initialState: AccountFormState = {};

// Figma: Panel/Zona de perigo. A confirmação de "Excluir conta" não tem tela no Figma:
// abre aqui mesmo, como os formulários de senha do 2FA (GOS-036).
export function DangerZonePanel() {
    // Mudar a key remonta o formulário e zera o estado (useActionState não tem "reset").
    const [attempt, setAttempt] = useState(0);
    const [confirming, setConfirming] = useState(false);
    const cancel = () => {
        setConfirming(false);
        setAttempt((n) => n + 1);
    };

    return (
        <SettingsPanel id="zona-de-perigo" title="Zona de perigo">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="flex-1 text-body-sm text-text-secondary">
                    Sair encerra a sessão neste dispositivo. Excluir a conta remove seus dados de forma permanente.
                </p>
                <div className="flex gap-3">
                    <form action={signOutAction}>
                        <Button
                            type="submit"
                            variant="ds-secondary"
                            size="ds-md"
                            leadingIcon={<Image src="/icons/log-out.svg" width={16} height={16} alt="" />}
                        >
                            Sair
                        </Button>
                    </form>
                    {!confirming && (
                        <Button
                            type="button"
                            variant="danger"
                            size="ds-md"
                            onClick={() => setConfirming(true)}
                        >
                            Excluir conta
                        </Button>
                    )}
                </div>
            </div>

            {confirming && <DeleteAccountForm key={attempt} onCancel={cancel} />}
        </SettingsPanel>
    );
}

function DeleteAccountForm({ onCancel }: { onCancel: () => void }) {
    // Deu certo: a action redireciona para a página inicial, então aqui só aparecem erros.
    const [state, action, pending] = useActionState(deleteAccountAction, initialState);

    return (
        <form
            id="excluir-conta"
            action={action}
            noValidate
            className="flex flex-col gap-4 border-t border-border-default pt-4"
        >
            {/* Mesmo visual do Alert "danger", mas sem role="alert": é um aviso fixo, não um
                erro, e o Alert põe o conteúdo num <p> (não cabe uma lista). */}
            <div className="flex flex-col gap-2 rounded-md bg-bg-danger-subtle p-3 text-caption text-text-danger">
                <p>
                    <strong>Isso não pode ser desfeito.</strong> Ao excluir sua conta:
                </p>
                <ul className="flex list-disc flex-col gap-1 pl-5">
                    <li>
                        você sai de todos os grupos. Onde você é líder, o participante mais antigo assume; onde você
                        é a única pessoa, o grupo é encerrado;
                    </li>
                    <li>
                        seu nome e seu e-mail são apagados na hora. O que você criou nos grupos (metas, por exemplo)
                        fica como &quot;Conta excluída&quot;;
                    </li>
                    <li>você é desconectado de todos os dispositivos.</li>
                </ul>
            </div>
            <TextField
                label="Senha atual"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                className="sm:max-w-[calc(50%-0.5rem)]"
                error={state.fieldErrors?.currentPassword?.[0]}
            />
            <Checkbox
                name="confirm"
                label="Entendo que a exclusão é permanente."
                error={state.fieldErrors?.confirm?.[0]}
            />
            <FormFeedback state={state} />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ds-secondary" size="ds-md" onClick={onCancel} disabled={pending}>
                    Cancelar
                </Button>
                <Button type="submit" variant="danger" size="ds-md" disabled={pending}>
                    {pending ? "Excluindo..." : "Excluir minha conta"}
                </Button>
            </div>
        </form>
    );
}
