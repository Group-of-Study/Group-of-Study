"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import {
    confirmTwoFactorAction,
    disableTwoFactorAction,
    enableTwoFactorAction,
    regenerateBackupCodesAction,
} from "../actions";
import type { TwoFactorFormState } from "../form-state";
import { FormFeedback } from "./form-feedback";

const initialState: TwoFactorFormState = {};

// "Conta e segurança" não tem tela no Figma: segue os outros blocos do painel
// (h3 + descrição, Input, Button Secondary, Alert). GOS-034.
export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
    // Mudar a key remonta o fluxo e zera os formulários (useActionState não tem "reset").
    const [attempt, setAttempt] = useState(0);
    const restart = () => setAttempt((n) => n + 1);

    return (
        <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 id="duas-etapas" className="text-label-md text-foreground">
                    Verificação em duas etapas
                </h3>
                <StatusBadge enabled={enabled} />
                <p className="w-full text-body-sm text-text-secondary">
                    Além da senha, o login pede um código do app autenticador (Google Authenticator, Authy,
                    1Password...).
                </p>
            </div>

            {enabled ? (
                <ManageTwoFactor key={attempt} onDone={restart} />
            ) : (
                <EnableTwoFactor key={attempt} onCancel={restart} />
            )}
        </div>
    );
}

function StatusBadge({ enabled }: { enabled: boolean }) {
    return enabled ? (
        <span className="rounded-full bg-bg-success-subtle px-2 py-0.5 text-caption text-text-success">Ativada</span>
    ) : (
        <span className="rounded-full bg-bg-muted px-2 py-0.5 text-caption text-text-secondary">Desativada</span>
    );
}

// Desativado → senha → QR code + primeiro código → códigos de recuperação.
function EnableTwoFactor({ onCancel }: { onCancel: () => void }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [enableState, enableAction, enabling] = useActionState(enableTwoFactorAction, initialState);
    const [confirmState, confirmAction, confirming] = useActionState(confirmTwoFactorAction, initialState);
    const setup = enableState.setup;

    // 3. Confirmado: mostra os códigos uma única vez. Só ao fechar a página é
    //    atualizada e passa a mostrar "Ativada" (a action não chama refresh()).
    if (setup && confirmState.success) {
        return (
            <BackupCodes
                codes={setup.backupCodes}
                title="Pronto! Guarde seus códigos de recuperação"
                onClose={() => {
                    router.refresh();
                    onCancel();
                }}
            />
        );
    }

    // 2. Senha conferida: escanear o QR code e digitar o primeiro código.
    if (setup) {
        return (
            <form action={confirmAction} noValidate className="flex flex-col gap-4">
                <ol className="flex list-decimal flex-col gap-1 pl-5 text-body-sm text-text-secondary">
                    <li>Abra o app autenticador e escaneie o QR code.</li>
                    <li>Digite o código de 6 números que aparecer no app.</li>
                </ol>
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URL gerada no servidor */}
                    <img
                        src={setup.qrCode}
                        width={160}
                        height={160}
                        alt="QR code para configurar o app autenticador"
                        className="rounded-md border border-border-default bg-white p-1"
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-body-sm text-text-secondary">Não consegue escanear? Digite esta chave no app:</p>
                        <code className="rounded-sm bg-bg-subtle px-2 py-1 text-body-sm break-all text-foreground">
                            {setup.secret}
                        </code>
                    </div>
                </div>
                <TextField
                    label="Código do app"
                    name="code"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={7}
                    required
                    className="sm:max-w-[calc(50%-0.5rem)]"
                    error={confirmState.fieldErrors?.code?.[0]}
                />
                <FormFeedback state={confirmState} />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ds-secondary" size="ds-md" onClick={onCancel} disabled={confirming}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" size="ds-md" disabled={confirming}>
                        {confirming ? "Confirmando..." : "Confirmar e ativar"}
                    </Button>
                </div>
            </form>
        );
    }

    // 1. Pede a senha antes de gerar a chave.
    if (open) {
        return (
            <PasswordForm
                action={enableAction}
                state={enableState}
                pending={enabling}
                submitLabel={enabling ? "Continuando..." : "Continuar"}
                onCancel={onCancel}
            />
        );
    }

    return (
        <Button type="button" variant="ds-secondary" size="ds-md" onClick={() => setOpen(true)} className="self-end">
            Ativar
        </Button>
    );
}

// Ativado: gerar novos códigos de recuperação ou desativar (os dois pedem a senha).
function ManageTwoFactor({ onDone }: { onDone: () => void }) {
    const [mode, setMode] = useState<"idle" | "codes" | "disable">("idle");
    const [codesState, codesAction, generating] = useActionState(regenerateBackupCodesAction, initialState);
    const [disableState, disableAction, disabling] = useActionState(disableTwoFactorAction, initialState);

    if (codesState.backupCodes) {
        return <BackupCodes codes={codesState.backupCodes} title="Seus novos códigos de recuperação" onClose={onDone} />;
    }

    if (mode === "codes") {
        return (
            <PasswordForm
                action={codesAction}
                state={codesState}
                pending={generating}
                description="Os códigos antigos param de funcionar."
                submitLabel={generating ? "Gerando..." : "Gerar novos códigos"}
                onCancel={onDone}
            />
        );
    }

    if (mode === "disable") {
        return (
            <PasswordForm
                action={disableAction}
                state={disableState}
                pending={disabling}
                description="O login volta a pedir só a senha."
                submitLabel={disabling ? "Desativando..." : "Desativar"}
                danger
                onCancel={onDone}
            />
        );
    }

    return (
        <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ds-secondary" size="ds-md" onClick={() => setMode("codes")}>
                Gerar novos códigos de recuperação
            </Button>
            <Button type="button" variant="ds-secondary" size="ds-md" onClick={() => setMode("disable")}>
                Desativar
            </Button>
        </div>
    );
}

function PasswordForm({
    action,
    state,
    pending,
    description,
    submitLabel,
    danger = false,
    onCancel,
}: {
    action: (formData: FormData) => void;
    state: TwoFactorFormState;
    pending: boolean;
    description?: string;
    submitLabel: string;
    danger?: boolean;
    onCancel: () => void;
}) {
    return (
        <form action={action} noValidate className="flex flex-col gap-4">
            <TextField
                label="Senha atual"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                helper={description}
                className="sm:max-w-[calc(50%-0.5rem)]"
                error={state.fieldErrors?.currentPassword?.[0]}
            />
            <FormFeedback state={state} />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ds-secondary" size="ds-md" onClick={onCancel} disabled={pending}>
                    Cancelar
                </Button>
                <Button type="submit" variant={danger ? "danger" : "primary"} size="ds-md" disabled={pending}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

// Os códigos aparecem uma vez só: o Better Auth guarda criptografado e não mostra de novo.
function BackupCodes({ codes, title, onClose }: { codes: string[]; title: string; onClose: () => void }) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(codes.join("\n"));
            setCopied(true);
        } catch {
            // Sem permissão de área de transferência: a pessoa ainda pode copiar à mão.
        }
    }

    return (
        <div className="flex flex-col gap-4" role="status">
            <div className="flex flex-col gap-1">
                <p className="text-label-md text-foreground">{title}</p>
                <p className="text-body-sm text-text-secondary">
                    Cada código entra uma vez, se você perder o celular. Guarde num lugar seguro (um gerenciador de
                    senhas, por exemplo): eles não aparecem de novo.
                </p>
            </div>
            <ul className="grid grid-cols-2 gap-2 rounded-md bg-bg-subtle p-3 font-mono text-body-sm text-foreground">
                {codes.map((code) => (
                    <li key={code}>{code}</li>
                ))}
            </ul>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ds-secondary" size="ds-md" onClick={copy}>
                    {copied ? "Copiados!" : "Copiar códigos"}
                </Button>
                <Button type="button" variant="primary" size="ds-md" onClick={onClose}>
                    Já guardei
                </Button>
            </div>
        </div>
    );
}
