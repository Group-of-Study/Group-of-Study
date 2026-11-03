"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { handleAuthError } from "@/features/auth/errors";
import { pickFormValues } from "@/features/auth/form-values";
import { checkAuthRateLimit } from "@/features/auth/rate-limit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { AccountFormState } from "./form-state";
import { changeEmailSchema, changePasswordSchema, updateProfileSchema } from "./schemas";

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
