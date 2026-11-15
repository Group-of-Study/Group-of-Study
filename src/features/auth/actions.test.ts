import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signUpEmail, signInEmail, signOut, verifyTOTP, verifyBackupCode, checkAuthRateLimit } = vi.hoisted(() => ({
    signUpEmail: vi.fn(),
    signInEmail: vi.fn(),
    signOut: vi.fn(),
    verifyTOTP: vi.fn(),
    verifyBackupCode: vi.fn(),
    checkAuthRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: { api: { signUpEmail, signInEmail, signOut, verifyTOTP, verifyBackupCode } } }));
vi.mock("./rate-limit", () => ({ checkAuthRateLimit }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
// O redirect() do Next lança uma exceção; aqui ela carrega o destino.
vi.mock("next/navigation", () => ({
    redirect: (url: string) => {
        throw new Error(`REDIRECT:${url}`);
    },
}));

import { signInAction, signOutAction, signUpAction, verifyTwoFactorAction } from "./actions";

function form(data: Record<string, string>): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
        formData.set(key, value);
    }
    return formData;
}

const user = { name: "Miguel", email: "miguel@exemplo.com", password: "senha-forte-123" };
// Como o formulário de cadastro envia: confirmação da senha e termos marcados.
const signUpForm = { ...user, confirmPassword: user.password, terms: "on" };
// O que volta para o formulário depois de um erro (sem as senhas).
const signUpValues = { name: user.name, email: user.email, terms: "on" };

beforeEach(() => {
    vi.clearAllMocks();
    checkAuthRateLimit.mockResolvedValue(null);
    // Formato real da resposta de login sem 2FA.
    signInEmail.mockResolvedValue({ redirect: false, token: "token", user: { id: "user-1" } });
    verifyTOTP.mockResolvedValue({ token: "token", user: { id: "user-1" } });
    verifyBackupCode.mockResolvedValue({ token: "token", user: { id: "user-1" } });
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("signUpAction", () => {
    it("cadastra e redireciona para o callbackUrl", async () => {
        await expect(signUpAction({}, form({ ...signUpForm, callbackUrl: "/grupos" }))).rejects.toThrow("REDIRECT:/grupos");
        // confirmPassword e terms não vão para o Better Auth.
        expect(signUpEmail).toHaveBeenCalledWith({ body: user, headers: expect.any(Headers) });
    });

    it("ignora callbackUrl externo e vai para /grupos", async () => {
        await expect(signUpAction({}, form({ ...signUpForm, callbackUrl: "https://site-falso.com" }))).rejects.toThrow(
            "REDIRECT:/grupos",
        );
    });

    it("devolve erros de campo sem chamar o Better Auth", async () => {
        const state = await signUpAction({}, form({ ...signUpForm, email: "x", password: "123" }));
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
        await expect(signUpAction({}, form(signUpForm))).resolves.toEqual({
            error: "Este email já está cadastrado.",
            values: signUpValues,
        });
    });

    it("devolve mensagem genérica em erro inesperado", async () => {
        signUpEmail.mockRejectedValue(new Error("banco fora do ar"));
        await expect(signUpAction({}, form(signUpForm))).resolves.toEqual({
            error: "Algo deu errado. Tente novamente.",
            values: signUpValues,
        });
        expect(console.error).toHaveBeenCalled();
    });
});

describe("signInAction", () => {
    const credentials = { email: user.email, password: user.password };

    it("entra e redireciona para o callbackUrl", async () => {
        await expect(signInAction({}, form({ ...credentials, callbackUrl: "/grupos/1" }))).rejects.toThrow(
            "REDIRECT:/grupos/1",
        );
        expect(signInEmail).toHaveBeenCalledWith({
            body: { ...credentials, rememberMe: false },
            headers: expect.any(Headers),
        });
    });

    it("repassa o 'Lembrar de mim' para o Better Auth", async () => {
        await expect(signInAction({}, form({ ...credentials, rememberMe: "on" }))).rejects.toThrow("REDIRECT:/grupos");
        expect(signInEmail).toHaveBeenCalledWith({
            body: { ...credentials, rememberMe: true },
            headers: expect.any(Headers),
        });
    });

    it("vai para /grupos quando não há callbackUrl", async () => {
        await expect(signInAction({}, form(credentials))).rejects.toThrow("REDIRECT:/grupos");
    });

    it("ignora callbackUrl externo e vai para /grupos", async () => {
        await expect(signInAction({}, form({ ...credentials, callbackUrl: "//site-falso.com" }))).rejects.toThrow(
            "REDIRECT:/grupos",
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
        await expect(
            signInAction({}, form({ ...credentials, password: "errada-123", rememberMe: "on" })),
        ).resolves.toEqual({
            error: "Email ou senha incorretos.",
            values: { email: user.email, rememberMe: "on" },
        });
    });

    it("nunca devolve a senha para o formulário", async () => {
        signInEmail.mockRejectedValue(
            new APIError("UNAUTHORIZED", { code: "INVALID_EMAIL_OR_PASSWORD", message: "" }),
        );
        const signIn = await signInAction({}, form(credentials));
        const signUp = await signUpAction({}, form({ ...signUpForm, email: "x" }));

        expect(JSON.stringify([signIn, signUp])).not.toContain(user.password);
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

        await expect(signInAction({}, form({ email: user.email, password: user.password }))).resolves.toEqual({
            ...blocked,
            values: { email: user.email },
        });
        expect(checkAuthRateLimit).toHaveBeenCalledWith("/sign-in/email");
        expect(signInEmail).not.toHaveBeenCalled();
    });

    it("bloqueia o cadastro sem chamar o Better Auth", async () => {
        checkAuthRateLimit.mockResolvedValue(blocked);

        await expect(signUpAction({}, form(signUpForm))).resolves.toEqual({ ...blocked, values: signUpValues });
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

describe("login com verificação em duas etapas (GOS-034)", () => {
    const login = { email: user.email, password: user.password };

    it("conta com 2FA vai para a verificação, levando o callbackUrl", async () => {
        signInEmail.mockResolvedValue({ twoFactorRedirect: true, twoFactorMethods: ["totp"] });

        await expect(signInAction({}, form({ ...login, callbackUrl: "/grupos/1" }))).rejects.toThrow(
            "REDIRECT:/login/verificacao?callbackUrl=%2Fgrupos%2F1",
        );
    });

    it("não leva callbackUrl externo para a verificação", async () => {
        signInEmail.mockResolvedValue({ twoFactorRedirect: true, twoFactorMethods: ["totp"] });

        await expect(signInAction({}, form({ ...login, callbackUrl: "https://site-falso.com" }))).rejects.toThrow(
            "REDIRECT:/login/verificacao",
        );
    });

    it("código do app certo termina o login e vai para o callbackUrl", async () => {
        await expect(
            verifyTwoFactorAction({}, form({ method: "totp", code: "123 456", trustDevice: "on", callbackUrl: "/grupos/1" })),
        ).rejects.toThrow("REDIRECT:/grupos/1");
        // Espaço ignorado ("123 456") e "confiar no dispositivo" repassado.
        expect(verifyTOTP).toHaveBeenCalledWith({ body: { code: "123456", trustDevice: true }, headers: expect.any(Headers) });
        expect(verifyBackupCode).not.toHaveBeenCalled();
    });

    it("código de recuperação usa o verifyBackupCode", async () => {
        await expect(verifyTwoFactorAction({}, form({ method: "backup", code: " AbCd1-23EfG " }))).rejects.toThrow(
            "REDIRECT:/grupos",
        );
        expect(verifyBackupCode).toHaveBeenCalledWith({
            body: { code: "AbCd1-23EfG", trustDevice: false },
            headers: expect.any(Headers),
        });
        expect(verifyTOTP).not.toHaveBeenCalled();
    });

    it("código com formato errado não chega no Better Auth", async () => {
        const state = await verifyTwoFactorAction({}, form({ method: "totp", code: "12ab" }));

        expect(state.fieldErrors?.code).toEqual(["Digite os 6 números do app autenticador"]);
        expect(verifyTOTP).not.toHaveBeenCalled();
    });

    it("código errado mostra a mensagem em português", async () => {
        verifyTOTP.mockRejectedValue(new APIError("UNAUTHORIZED", { code: "INVALID_CODE", message: "Invalid code" }));

        const state = await verifyTwoFactorAction({}, form({ method: "totp", code: "000000" }));

        expect(state.error).toBe("Código incorreto. Confira o app autenticador e tente de novo.");
        expect(state.values).toEqual({ method: "totp" });
    });

    it("sem o cookie temporário (expirou) pede para entrar de novo", async () => {
        verifyTOTP.mockRejectedValue(
            new APIError("UNAUTHORIZED", { code: "INVALID_TWO_FACTOR_COOKIE", message: "Invalid two factor cookie" }),
        );

        const state = await verifyTwoFactorAction({}, form({ method: "totp", code: "123456" }));

        expect(state.error).toBe("A verificação expirou. Entre de novo com seu e-mail e senha.");
    });

    it("respeita o rate limit", async () => {
        checkAuthRateLimit.mockResolvedValue({ error: "Muitas tentativas. Tente novamente em 1 minuto." });

        const state = await verifyTwoFactorAction({}, form({ method: "totp", code: "123456" }));

        expect(checkAuthRateLimit).toHaveBeenCalledWith("/two-factor/verify");
        expect(verifyTOTP).not.toHaveBeenCalled();
        expect(state.error).toMatch(/Muitas tentativas/);
    });
});
