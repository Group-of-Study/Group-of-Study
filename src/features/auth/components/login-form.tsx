"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/text-field";
import { signInAction } from "../actions";
import { withCallbackUrl } from "../callback-url";
import type { AuthFormState } from "../errors";
import { AuthHeading } from "./auth-heading";
import { AuthSwitchLink } from "./auth-switch-link";
import { LockIcon, MailIcon } from "./field-icons";

const initialState: AuthFormState = {};

// Figma: Público / 02 · Login (desktop) e Mobile / 02 · Login.
export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
    const [state, formAction, pending] = useActionState(signInAction, initialState);
    const values = state.values ?? {};

    return (
        <form action={formAction} noValidate className="flex flex-1 flex-col gap-4 lg:flex-none lg:gap-5">
            <AuthHeading title="Entrar">
                Que bom te ver de novo!
                <span className="hidden lg:inline"> Seu grupo está te esperando.</span>
            </AuthHeading>

            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

            <TextField
                label="E-mail"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={values.email}
                error={state.fieldErrors?.email?.[0]}
                icon={<MailIcon />}
            />
            <TextField
                label="Senha"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                error={state.fieldErrors?.password?.[0]}
                icon={<LockIcon />}
            />

            {/* "Esqueci minha senha" fica de fora até existir a recuperação de senha. */}
            <Checkbox
                name="rememberMe"
                label={
                    <>
                        Lembrar<span className="hidden lg:inline"> de mim</span>
                    </>
                }
                // Marcado por padrão; depois de um erro, mantém a escolha da pessoa.
                defaultChecked={state.values ? values.rememberMe === "on" : true}
            />

            {state.error && <Alert tone="danger">{state.error}</Alert>}

            <Button type="submit" size="lg" disabled={pending} className="w-full">
                {pending ? "Entrando..." : "Entrar"}
            </Button>

            <AuthSwitchLink
                question="Ainda não tem conta?"
                label="Criar conta"
                href={withCallbackUrl("/cadastro", callbackUrl)}
                className="mt-auto lg:mt-0"
            />

            {callbackUrl && (
                <Alert tone="info" icon={<Image src="/icons/lock-info.svg" width={16} height={16} alt="" />}>
                    Depois de entrar, você volta para a página que tentou abrir.
                </Alert>
            )}
        </form>
    );
}
