import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionApi, headersMock } = vi.hoisted(() => ({
    getSessionApi: vi.fn(),
    headersMock: vi.fn(async () => new Headers({ cookie: "better-auth.session_token=abc" })),
}));

// "server-only" lança erro fora do servidor do Next; nos testes ele é neutro.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: getSessionApi } } }));
vi.mock("next/headers", () => ({ headers: headersMock }));
// O redirect() do Next lança uma exceção; aqui ela carrega o destino.
vi.mock("next/navigation", () => ({
    redirect: (url: string) => {
        throw new Error(`REDIRECT:${url}`);
    },
}));

import { getSession, LOGIN_PATH, requireSession, unauthorized } from "./session";

const session = {
    session: { id: "sessao-1", userId: "user-1", token: "abc" },
    user: { id: "user-1", name: "Miguel", email: "miguel@exemplo.com" },
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("getSession", () => {
    it("repassa os headers do request para o Better Auth", async () => {
        getSessionApi.mockResolvedValue(session);

        await expect(getSession()).resolves.toEqual(session);
        const { headers } = getSessionApi.mock.calls[0][0];
        expect(headers.get("cookie")).toBe("better-auth.session_token=abc");
    });

    it("devolve null quando não há sessão", async () => {
        getSessionApi.mockResolvedValue(null);

        await expect(getSession()).resolves.toBeNull();
    });
});

describe("requireSession", () => {
    it("devolve a sessão quando o usuário está logado", async () => {
        getSessionApi.mockResolvedValue(session);

        await expect(requireSession()).resolves.toEqual(session);
    });

    it("redireciona para o login quando não há sessão", async () => {
        getSessionApi.mockResolvedValue(null);

        await expect(requireSession()).rejects.toThrow(`REDIRECT:${LOGIN_PATH}`);
        expect(LOGIN_PATH).toBe("/login");
    });
});

describe("unauthorized", () => {
    it("responde 401 no formato de erro da API ({ error })", async () => {
        const response = unauthorized();

        expect(response.status).toBe(401);
        expect(response.headers.get("content-type")).toContain("application/json");
        await expect(response.json()).resolves.toEqual({ error: "Autenticação necessária." });
    });
});
