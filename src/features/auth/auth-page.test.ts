import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

// "server-only" lança erro fora do servidor do Next; nos testes ele é neutro.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getSession }));
// O redirect() do Next lança uma exceção; aqui ela carrega o destino.
vi.mock("next/navigation", () => ({
    redirect: (url: string) => {
        throw new Error(`REDIRECT:${url}`);
    },
}));

import { getCallbackUrl, redirectIfAuthenticated } from "./auth-page";

function params(query: Record<string, string | string[]> = {}) {
    return Promise.resolve(query);
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("getCallbackUrl", () => {
    it("lê o callbackUrl interno da URL", async () => {
        await expect(getCallbackUrl(params({ callbackUrl: "/grupos/1" }))).resolves.toBe("/grupos/1");
    });

    it("descarta callbackUrl externo", async () => {
        await expect(getCallbackUrl(params({ callbackUrl: "https://site-falso.com" }))).resolves.toBeUndefined();
    });
});

describe("redirectIfAuthenticated", () => {
    it("não faz nada sem sessão", async () => {
        getSession.mockResolvedValue(null);
        await expect(redirectIfAuthenticated(params({ callbackUrl: "/grupos" }))).resolves.toBeUndefined();
    });

    it("manda quem já está logado para o callbackUrl", async () => {
        getSession.mockResolvedValue({ user: { id: "user-1" } });
        await expect(redirectIfAuthenticated(params({ callbackUrl: "/grupos/1" }))).rejects.toThrow(
            "REDIRECT:/grupos/1",
        );
    });

    it("manda para /dashboard quando não há callbackUrl ou ele é externo", async () => {
        getSession.mockResolvedValue({ user: { id: "user-1" } });
        await expect(redirectIfAuthenticated(params())).rejects.toThrow("REDIRECT:/dashboard");
        await expect(redirectIfAuthenticated(params({ callbackUrl: "//site-falso.com" }))).rejects.toThrow(
            "REDIRECT:/dashboard",
        );
    });
});
