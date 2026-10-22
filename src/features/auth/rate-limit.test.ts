import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requestHeaders } = vi.hoisted(() => ({
    requestHeaders: { current: new Headers() },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ auth: { options: {} } }));
vi.mock("next/headers", () => ({ headers: async () => requestHeaders.current }));
// getIP real, mas espionado para simular "IP desconhecido".
vi.mock("better-auth/api", async (importOriginal) => {
    const original = await importOriginal<typeof import("better-auth/api")>();
    return { ...original, getIP: vi.fn(original.getIP) };
});

import { getIP } from "better-auth/api";
import { rateLimitStorage } from "@/lib/rate-limit";
import { checkAuthRateLimit } from "./rate-limit";

function fromIp(forwardedFor: string) {
    requestHeaders.current = new Headers({ "x-forwarded-for": forwardedFor });
}

beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(getIP).mockRestore();
});

describe("checkAuthRateLimit", () => {
    it("bloqueia a 6ª tentativa de login do mesmo IP com mensagem em português", async () => {
        fromIp("198.51.100.1");
        for (let i = 0; i < 5; i++) {
            await expect(checkAuthRateLimit("/sign-in/email")).resolves.toBeNull();
        }

        const blocked = await checkAuthRateLimit("/sign-in/email");

        expect(blocked?.error).toMatch(/^Muitas tentativas\. Tente novamente em \d+ (segundos?|minutos?)\.$/);
    });

    it("cadastro tem limite próprio, mais rígido (3)", async () => {
        fromIp("198.51.100.2");
        for (let i = 0; i < 3; i++) {
            await expect(checkAuthRateLimit("/sign-up/email")).resolves.toBeNull();
        }

        await expect(checkAuthRateLimit("/sign-up/email")).resolves.toHaveProperty("error");
        await expect(checkAuthRateLimit("/sign-in/email")).resolves.toBeNull();
    });

    it("divide o contador com a API HTTP (mesma chave IP + rota)", async () => {
        fromIp("198.51.100.3");
        for (let i = 0; i < 5; i++) {
            await rateLimitStorage.consume("198.51.100.3|/sign-in/email", { window: 60, max: 5 });
        }

        await expect(checkAuthRateLimit("/sign-in/email")).resolves.toHaveProperty("error");
    });

    // Em produção o Better Auth devolve IP desconhecido (null) quando o
    // x-forwarded-for não é confiável (ex.: forjado com vários IPs). Esses
    // pedidos não podem escapar do limite: todos caem num contador único.
    it("sem IP confiável, todas as tentativas dividem um contador único", async () => {
        vi.mocked(getIP).mockReturnValue(null);
        for (let i = 0; i < 5; i++) {
            fromIp(`10.0.0.${i}, 198.51.100.4`);
            await expect(checkAuthRateLimit("/sign-in/email")).resolves.toBeNull();
        }

        fromIp("10.0.0.99, 198.51.100.4");

        await expect(checkAuthRateLimit("/sign-in/email")).resolves.toHaveProperty("error");
    });

    it("fica desligado fora de produção", async () => {
        vi.stubEnv("NODE_ENV", "development");
        fromIp("198.51.100.5");

        for (let i = 0; i < 10; i++) {
            await expect(checkAuthRateLimit("/sign-in/email")).resolves.toBeNull();
        }
    });
});
