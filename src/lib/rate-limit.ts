import type { BetterAuthRateLimitStorage } from "better-auth";

export type RateLimitRule = {
    window: number; // segundos
    max: number;
};

// Limites das rotas de auth. Valem para a API HTTP (/api/auth/*) e para as
// Server Actions, que compartilham o mesmo contador por IP + rota.
export const AUTH_RATE_LIMITS = {
    default: { window: 60, max: 100 },
    "/sign-in/email": { window: 60, max: 5 },
    "/sign-up/email": { window: 60, max: 3 },
} satisfies Record<string, RateLimitRule>;

// Limite por conta (email) no login, somando API e Server Actions. Protege a
// senha mesmo quando o IP é falsificado. Contra: quem erra a senha de outra
// pessoa de propósito trava o login dela até a janela terminar.
export const ACCOUNT_SIGN_IN_LIMIT: RateLimitRule = { window: 15 * 60, max: 10 };

export const ACCOUNT_RATE_LIMIT_CODE = "TOO_MANY_ATTEMPTS";

// Mesmo critério do Better Auth: ativo só em produção.
export function isRateLimitEnabled(): boolean {
    return process.env.NODE_ENV === "production";
}

type Entry = {
    count: number;
    windowStart: number;
    windowMs: number;
};

const MAX_ENTRIES = 10_000;

// Contador em memória. Sobrevive ao hot reload (globalThis), mas zera quando
// o servidor reinicia e não é compartilhado entre instâncias.
export function createMemoryRateLimitStorage(
    now: () => number = Date.now,
    maxEntries: number = MAX_ENTRIES,
): BetterAuthRateLimitStorage {
    const entries = new Map<string, Entry>();

    // Remove só contadores cuja própria janela já terminou.
    function prune(time: number) {
        if (entries.size < maxEntries) {
            return;
        }
        for (const [key, entry] of entries) {
            if (time - entry.windowStart >= entry.windowMs) {
                entries.delete(key);
            }
        }
    }

    return {
        async consume(key, rule) {
            const time = now();
            const windowMs = rule.window * 1000;
            prune(time);

            const entry = entries.get(key);
            if (!entry || time - entry.windowStart >= windowMs) {
                entries.set(key, { count: 1, windowStart: time, windowMs });
                return { allowed: true, retryAfter: null };
            }
            if (entry.count >= rule.max) {
                const retryAfter = Math.ceil((entry.windowStart + windowMs - time) / 1000);
                return { allowed: false, retryAfter };
            }
            entry.count += 1;
            return { allowed: true, retryAfter: null };
        },
    };
}

const globalForRateLimit = globalThis as unknown as { authRateLimitStorage?: BetterAuthRateLimitStorage };

// Instância única: a mesma para o Better Auth e para as Server Actions.
export const rateLimitStorage = (globalForRateLimit.authRateLimitStorage ??= createMemoryRateLimitStorage());
