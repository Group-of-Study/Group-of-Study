import { APIError, createAuthMiddleware } from "better-auth/api";
import { ACCOUNT_RATE_LIMIT_CODE, ACCOUNT_SIGN_IN_LIMIT, isRateLimitEnabled, rateLimitStorage } from "@/lib/rate-limit";

// Conta uma tentativa de login para o email e lança 429 quando passa do limite.
export async function consumeAccountSignIn(email: unknown): Promise<void> {
    if (!isRateLimitEnabled() || typeof email !== "string" || !email.trim()) {
        return;
    }
    const key = `account:${email.trim().toLowerCase()}|/sign-in/email`;
    const { allowed, retryAfter } = await rateLimitStorage.consume(key, ACCOUNT_SIGN_IN_LIMIT);
    if (!allowed) {
        const seconds = retryAfter ?? ACCOUNT_SIGN_IN_LIMIT.window;
        throw new APIError(
            "TOO_MANY_REQUESTS",
            { code: ACCOUNT_RATE_LIMIT_CODE, message: "Too many sign-in attempts for this account.", retryAfter: seconds },
            { "X-Retry-After": String(seconds) },
        );
    }
}

// Hook "before" do Better Auth: roda tanto nas requisições HTTP de /api/auth/*
// quanto nas chamadas auth.api.* das Server Actions.
export const accountRateLimitHook = createAuthMiddleware(async (ctx) => {
    if (ctx.path === "/sign-in/email") {
        await consumeAccountSignIn(ctx.body?.email);
    }
});
