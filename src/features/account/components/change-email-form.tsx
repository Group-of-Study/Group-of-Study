"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { changeEmailAction } from "../actions";
import type { AccountFormState } from "../form-state";
import { FormFeedback } from "./form-feedback";

const initialState: AccountFormState = {};

export function ChangeEmailForm({ email }: { email: string }) {
    const [state, formAction, pending] = useActionState(changeEmailAction, initialState);

    return (
        <form action={formAction} noValidate aria-labelledby="alterar-email" className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-0.5">
                <h3 id="alterar-email" className="text-label-md text-foreground">
                    E-mail
                </h3>
                <p className="text-body-sm text-text-secondary">
                    Hoje você entra com <span className="font-medium text-foreground">{email}</span>.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                    label="Novo e-mail"
                    name="newEmail"
                    type="email"
                    autoComplete="email"
                    required
                    defaultValue={state.values?.newEmail}
                    error={state.fieldErrors?.newEmail?.[0]}
                />
                <TextField
                    label="Senha atual"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    required
                    helper="Para confirmar que é você."
                    error={state.fieldErrors?.currentPassword?.[0]}
                />
            </div>

            <FormFeedback state={state} />

            <Button type="submit" variant="ds-secondary" size="ds-md" disabled={pending} className="self-end">
                {pending ? "Alterando..." : "Alterar e-mail"}
            </Button>
        </form>
    );
}
