"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/text-field";
import { verifyTwoFactorAction } from "../actions";
import { withCallbackUrl } from "../callback-url";
import type { AuthFormState } from "../errors";
import { AuthHeading } from "./auth-heading";
import { LockIcon } from "./field-icons";

const initialState: AuthFormState = {};

type Method = "totp" | "backup";

// Segunda etapa do login (GOS-034). Não tem tela no Figma: segue o Login
// (AuthHeading, Input, Checkbox, Button lg). Sem o app, a pessoa usa um código de recuperação.
export function TwoFactorForm({ callbackUrl }: { callbackUrl?: string }) {
    const [state, formAction, pending] = useActionState(verifyTwoFactorAction, initialState);
    const [method, setMethod] = useState<Method>(state.values?.method === "backup" ? "backup" : "totp");
    const isTotp = method === "totp";

    return (
        <form action={formAction} noValidate className="flex flex-1 flex-col gap-4 lg:flex-none lg:gap-5">
            <AuthHeading title="Verificação em duas etapas">
                {isTotp
                    ? "Digite o código de 6 números que aparece no seu app autenticador."
                    : "Digite um dos códigos de recuperação que você guardou ao ativar a verificação."}
            </AuthHeading>

            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
            <input type="hidden" name="method" value={method} />

            <TextField
                // key: troca de método limpa o campo (os formatos são diferentes).
                key={method}
                label={isTotp ? "Código do app" : "Código de recuperação"}
                name="code"
                autoComplete="one-time-code"
                inputMode={isTotp ? "numeric" : "text"}
                placeholder={isTotp ? "123456" : "AbCd1-23EfG"}
                maxLength={isTotp ? 7 : 20}
                autoFocus
                required
                error={state.fieldErrors?.code?.[0]}
                icon={<LockIcon />}
            />

            <Checkbox
                name="trustDevice"
                label="Não pedir código neste dispositivo por 30 dias"
                defaultChecked={state.values?.trustDevice === "on"}
            />

            {state.error && <Alert tone="danger">{state.error}</Alert>}

            <Button type="submit" size="ds-lg" disabled={pending} className="w-full">
                {pending ? "Verificando..." : "Verificar"}
            </Button>

            <div className="flex flex-col items-center gap-2 text-body-sm">
                <button
                    type="button"
                    onClick={() => setMethod(isTotp ? "backup" : "totp")}
                    className="text-text-brand hover:underline focus-visible:outline-2 focus-visible:outline-border-focus"
                >
                    {isTotp ? "Não está com o app? Use um código de recuperação" : "Usar o código do app autenticador"}
                </button>
                <Link
                    href={withCallbackUrl("/login", callbackUrl)}
                    className="text-text-secondary hover:underline focus-visible:outline-2 focus-visible:outline-border-focus"
                >
                    Voltar para o login
                </Link>
            </div>
        </form>
    );
}
