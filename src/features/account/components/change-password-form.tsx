"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/text-field";
import { changePasswordAction } from "../actions";
import type { AccountFormState } from "../form-state";
import { FormFeedback } from "./form-feedback";

const initialState: AccountFormState = {};

export function ChangePasswordForm() {
    const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

    return (
        <form action={formAction} noValidate aria-labelledby="alterar-senha" className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-0.5">
                <h3 id="alterar-senha" className="text-label-md text-foreground">
                    Senha
                </h3>
                <p className="text-body-sm text-text-secondary">Use pelo menos 8 caracteres.</p>
            </div>

            <TextField
                label="Senha atual"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                className="sm:max-w-[calc(50%-0.5rem)]"
                error={state.fieldErrors?.currentPassword?.[0]}
            />
            <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                    label="Nova senha"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    error={state.fieldErrors?.newPassword?.[0]}
                />
                <TextField
                    label="Confirmar nova senha"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    error={state.fieldErrors?.confirmPassword?.[0]}
                />
            </div>

            <Checkbox
                name="revokeOtherSessions"
                label="Desconectar dos outros dispositivos"
                // Marcado por padrão; depois de salvar ou errar, mantém a escolha da pessoa.
                defaultChecked={state.values ? state.values.revokeOtherSessions === "on" : true}
            />

            <FormFeedback state={state} />

            <Button type="submit" variant="ds-secondary" size="ds-md" disabled={pending} className="self-end">
                {pending ? "Alterando..." : "Alterar senha"}
            </Button>
        </form>
    );
}
