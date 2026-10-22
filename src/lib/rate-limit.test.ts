import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_RATE_LIMITS, createMemoryRateLimitStorage, isRateLimitEnabled, rateLimitStorage } from "./rate-limit";

const rule = { window: 60, max: 3 };

function setup(maxEntries?: number) {
    let time = 1_000_000;
    const storage = createMemoryRateLimitStorage(() => time, maxEntries);
    const advance = (seconds: number) => {
        time += seconds * 1000;
    };
    return { storage, advance };
}

describe("createMemoryRateLimitStorage", () => {
    it("permite até o máximo e bloqueia a próxima tentativa", async () => {
        const { storage } = setup();

        for (let i = 0; i < rule.max; i++) {
            await expect(storage.consume("ip|/sign-in/email", rule)).resolves.toEqual({ allowed: true, retryAfter: null });
        }
        await expect(storage.consume("ip|/sign-in/email", rule)).resolves.toEqual({ allowed: false, retryAfter: 60 });
    });

    it("informa quantos segundos faltam para liberar", async () => {
        const { storage, advance } = setup();
        for (let i = 0; i < rule.max; i++) {
            await storage.consume("chave", rule);
        }

        advance(45);

        await expect(storage.consume("chave", rule)).resolves.toEqual({ allowed: false, retryAfter: 15 });
    });

    it("libera de novo quando a janela termina", async () => {
        const { storage, advance } = setup();
        for (let i = 0; i < rule.max; i++) {
            await storage.consume("chave", rule);
        }

        advance(60);

        await expect(storage.consume("chave", rule)).resolves.toEqual({ allowed: true, retryAfter: null });
    });

    it("tentativas bloqueadas não aumentam a espera", async () => {
        const { storage, advance } = setup();
        for (let i = 0; i < rule.max + 5; i++) {
            await storage.consume("chave", rule);
        }

        advance(60);

        await expect(storage.consume("chave", rule)).resolves.toMatchObject({ allowed: true });
    });

    it("conta cada chave (IP + rota) separadamente", async () => {
        const { storage } = setup();
        for (let i = 0; i < rule.max; i++) {
            await storage.consume("1.1.1.1|/sign-in/email", rule);
        }

        await expect(storage.consume("2.2.2.2|/sign-in/email", rule)).resolves.toMatchObject({ allowed: true });
        await expect(storage.consume("1.1.1.1|/sign-up/email", rule)).resolves.toMatchObject({ allowed: true });
    });
});

describe("limpeza de contadores antigos", () => {
    it("não apaga um bloqueio longo ao limpar contadores de janela curta", async () => {
        const { storage, advance } = setup(2);
        const longRule = { window: 900, max: 1 };
        await storage.consume("conta", longRule);
        await expect(storage.consume("conta", longRule)).resolves.toMatchObject({ allowed: false });

        advance(120);
        await storage.consume("ip-1", rule);
        await storage.consume("ip-2", rule);

        await expect(storage.consume("conta", longRule)).resolves.toMatchObject({ allowed: false });
    });

    it("apaga contadores cuja janela já terminou", async () => {
        const { storage, advance } = setup(2);
        await storage.consume("velho", { window: 60, max: 1 });
        await expect(storage.consume("velho", { window: 60, max: 1 })).resolves.toMatchObject({ allowed: false });

        advance(61);
        await storage.consume("novo-1", rule);
        await storage.consume("novo-2", rule);

        await expect(storage.consume("velho", { window: 60, max: 1 })).resolves.toMatchObject({ allowed: true });
    });
});

describe("configuração", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("login e cadastro têm limites mais rígidos que o padrão", () => {
        expect(AUTH_RATE_LIMITS["/sign-in/email"].max).toBeLessThan(AUTH_RATE_LIMITS.default.max);
        expect(AUTH_RATE_LIMITS["/sign-up/email"].max).toBeLessThan(AUTH_RATE_LIMITS.default.max);
    });

    it("fica ativo só em produção", () => {
        vi.stubEnv("NODE_ENV", "production");
        expect(isRateLimitEnabled()).toBe(true);

        vi.stubEnv("NODE_ENV", "development");
        expect(isRateLimitEnabled()).toBe(false);
    });

    it("mantém a mesma instância quando o módulo é recarregado (hot reload)", async () => {
        vi.resetModules();
        const reloaded = await import("./rate-limit");

        expect(reloaded.rateLimitStorage).toBe(rateLimitStorage);
    });
});
