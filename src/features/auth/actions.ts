"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeCallbackUrl } from "./callback-url";
import { handleAuthError, type AuthFormState } from "./errors";
import { checkAuthRateLimit } from "./rate-limit";
import { signInSchema, signUpSchema } from "./schemas";

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
    const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    const limited = await checkAuthRateLimit("/sign-up/email");
    if (limited) {
        return limited;
    }
    try {
        await auth.api.signUpEmail({ body: parsed.data, headers: await headers() });
    } catch (error) {
        return handleAuthError("signUp", error);
    }
    // redirect() fica fora do try: ele funciona lançando uma exceção.
    redirect(safeCallbackUrl(formData.get("callbackUrl")));
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
    const parsed = signInSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    const limited = await checkAuthRateLimit("/sign-in/email");
    if (limited) {
        return limited;
    }
    try {
        await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
    } catch (error) {
        return handleAuthError("signIn", error);
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
