import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signUpEmail } = vi.hoisted(() => ({
    signUpEmail: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: { api: { signUpEmail } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
// O redirect() do Next lança uma exceção; aqui ela carrega o destino.
vi.mock("next/navigation", () => ({
    redirect: (url: string) => {
        throw new Error(`REDIRECT:${url}`);
    },
}));

import { signUpAction } from "./actions";

function form(data: Record<string, string>): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
        formData.set(key, value);
    }
    return formData;
}

const user = { name: "Miguel", email: "miguel@exemplo.com", password: "senha-forte-123" };

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("signUpAction", () => {
    it("cadastra e redireciona para o callbackUrl", async () => {
        await expect(signUpAction({}, form({ ...user, callbackUrl: "/grupos" }))).rejects.toThrow("REDIRECT:/grupos");
        expect(signUpEmail).toHaveBeenCalledWith({ body: user, headers: expect.any(Headers) });
    });

    it("ignora callbackUrl externo e vai para /dashboard", async () => {
        await expect(signUpAction({}, form({ ...user, callbackUrl: "https://site-falso.com" }))).rejects.toThrow(
            "REDIRECT:/dashboard",
        );
    });

    it("devolve erros de campo sem chamar o Better Auth", async () => {
        const state = await signUpAction({}, form({ ...user, email: "x", password: "123" }));
        expect(state.fieldErrors).toEqual({
            email: ["Email inválido"],
            password: ["A senha precisa ter pelo menos 8 caracteres"],
        });
        expect(signUpEmail).not.toHaveBeenCalled();
    });

    it("avisa quando o email já existe e não redireciona", async () => {
        signUpEmail.mockRejectedValue(
            new APIError("UNPROCESSABLE_ENTITY", { code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", message: "" }),
        );
        await expect(signUpAction({}, form(user))).resolves.toEqual({ error: "Este email já está cadastrado." });
    });

    it("devolve mensagem genérica em erro inesperado", async () => {
        signUpEmail.mockRejectedValue(new Error("banco fora do ar"));
        await expect(signUpAction({}, form(user))).resolves.toEqual({ error: "Algo deu errado. Tente novamente." });
        expect(console.error).toHaveBeenCalled();
    });
});
