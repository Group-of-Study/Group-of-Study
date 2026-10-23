import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signUpEmail, signInEmail, signOut, checkAuthRateLimit } = vi.hoisted(() => ({
    signUpEmail: vi.fn(),
    signInEmail: vi.fn(),
    signOut: vi.fn(),
    checkAuthRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: { api: { signUpEmail, signInEmail, signOut } } }));
vi.mock("./rate-limit", () => ({ checkAuthRateLimit }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
// O redirect() do Next lança uma exceção; aqui ela carrega o destino.
vi.mock("next/navigation", () => ({
    redirect: (url: string) => {
        throw new Error(`REDIRECT:${url}`);
    },
}));

import { signInAction, signOutAction, signUpAction } from "./actions";

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
    checkAuthRateLimit.mockResolvedValue(null);
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

describe("signInAction", () => {
    const credentials = { email: user.email, password: user.password };

    it("entra e redireciona para o callbackUrl", async () => {
        await expect(signInAction({}, form({ ...credentials, callbackUrl: "/grupos/1" }))).rejects.toThrow(
            "REDIRECT:/grupos/1",
        );
        expect(signInEmail).toHaveBeenCalledWith({ body: credentials, headers: expect.any(Headers) });
    });

    it("vai para /dashboard quando não há callbackUrl", async () => {
        await expect(signInAction({}, form(credentials))).rejects.toThrow("REDIRECT:/dashboard");
    });

    it("ignora callbackUrl externo e vai para /dashboard", async () => {
        await expect(signInAction({}, form({ ...credentials, callbackUrl: "//site-falso.com" }))).rejects.toThrow(
            "REDIRECT:/dashboard",
        );
    });

    it("devolve erros de campo sem chamar o Better Auth", async () => {
        const state = await signInAction({}, form({ email: "x", password: "" }));
        expect(state.fieldErrors).toEqual({ email: ["Email inválido"], password: ["Informe a senha"] });
        expect(signInEmail).not.toHaveBeenCalled();
    });

    it("avisa quando email ou senha estão errados e não redireciona", async () => {
        signInEmail.mockRejectedValue(
            new APIError("UNAUTHORIZED", { code: "INVALID_EMAIL_OR_PASSWORD", message: "" }),
        );
        await expect(signInAction({}, form({ ...credentials, password: "errada-123" }))).resolves.toEqual({
            error: "Email ou senha incorretos.",
        });
    });
});

describe("signOutAction", () => {
    it("encerra a sessão e vai para /login", async () => {
        await expect(signOutAction()).rejects.toThrow("REDIRECT:/login");
        expect(signOut).toHaveBeenCalledWith({ headers: expect.any(Headers) });
    });

    it("registra a falha e vai para /login mesmo assim", async () => {
        signOut.mockRejectedValue(new Error("falhou"));
        await expect(signOutAction()).rejects.toThrow("REDIRECT:/login");
        expect(console.error).toHaveBeenCalled();
    });
});

describe("rate limit nas actions", () => {
    const blocked = { error: "Muitas tentativas. Tente novamente em 30 segundos." };

    it("bloqueia o login sem chamar o Better Auth", async () => {
        checkAuthRateLimit.mockResolvedValue(blocked);

        await expect(signInAction({}, form({ email: user.email, password: user.password }))).resolves.toEqual(blocked);
        expect(checkAuthRateLimit).toHaveBeenCalledWith("/sign-in/email");
        expect(signInEmail).not.toHaveBeenCalled();
    });

    it("bloqueia o cadastro sem chamar o Better Auth", async () => {
        checkAuthRateLimit.mockResolvedValue(blocked);

        await expect(signUpAction({}, form(user))).resolves.toEqual(blocked);
        expect(checkAuthRateLimit).toHaveBeenCalledWith("/sign-up/email");
        expect(signUpEmail).not.toHaveBeenCalled();
    });

    it("dados inválidos não contam como tentativa", async () => {
        await signInAction({}, form({ email: "x", password: "" }));

        expect(checkAuthRateLimit).not.toHaveBeenCalled();
    });

    it("logout não tem rate limit", async () => {
        await expect(signOutAction()).rejects.toThrow("REDIRECT:/login");
        expect(checkAuthRateLimit).not.toHaveBeenCalled();
    });
});
