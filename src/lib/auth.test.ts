import { beforeAll, describe, expect, it, vi } from "vitest";

// O banco não é usado: o rate limit responde antes de chegar nele.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

let auth: typeof import("./auth").auth;

beforeAll(async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BETTER_AUTH_SECRET", "segredo-de-teste-com-mais-de-32-caracteres");
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    ({ auth } = await import("./auth"));
});

function signIn(ip: string) {
    return auth.handler(
        new Request("http://localhost:3000/api/auth/sign-in/email", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                origin: "http://localhost:3000",
                "x-forwarded-for": ip,
            },
            body: JSON.stringify({ email: "miguel@exemplo.com", password: "senha-forte-123" }),
        }),
    );
}

describe("rate limit da API /api/auth", () => {
    it("bloqueia com 429 depois de 5 tentativas de login do mesmo IP", async () => {
        for (let i = 0; i < 5; i++) {
            expect((await signIn("203.0.113.1")).status).not.toBe(429);
        }

        const blocked = await signIn("203.0.113.1");

        expect(blocked.status).toBe(429);
        expect(Number(blocked.headers.get("x-retry-after"))).toBeGreaterThan(0);
    });

    it("não bloqueia outro IP", async () => {
        expect((await signIn("203.0.113.2")).status).not.toBe(429);
    });

    it("usa o armazenamento compartilhado com as Server Actions", async () => {
        const { rateLimitStorage } = await import("@/lib/rate-limit");

        const result = await rateLimitStorage.consume("203.0.113.1|/sign-in/email", { window: 60, max: 5 });

        expect(result.allowed).toBe(false);
    });
});
