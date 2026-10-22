import { APIError } from "better-auth/api";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GENERIC_ERROR, handleAuthError } from "./errors";

describe("handleAuthError", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        ["USER_ALREADY_EXISTS", "Este email já está cadastrado."],
        ["USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "Este email já está cadastrado."],
        ["INVALID_EMAIL_OR_PASSWORD", "Email ou senha incorretos."],
        ["INVALID_EMAIL", "Email inválido."],
        ["PASSWORD_TOO_SHORT", "A senha precisa ter pelo menos 8 caracteres."],
        ["PASSWORD_TOO_LONG", "A senha pode ter no máximo 128 caracteres."],
    ])("traduz o erro %s sem registrar no log", (code, message) => {
        const log = vi.spyOn(console, "error").mockImplementation(() => {});
        const error = new APIError("BAD_REQUEST", { code, message: code });

        expect(handleAuthError("teste", error)).toEqual({ error: message });
        expect(log).not.toHaveBeenCalled();
    });

    it("trata código desconhecido do Better Auth como inesperado", () => {
        const log = vi.spyOn(console, "error").mockImplementation(() => {});
        const error = new APIError("BAD_REQUEST", { code: "ALGO_NOVO", message: "" });

        expect(handleAuthError("signUp", error)).toEqual({ error: GENERIC_ERROR });
        expect(log).toHaveBeenCalledWith("[auth] signUp falhou", error);
    });

    it("registra erro inesperado no log e devolve a mensagem genérica", () => {
        const log = vi.spyOn(console, "error").mockImplementation(() => {});
        const error = new Error("banco fora do ar");

        expect(handleAuthError("signIn", error)).toEqual({ error: GENERIC_ERROR });
        expect(log).toHaveBeenCalledWith("[auth] signIn falhou", error);
    });
});
