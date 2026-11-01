"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeCallbackUrl } from "./callback-url";
import { handleAuthError, type AuthFormState } from "./errors";
import { pickFormValues } from "./form-values";
import { checkAuthRateLimit } from "./rate-limit";
import { signInSchema, signUpSchema } from "./schemas";

// Campos devolvidos ao formulário em caso de erro (senhas ficam de fora).
const SIGN_UP_FIELDS = ["name", "email", "terms"] as const;
const SIGN_IN_FIELDS = ["email", "rememberMe"] as const;

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
    const values = pickFormValues(formData, SIGN_UP_FIELDS);
    const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
    }
    const limited = await checkAuthRateLimit("/sign-up/email");
    if (limited) {
        return { ...limited, values };
    }
    // confirmPassword e terms são só do formulário: o Better Auth recebe o resto.
    const { name, email, password } = parsed.data;
    try {
        await auth.api.signUpEmail({ body: { name, email, password }, headers: await headers() });
    } catch (error) {
        return { ...handleAuthError("signUp", error), values };
    }
    // redirect() fica fora do try: ele funciona lançando uma exceção.
    redirect(safeCallbackUrl(formData.get("callbackUrl")));
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
    const values = pickFormValues(formData, SIGN_IN_FIELDS);
    const parsed = signInSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
    }
    const limited = await checkAuthRateLimit("/sign-in/email");
    if (limited) {
        return { ...limited, values };
    }
    try {
        await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
    } catch (error) {
        return { ...handleAuthError("signIn", error), values };
    }
    redirect(safeCallbackUrl(formData.get("callbackUrl")));
}

export async function signOutAction(): Promise<void> {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (error) {
        handleAuthError("signOut", error);
    }
    redirect("/login");
}
