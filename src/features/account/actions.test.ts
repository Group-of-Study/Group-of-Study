import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateUser, verifyPassword, changeEmail, changePassword, checkAuthRateLimit, findUnique, refresh, session } =
    vi.hoisted(() => ({
        updateUser: vi.fn(),
        verifyPassword: vi.fn(),
        changeEmail: vi.fn(),
        changePassword: vi.fn(),
        checkAuthRateLimit: vi.fn(),
        findUnique: vi.fn(),
        refresh: vi.fn(),
        session: { current: null as { user: { id: string; email: string } } | null },
    }));

vi.mock("@/lib/auth", () => ({ auth: { api: { updateUser, verifyPassword, changeEmail, changePassword } } }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique } } }));
vi.mock("@/features/auth/rate-limit", () => ({ checkAuthRateLimit }));
vi.mock("next/cache", () => ({ refresh }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
// Sem sessão, requireSession() redireciona; aqui o redirect vira uma exceção.
vi.mock("@/lib/session", () => ({
    requireSession: async () => {
        if (!session.current) {
            throw new Error("REDIRECT:/login");
        }
        return session.current;
    },
}));

import { changeEmailAction, changePasswordAction, updateProfileAction } from "./actions";

function form(data: Record<string, string>): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
        formData.set(key, value);
    }
    return formData;
}

function invalidPassword() {
    return new APIError("BAD_REQUEST", { code: "INVALID_PASSWORD", message: "Invalid password" });
}

beforeEach(() => {
    vi.clearAllMocks();
    session.current = { user: { id: "user-1", email: "miguel@exemplo.com" } };
    // clearAllMocks não desfaz mockRejectedValue de um teste anterior: redefine aqui.
    updateUser.mockResolvedValue({ status: true });
    verifyPassword.mockResolvedValue({ status: true });
    changeEmail.mockResolvedValue({ status: true });
    changePassword.mockResolvedValue({ token: null });
    checkAuthRateLimit.mockResolvedValue(null);
    findUnique.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("sem sessão", () => {
    it.each([
        ["updateProfileAction", updateProfileAction],
        ["changeEmailAction", changeEmailAction],
        ["changePasswordAction", changePasswordAction],
    ])("%s redireciona para o login sem chamar o Better Auth", async (_name, action) => {
        session.current = null;
        await expect(action({}, form({}))).rejects.toThrow("REDIRECT:/login");
        expect(updateUser).not.toHaveBeenCalled();
        expect(changeEmail).not.toHaveBeenCalled();
        expect(changePassword).not.toHaveBeenCalled();
    });
});

describe("updateProfileAction", () => {
    it("atualiza o nome e recarrega a página", async () => {
        const state = await updateProfileAction({}, form({ name: "  Miguel Andrade " }));

        expect(updateUser).toHaveBeenCalledWith({ body: { name: "Miguel Andrade" }, headers: expect.any(Headers) });
        expect(refresh).toHaveBeenCalled();
        expect(state).toEqual({ success: "Perfil atualizado.", values: { name: "Miguel Andrade" } });
    });

    it("devolve erro de campo sem chamar o Better Auth", async () => {
        const state = await updateProfileAction({}, form({ name: "" }));

        expect(state).toEqual({ fieldErrors: { name: ["Informe seu nome"] }, values: { name: "" } });
        expect(updateUser).not.toHaveBeenCalled();
    });

    it("erro inesperado vira a mensagem genérica", async () => {
        updateUser.mockRejectedValue(new Error("banco fora do ar"));

        const state = await updateProfileAction({}, form({ name: "Miguel" }));

        expect(state).toEqual({ error: "Algo deu errado. Tente novamente.", values: { name: "Miguel" } });
        expect(refresh).not.toHaveBeenCalled();
    });
});

describe("changeEmailAction", () => {
    const valid = { newEmail: "Novo@Exemplo.com", currentPassword: "senha-forte-123" };

    it("confere a senha, troca o email e recarrega a página", async () => {
        const state = await changeEmailAction({}, form(valid));

        expect(verifyPassword).toHaveBeenCalledWith({
            body: { password: "senha-forte-123" },
            headers: expect.any(Headers),
        });
        expect(changeEmail).toHaveBeenCalledWith({ body: { newEmail: "novo@exemplo.com" }, headers: expect.any(Headers) });
        expect(refresh).toHaveBeenCalled();
        expect(state).toEqual({ success: "Email atualizado. Use o novo email para entrar." });
    });

    it("com senha errada não troca o email", async () => {
        verifyPassword.mockRejectedValue(invalidPassword());

        const state = await changeEmailAction({}, form(valid));

        expect(state).toEqual({ error: "Senha atual incorreta.", values: { newEmail: valid.newEmail } });
        expect(changeEmail).not.toHaveBeenCalled();
    });

    it("avisa quando o email já está cadastrado (o Better Auth responderia sucesso sem trocar)", async () => {
        findUnique.mockResolvedValue({ id: "outra-pessoa" });

        const state = await changeEmailAction({}, form(valid));

        expect(findUnique).toHaveBeenCalledWith({ where: { email: "novo@exemplo.com" }, select: { id: true } });
        expect(state).toEqual({
            fieldErrors: { newEmail: ["Este email já está cadastrado"] },
            values: { newEmail: valid.newEmail },
        });
        expect(changeEmail).not.toHaveBeenCalled();
    });

    it("recusa o email atual sem gastar tentativa do rate limit", async () => {
        const state = await changeEmailAction({}, form({ ...valid, newEmail: "MIGUEL@exemplo.com" }));

        expect(state.fieldErrors).toEqual({ newEmail: ["Este já é o seu email"] });
        expect(checkAuthRateLimit).not.toHaveBeenCalled();
        expect(verifyPassword).not.toHaveBeenCalled();
    });

    it("bloqueado pelo rate limit, nem confere a senha", async () => {
        checkAuthRateLimit.mockResolvedValue({ error: "Muitas tentativas. Tente novamente em 1 minuto." });

        const state = await changeEmailAction({}, form(valid));

        expect(checkAuthRateLimit).toHaveBeenCalledWith("/change-email");
        expect(state.error).toBe("Muitas tentativas. Tente novamente em 1 minuto.");
        expect(verifyPassword).not.toHaveBeenCalled();
    });

    it("nunca devolve a senha", async () => {
        verifyPassword.mockRejectedValue(invalidPassword());

        const state = await changeEmailAction({}, form(valid));

        expect(JSON.stringify(state)).not.toContain(valid.currentPassword);
    });
});

describe("changePasswordAction", () => {
    const valid = {
        currentPassword: "senha-antiga-123",
        newPassword: "senha-nova-123",
        confirmPassword: "senha-nova-123",
        revokeOtherSessions: "on",
    };

    it("troca a senha e encerra as outras sessões", async () => {
        const state = await changePasswordAction({}, form(valid));

        // confirmPassword não vai para o Better Auth.
        expect(changePassword).toHaveBeenCalledWith({
            body: { currentPassword: valid.currentPassword, newPassword: valid.newPassword, revokeOtherSessions: true },
            headers: expect.any(Headers),
        });
        expect(state).toEqual({
            success: "Senha alterada. As outras sessões foram encerradas.",
            values: { revokeOtherSessions: "on" },
        });
    });

    it("sem o checkbox, mantém as outras sessões", async () => {
        const { currentPassword, newPassword, confirmPassword } = valid;

        const state = await changePasswordAction({}, form({ currentPassword, newPassword, confirmPassword }));

        expect(changePassword).toHaveBeenCalledWith(
            expect.objectContaining({ body: expect.objectContaining({ revokeOtherSessions: false }) }),
        );
        expect(state).toEqual({ success: "Senha alterada.", values: {} });
    });

    it("senha atual errada vira mensagem amigável", async () => {
        changePassword.mockRejectedValue(invalidPassword());

        const state = await changePasswordAction({}, form(valid));

        expect(state).toEqual({ error: "Senha atual incorreta.", values: { revokeOtherSessions: "on" } });
    });

    it("usa o limite da troca de senha", async () => {
        checkAuthRateLimit.mockResolvedValue({ error: "Muitas tentativas. Tente novamente em 1 minuto." });

        const state = await changePasswordAction({}, form(valid));

        expect(checkAuthRateLimit).toHaveBeenCalledWith("/change-password");
        expect(state.error).toBe("Muitas tentativas. Tente novamente em 1 minuto.");
        expect(changePassword).not.toHaveBeenCalled();
    });

    it("nunca devolve as senhas", async () => {
        const state = await changePasswordAction({}, form({ ...valid, confirmPassword: "diferente-123" }));

        const json = JSON.stringify(state);
        expect(json).not.toContain(valid.currentPassword);
        expect(json).not.toContain(valid.newPassword);
        expect(json).not.toContain("diferente-123");
    });
});
