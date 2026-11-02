import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchApi, NETWORK_ERROR, UNEXPECTED_ERROR } from "./api-client";

function mockFetch(response: Response | Error) {
    const fn = vi.fn(async () => {
        if (response instanceof Error) {
            throw response;
        }
        return response;
    });
    vi.stubGlobal("fetch", fn);
    return fn;
}

function json(body: unknown, status: number) {
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("fetchApi", () => {
    it("devolve o data de uma resposta de sucesso", async () => {
        mockFetch(json({ data: { id: "1", name: "Cálculo I" } }, 201));

        await expect(fetchApi("/api/groups")).resolves.toEqual({
            ok: true,
            status: 201,
            data: { id: "1", name: "Cálculo I" },
        });
    });

    it("envia o corpo em JSON com o Content-Type", async () => {
        const fetchMock = mockFetch(json({ data: null }, 200));

        await fetchApi("/api/groups", { method: "POST", json: { name: "Grupo" } });

        expect(fetchMock).toHaveBeenCalledWith("/api/groups", {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Grupo" }),
        });
    });

    it("devolve a mensagem de erro da API", async () => {
        mockFetch(json({ error: "Grupo não encontrado." }, 404));

        await expect(fetchApi("/api/groups/x")).resolves.toEqual({
            ok: false,
            status: 404,
            error: "Grupo não encontrado.",
        });
    });

    it("devolve os issues de um erro de validação", async () => {
        const issues = [{ field: "name", message: "Nome muito curto" }];
        mockFetch(json({ error: "Dados inválidos.", issues }, 400));

        await expect(fetchApi("/api/groups")).resolves.toEqual({
            ok: false,
            status: 400,
            error: "Dados inválidos.",
            issues,
        });
    });

    it("falha de rede vira mensagem amigável, sem lançar erro", async () => {
        mockFetch(new TypeError("Failed to fetch"));

        await expect(fetchApi("/api/groups")).resolves.toEqual({ ok: false, status: 0, error: NETWORK_ERROR });
    });

    it("resposta de erro sem JSON vira a mensagem genérica", async () => {
        mockFetch(new Response("<html>Bad Gateway</html>", { status: 502 }));

        await expect(fetchApi("/api/groups")).resolves.toEqual({ ok: false, status: 502, error: UNEXPECTED_ERROR });
    });
});
