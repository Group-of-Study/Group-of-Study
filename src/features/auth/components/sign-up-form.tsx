"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/text-field";
import { signUpAction } from "../actions";
import { withCallbackUrl } from "../callback-url";
import type { AuthFormState } from "../errors";
import { AuthHeading } from "./auth-heading";
import { AuthSwitchLink } from "./auth-switch-link";
import { LockIcon, MailIcon, UserIcon } from "./field-icons";

const initialState: AuthFormState = {};

// Figma: Público / 03 · Cadastro (desktop) e Mobile / 03 · Cadastro.
export function SignUpForm({ callbackUrl }: { callbackUrl?: string }) {
    const [state, formAction, pending] = useActionState(signUpAction, initialState);
    const values = state.values ?? {};
    const errors = state.fieldErrors ?? {};

    return (
        <form action={formAction} noValidate className="flex flex-1 flex-col gap-4 lg:flex-none lg:gap-5">
            <AuthHeading title="Criar conta">Comece a estudar em grupo em menos de 1 minuto.</AuthHeading>

            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

            <TextField
                label="Nome"
                name="name"
                autoComplete="name"
                required
                defaultValue={values.name}
                error={errors.name?.[0]}
                icon={<UserIcon />}
            />
            <TextField
                label="E-mail"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={values.email}
                error={errors.email?.[0]}
                icon={<MailIcon />}
            />
            <TextField
                label="Senha"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                error={errors.password?.[0]}
                icon={<LockIcon />}
            />
            <TextField
                label="Confirmar senha"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a senha"
                required
                error={errors.confirmPassword?.[0]}
                icon={<LockIcon />}
            />

            <Checkbox
                name="terms"
                label="Li e aceito os termos de uso"
                defaultChecked={values.terms === "on"}
                error={errors.terms?.[0]}
            />

            {state.error && <Alert tone="danger">{state.error}</Alert>}

            <Button type="submit" size="ds-lg" disabled={pending} className="w-full">
                {pending ? "Criando conta..." : "Criar conta"}
            </Button>

            <AuthSwitchLink question="Já tem conta?" label="Entrar" href={withCallbackUrl("/login", callbackUrl)} />
        </form>
    );
}
