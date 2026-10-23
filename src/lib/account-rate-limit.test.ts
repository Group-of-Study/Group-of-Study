import { APIError } from "better-auth/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { consumeAccountSignIn } from "./account-rate-limit";
import { ACCOUNT_RATE_LIMIT_CODE, ACCOUNT_SIGN_IN_LIMIT } from "./rate-limit";

beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
});

afterEach(() => {
    vi.unstubAllEnvs();
});

async function attempts(email: string, count: number) {
    for (let i = 0; i < count; i++) {
        await consumeAccountSignIn(email);
    }
}

describe("consumeAccountSignIn", () => {
    it("o limite é de 10 tentativas a cada 15 minutos", () => {
        expect(ACCOUNT_SIGN_IN_LIMIT).toEqual({ window: 900, max: 10 });
    });

    it("bloqueia a 11ª tentativa com 429 e o tempo de espera", async () => {
        await attempts("alvo@exemplo.com", 10);

        const error = await consumeAccountSignIn("alvo@exemplo.com").catch((e: unknown) => e);

        expect(error).toBeInstanceOf(APIError);
        const apiError = error as APIError;
        expect(apiError.statusCode).toBe(429);
        expect(apiError.body?.code).toBe(ACCOUNT_RATE_LIMIT_CODE);
        expect(apiError.body?.retryAfter).toBe(900);
        expect(new Headers(apiError.headers).get("x-retry-after")).toBe("900");
    });

    it("trata maiúsculas e espaços como o mesmo email", async () => {
        await attempts("caixa@exemplo.com", 5);
        await attempts("  CAIXA@Exemplo.com ", 5);

        await expect(consumeAccountSignIn("caixa@exemplo.com")).rejects.toBeInstanceOf(APIError);
    });

    it("não afeta outras contas", async () => {
        await attempts("bloqueada@exemplo.com", 10);

        await expect(consumeAccountSignIn("livre@exemplo.com")).resolves.toBeUndefined();
    });

    it("ignora email ausente ou inválido (a validação fica com o Better Auth)", async () => {
        for (const email of [undefined, null, 123, "", "   "]) {
            await expect(consumeAccountSignIn(email)).resolves.toBeUndefined();
        }
    });

    it("fica desligado fora de produção", async () => {
        vi.stubEnv("NODE_ENV", "development");

        await expect(attempts("dev@exemplo.com", 20)).resolves.toBeUndefined();
    });
});
