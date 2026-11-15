"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { z } from "zod";
import { GENERIC_ERROR, handleAuthError } from "@/features/auth/errors";
import { Prisma } from "@/generated/prisma/client";
import { pickFormValues } from "@/features/auth/form-values";
import { checkAuthRateLimit } from "@/features/auth/rate-limit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { softDeleteAccount } from "./deletion";
import { type AccountFormState, REVOKE_OTHERS, type TwoFactorFormState } from "./form-state";
import {
    changeEmailSchema,
    changePasswordSchema,
    deleteAccountSchema,
    twoFactorConfirmSchema,
    twoFactorPasswordSchema,
    updateProfileSchema,
} from "./schemas";

// Campos devolvidos ao formulário (senhas ficam de fora).
const PROFILE_FIELDS = ["name"] as const;
const EMAIL_FIELDS = ["newEmail"] as const;
const PASSWORD_FIELDS = ["revokeOtherSessions"] as const;

export async function updateProfileAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
    await requireSession();
    const values = pickFormValues(formData, PROFILE_FIELDS);
    const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
    }
    try {
        await auth.api.updateUser({ body: { name: parsed.data.name }, headers: await headers() });
    } catch (error) {
        return { ...handleAuthError("updateProfile", error), values };
    }
    // Atualiza a página com o nome novo (avatar, iniciais).
    refresh();
    return { success: "Perfil atualizado.", values: { name: parsed.data.name } };
}

export async function changeEmailAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
    const session = await requireSession();
    const values = pickFormValues(formData, EMAIL_FIELDS);
    const parsed = changeEmailSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
    }
    const { newEmail, currentPassword } = parsed.data;
    if (newEmail === session.user.email) {
        return { fieldErrors: { newEmail: ["Este já é o seu email"] }, values };
    }
    const limited = await checkAuthRateLimit("/change-email");
    if (limited) {
        return { ...limited, values };
    }
    const requestHeaders = await headers();
    try {
        // Sem a senha, quem pegasse uma sessão aberta poderia trocar o e-mail e tomar a conta.
        await auth.api.verifyPassword({ body: { password: currentPassword }, headers: requestHeaders });
        // Com e-mail já cadastrado, o Better Auth responde sucesso sem trocar nada (para não
        // revelar quem tem conta). O cadastro já avisa "Este email já está cadastrado", então
        // aqui avisamos também, em vez de mostrar um sucesso falso.
        const taken = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } });
        if (taken) {
            return { fieldErrors: { newEmail: ["Este email já está cadastrado"] }, values };
        }
        await auth.api.changeEmail({ body: { newEmail }, headers: requestHeaders });
    } catch (error) {
        return { ...handleAuthError("changeEmail", error), values };
    }
    refresh();
    return { success: "Email atualizado. Use o novo email para entrar." };
}

export async function changePasswordAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
    await requireSession();
    const values = pickFormValues(formData, PASSWORD_FIELDS);
    const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
    }
    const limited = await checkAuthRateLimit("/change-password");
    if (limited) {
        return { ...limited, values };
    }
    // confirmPassword é só do formulário: o Better Auth recebe o resto.
    const { currentPassword, newPassword, revokeOtherSessions } = parsed.data;
    try {
        await auth.api.changePassword({
            body: { currentPassword, newPassword, revokeOtherSessions },
            headers: await headers(),
        });
    } catch (error) {
        return { ...handleAuthError("changePassword", error), values };
    }
    return {
        success: revokeOtherSessions ? "Senha alterada. As outras sessões foram encerradas." : "Senha alterada.",
        values,
    };
}

// Encerra uma sessão (pelo id) ou todas as outras. O formulário nunca recebe o token
// da sessão: ele manda o id, e o token é buscado aqui, só entre as sessões da própria
// pessoa. Assim ninguém encerra a sessão de outro usuário trocando o id no HTML.
export async function revokeSessionAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
    const { user, session } = await requireSession();
    const target = formData.get("target");
    const requestHeaders = await headers();

    if (target === REVOKE_OTHERS) {
        try {
            await auth.api.revokeOtherSessions({ headers: requestHeaders });
        } catch (error) {
            return handleAuthError("revokeOtherSessions", error);
        }
        refresh();
        return { success: "As outras sessões foram encerradas." };
    }

    if (typeof target !== "string" || target === "") {
        return { error: GENERIC_ERROR };
    }
    if (target === session.id) {
        return { error: "Esta é a sessão que você está usando. Para encerrá-la, use Sair." };
    }

    const found = await prisma.session.findFirst({
        where: { id: target, userId: user.id },
        select: { token: true },
    });
    if (!found) {
        // Já expirou ou foi encerrada em outra aba: atualiza a lista.
        refresh();
        return { error: "Essa sessão já tinha sido encerrada." };
    }

    try {
        await auth.api.revokeSession({ body: { token: found.token }, headers: requestHeaders });
    } catch (error) {
        return handleAuthError("revokeSession", error);
    }
    refresh();
    return { success: "Sessão encerrada." };
}

// ---- Verificação em duas etapas (GOS-034) ----
// Fluxo: ativar (senha) → escanear o QR code → confirmar o primeiro código → guardar
// os códigos de recuperação. O 2FA só passa a valer no login depois da confirmação.

export async function enableTwoFactorAction(_prev: TwoFactorFormState, formData: FormData): Promise<TwoFactorFormState> {
    await requireSession();
    const parsed = twoFactorPasswordSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    const limited = await checkAuthRateLimit("/two-factor/enable");
    if (limited) {
        return limited;
    }
    let result: Awaited<ReturnType<typeof auth.api.enableTwoFactor>>;
    try {
        // method "totp" (app autenticador) é o padrão; o "otp" por e-mail não está configurado.
        result = await auth.api.enableTwoFactor({
            body: { password: parsed.data.currentPassword, method: "totp" },
            headers: await headers(),
        });
    } catch (error) {
        return handleAuthError("enableTwoFactor", error);
    }
    if (result.method !== "totp") {
        return handleAuthError("enableTwoFactor", new Error(`método inesperado: ${result.method}`));
    }
    const { totpURI, backupCodes } = result;
    // O QR code vira imagem aqui no servidor: a biblioteca não vai para o navegador.
    const qrCode = await QRCode.toDataURL(totpURI, { margin: 1, width: 200 });
    // A mesma chave do QR code, para quem preferir digitar no app.
    const secret = new URL(totpURI).searchParams.get("secret") ?? "";
    return { setup: { qrCode, secret, backupCodes } };
}

export async function confirmTwoFactorAction(_prev: TwoFactorFormState, formData: FormData): Promise<TwoFactorFormState> {
    await requireSession();
    const parsed = twoFactorConfirmSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    try {
        // Com sessão, o verifyTOTP confirma a ativação: liga o twoFactorEnabled e
        // troca a sessão por uma nova (o nextCookies grava o cookie novo).
        await auth.api.verifyTOTP({ body: { code: parsed.data.code }, headers: await headers() });
    } catch (error) {
        return handleAuthError("confirmTwoFactor", error);
    }
    // Sem refresh() aqui: a página mudaria para "Ativada" antes de a pessoa ver os
    // códigos de recuperação. O componente atualiza a página quando ela fecha os códigos.
    return { success: "Verificação em duas etapas ativada." };
}

export async function disableTwoFactorAction(_prev: TwoFactorFormState, formData: FormData): Promise<TwoFactorFormState> {
    await requireSession();
    const parsed = twoFactorPasswordSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    const limited = await checkAuthRateLimit("/two-factor/disable");
    if (limited) {
        return limited;
    }
    try {
        await auth.api.disableTwoFactor({ body: { password: parsed.data.currentPassword }, headers: await headers() });
    } catch (error) {
        return handleAuthError("disableTwoFactor", error);
    }
    refresh();
    return { success: "Verificação em duas etapas desativada." };
}

export async function regenerateBackupCodesAction(
    _prev: TwoFactorFormState,
    formData: FormData,
): Promise<TwoFactorFormState> {
    await requireSession();
    const parsed = twoFactorPasswordSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    const limited = await checkAuthRateLimit("/two-factor/generate-backup-codes");
    if (limited) {
        return limited;
    }
    try {
        const { backupCodes } = await auth.api.generateBackupCodes({
            body: { password: parsed.data.currentPassword },
            headers: await headers(),
        });
        // Os códigos antigos param de valer na hora.
        return { backupCodes, success: "Novos códigos gerados. Os antigos não valem mais." };
    } catch (error) {
        return handleAuthError("generateBackupCodes", error);
    }
}

// ---- Excluir conta (GOS-036) ----
// Pede a senha, faz o soft delete (src/features/account/deletion.ts), limpa o cookie
// e manda para a página inicial. Não usa o deleteUser do Better Auth: ele apaga a
// linha na hora, e aqui a regra de saída dos grupos e a anonimização vêm antes.
export async function deleteAccountAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
    const { user } = await requireSession();
    const parsed = deleteAccountSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    const limited = await checkAuthRateLimit("/delete-account");
    if (limited) {
        return limited;
    }
    const requestHeaders = await headers();
    try {
        await auth.api.verifyPassword({ body: { password: parsed.data.currentPassword }, headers: requestHeaders });
    } catch (error) {
        return handleAuthError("deleteAccount", error);
    }

    try {
        await softDeleteAccount(user.id);
    } catch (error) {
        // Outra pessoa mexeu num dos grupos ao mesmo tempo (transação Serializable).
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
            return { error: "Um dos seus grupos mudou neste instante. Tente excluir de novo." };
        }
        return handleAuthError("deleteAccount", error);
    }

    // As sessões já foram apagadas no banco; o signOut só tira o cookie do navegador
    // (ele não falha quando a sessão não existe mais).
    try {
        await auth.api.signOut({ headers: requestHeaders });
    } catch (error) {
        console.error("[auth] signOut depois de excluir a conta falhou", error);
    }
    redirect("/");
}
