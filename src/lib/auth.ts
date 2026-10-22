import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { AUTH_RATE_LIMITS, isRateLimitEnabled, rateLimitStorage } from "@/lib/rate-limit";

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
        enabled: true,
    },
    rateLimit: {
        enabled: isRateLimitEnabled(),
        window: AUTH_RATE_LIMITS.default.window,
        max: AUTH_RATE_LIMITS.default.max,
        customRules: {
            "/sign-in/email": AUTH_RATE_LIMITS["/sign-in/email"],
            "/sign-up/email": AUTH_RATE_LIMITS["/sign-up/email"],
        },
        // Mesmo armazenamento usado pelas Server Actions (src/features/auth).
        customStorage: rateLimitStorage,
    },
    plugins: [nextCookies()],
});
