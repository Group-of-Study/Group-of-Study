import { getIP } from "better-auth/api";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AUTH_RATE_LIMITS, isRateLimitEnabled, rateLimitStorage } from "@/lib/rate-limit";
import { rateLimitedError, type AuthFormState } from "./errors";

type LimitedPath = "/sign-in/email" | "/sign-up/email";

// Mesma chave do Better Auth para quando o IP não pode ser determinado.
const NO_TRUSTED_IP_KEY = "no-trusted-ip";

// Server Actions chamam auth.api direto, e o rate limit do Better Auth só roda
// nas requisições HTTP de /api/auth/*. Aqui o mesmo limite é aplicado, com a
// mesma chave (IP + rota): login pela API e pela action dividem o contador.
export async function checkAuthRateLimit(path: LimitedPath): Promise<AuthFormState | null> {
    if (!isRateLimitEnabled()) {
        return null;
    }
    const ip = getIP(await headers(), auth.options) ?? NO_TRUSTED_IP_KEY;
    const { allowed, retryAfter } = await rateLimitStorage.consume(`${ip}|${path}`, AUTH_RATE_LIMITS[path]);
    return allowed ? null : rateLimitedError(retryAfter);
}
