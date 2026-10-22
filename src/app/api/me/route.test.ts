import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionApi } = vi.hoisted(() => ({
    getSessionApi: vi.fn(),
}));

// Só o Better Auth e o Next são simulados: a rota usa o session.ts de verdade.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: getSessionApi } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { GET } from "./route";

const user = { id: "user-1", name: "Miguel", email: "miguel@exemplo.com" };

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /api/me", () => {
    it("devolve 200 com o usuário logado", async () => {
        getSessionApi.mockResolvedValue({ session: { id: "sessao-1", userId: user.id }, user });

        const response = await GET();

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ user });
    });

    it("não expõe os dados da sessão (token), só o usuário", async () => {
        getSessionApi.mockResolvedValue({ session: { id: "sessao-1", token: "segredo" }, user });

        const body = await (await GET()).json();

        expect(body).not.toHaveProperty("session");
        expect(JSON.stringify(body)).not.toContain("segredo");
    });

    it("devolve 401 sem sessão", async () => {
        getSessionApi.mockResolvedValue(null);

        const response = await GET();

        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({ message: "Não autenticado" });
    });
});
