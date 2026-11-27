"use client";

import { useActionState } from "react";
import { Avatar } from "@/frontend/components/ui/avatar";
import { Button } from "@/frontend/components/ui/button";
import { TextField } from "@/frontend/components/ui/text-field";
import { updateProfileAction } from "@/backend/features/account/actions";
import type { AccountFormState } from "@/shared/features/account/form-state";
import { FormFeedback } from "./form-feedback";
import { SettingsPanel } from "./settings-panel";

const initialState: AccountFormState = {};

// Figma: Panel/Perfil. "Trocar foto" e "Bio" ficam para a página de perfil (GOS-039).
export function ProfileForm({ name, email }: { name: string; email: string }) {
    const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

    return (
        <SettingsPanel id="perfil" title="Perfil">
            <form action={formAction} noValidate className="flex flex-col gap-4">
                <Avatar name={name} />

                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                        label="Nome"
                        name="name"
                        autoComplete="name"
                        required
                        defaultValue={state.values?.name ?? name}
                        error={state.fieldErrors?.name?.[0]}
                    />
                    {/* Só leitura: campo desabilitado não vai no formulário. */}
                    <TextField
                        label="E-mail"
                        type="email"
                        value={email}
                        readOnly
                        disabled
                        helper="Usado para entrar. Altere em Conta e segurança."
                    />
                </div>

                <FormFeedback state={state} />

                <Button type="submit" size="ds-md" disabled={pending} className="self-end">
                    {pending ? "Salvando..." : "Salvar alterações"}
                </Button>
            </form>
        </SettingsPanel>
    );
}
