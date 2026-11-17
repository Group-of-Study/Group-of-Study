import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    updateUser,
    verifyPassword,
    changeEmail,
    changePassword,
    revokeSession,
    revokeOtherSessions,
    enableTwoFactor,
    verifyTOTP,
    disableTwoFactor,
    generateBackupCodes,
    signOut,
    softDeleteAccount,
    checkAuthRateLimit,
    findUnique,
    findFirstSession,
    refresh,
    session,
} = vi.hoisted(() => ({
    updateUser: vi.fn(),
    verifyPassword: vi.fn(),
    changeEmail: vi.fn(),
    changePassword: vi.fn(),
    revokeSession: vi.fn(),
    revokeOtherSessions: vi.fn(),
    enableTwoFactor: vi.fn(),
    verifyTOTP: vi.fn(),
    disableTwoFactor: vi.fn(),
    generateBackupCodes: vi.fn(),
    signOut: vi.fn(),
    softDeleteAccount: vi.fn(),
    checkAuthRateLimit: vi.fn(),
    findUnique: vi.fn(),
    findFirstSession: vi.fn(),
    refresh: vi.fn(),
    session: {
        current: null as { user: { id: string; email: string }; session: { id: string } } | null,
    },
}));

vi.mock("@/lib/auth", () => ({
    auth: {
        api: {
            updateUser,
            verifyPassword,
            changeEmail,
            changePassword,
            revokeSession,
            revokeOtherSessions,
            enableTwoFactor,
            verifyTOTP,
            disableTwoFactor,
            generateBackupCodes,
            signOut,
        },
    },
}));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique }, session: { findFirst: findFirstSession } } }));
vi.mock("@/features/auth/rate-limit", () => ({ checkAuthRateLimit }));
vi.mock("next/cache", () => ({ refresh }));
vi.mock("./deletion", () => ({ softDeleteAccount }));
vi.mock("@/lib/audit-log", () => ({ requestIp: () => "203.0.113.7" }));
// Como no Next, redirect() interrompe a action lançando uma exceção.
vi.mock("next/navigation", () => ({
    redirect: (url: string) => {
        throw new Error(`REDIRECT:${url}`);
    },
}));
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

import {
    changeEmailAction,
    changePasswordAction,
    confirmTwoFactorAction,
    deleteAccountAction,
    disableTwoFactorAction,
    enableTwoFactorAction,
    regenerateBackupCodesAction,
    revokeSessionAction,
    updateProfileAction,
} from "./actions";
import { REVOKE_OTHERS } from "./form-state";

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
    session.current = { user: { id: "user-1", email: "miguel@exemplo.com" }, session: { id: "sessao-atual" } };
    // clearAllMocks não desfaz mockRejectedValue de um teste anterior: redefine aqui.
    updateUser.mockResolvedValue({ status: true });
    verifyPassword.mockResolvedValue({ status: true });
    changeEmail.mockResolvedValue({ status: true });
    changePassword.mockResolvedValue({ token: null });
    revokeSession.mockResolvedValue({ status: true });
    revokeOtherSessions.mockResolvedValue({ status: true });
    findFirstSession.mockResolvedValue({ token: "token-da-outra" });
    enableTwoFactor.mockResolvedValue({
        method: "totp",
        totpURI: "otpauth://totp/Group%20of%20Study:miguel%40exemplo.com?secret=JBSWY3DPEHPK3PXP&issuer=Group%20of%20Study",
        backupCodes: ["AbCd1-23EfG", "HiJk4-56LmN"],
    });
    verifyTOTP.mockResolvedValue({ token: "nova", user: {} });
    disableTwoFactor.mockResolvedValue({ status: true });
    generateBackupCodes.mockResolvedValue({ status: true, backupCodes: ["Novo1-Cod1g", "Novo2-Cod2g"] });
    signOut.mockResolvedValue({ success: true });
    softDeleteAccount.mockResolvedValue(undefined);
    checkAuthRateLimit.mockResolvedValue(null);
    findUnique.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("sem sessão", () => {
    it.each([
        ["updateProfileAction", updateProfileAction],
        ["changeEmailAction", changeEmailAction],
        ["changePasswordAction", changePasswordAction],
        ["revokeSessionAction", revokeSessionAction],
        ["enableTwoFactorAction", enableTwoFactorAction],
        ["confirmTwoFactorAction", confirmTwoFactorAction],
        ["disableTwoFactorAction", disableTwoFactorAction],
        ["regenerateBackupCodesAction", regenerateBackupCodesAction],
        ["deleteAccountAction", deleteAccountAction],
    ])("%s redireciona para o login sem chamar o Better Auth", async (_name, action) => {
        session.current = null;
        await expect(action({}, form({}))).rejects.toThrow("REDIRECT:/login");
        expect(updateUser).not.toHaveBeenCalled();
        expect(changeEmail).not.toHaveBeenCalled();
        expect(changePassword).not.toHaveBeenCalled();
        expect(revokeSession).not.toHaveBeenCalled();
        expect(revokeOtherSessions).not.toHaveBeenCalled();
        expect(enableTwoFactor).not.toHaveBeenCalled();
        expect(verifyTOTP).not.toHaveBeenCalled();
        expect(disableTwoFactor).not.toHaveBeenCalled();
        expect(generateBackupCodes).not.toHaveBeenCalled();
        expect(softDeleteAccount).not.toHaveBeenCalled();
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

describe("revokeSessionAction", () => {
    it("encerra uma sessão buscando o token só entre as sessões do próprio usuário", async () => {
        const state = await revokeSessionAction({}, form({ target: "outra-sessao" }));

        expect(findFirstSession).toHaveBeenCalledWith({
            where: { id: "outra-sessao", userId: "user-1" },
            select: { token: true },
        });
        expect(revokeSession).toHaveBeenCalledWith({ body: { token: "token-da-outra" }, headers: expect.any(Headers) });
        expect(refresh).toHaveBeenCalled();
        expect(state).toEqual({ success: "Sessão encerrada." });
    });

    it("não encerra sessão de outra pessoa (o id não é encontrado entre as do usuário)", async () => {
        findFirstSession.mockResolvedValue(null);

        const state = await revokeSessionAction({}, form({ target: "sessao-de-outro-usuario" }));

        expect(revokeSession).not.toHaveBeenCalled();
        expect(state).toEqual({ error: "Essa sessão já tinha sido encerrada." });
    });

    it("não encerra a sessão atual por aqui (para isso existe o Sair)", async () => {
        const state = await revokeSessionAction({}, form({ target: "sessao-atual" }));

        expect(findFirstSession).not.toHaveBeenCalled();
        expect(revokeSession).not.toHaveBeenCalled();
        expect(state.error).toMatch(/use Sair/);
    });

    it("sem target devolve o erro genérico", async () => {
        const state = await revokeSessionAction({}, form({}));

        expect(revokeSession).not.toHaveBeenCalled();
        expect(revokeOtherSessions).not.toHaveBeenCalled();
        expect(state).toEqual({ error: "Algo deu errado. Tente novamente." });
    });

    it("encerra todas as outras sessões", async () => {
        const state = await revokeSessionAction({}, form({ target: REVOKE_OTHERS }));

        expect(revokeOtherSessions).toHaveBeenCalledWith({ headers: expect.any(Headers) });
        expect(revokeSession).not.toHaveBeenCalled();
        expect(refresh).toHaveBeenCalled();
        expect(state).toEqual({ success: "As outras sessões foram encerradas." });
    });

    it("erro inesperado do Better Auth vira a mensagem genérica", async () => {
        revokeSession.mockRejectedValue(new Error("banco fora do ar"));

        const state = await revokeSessionAction({}, form({ target: "outra-sessao" }));

        expect(refresh).not.toHaveBeenCalled();
        expect(state).toEqual({ error: "Algo deu errado. Tente novamente." });
    });
});

describe("verificação em duas etapas (GOS-034)", () => {
    it("ativar confere a senha e devolve QR code, chave e códigos", async () => {
        const state = await enableTwoFactorAction({}, form({ currentPassword: "senha-atual" }));

        expect(checkAuthRateLimit).toHaveBeenCalledWith("/two-factor/enable");
        expect(enableTwoFactor).toHaveBeenCalledWith({
            body: { password: "senha-atual", method: "totp" },
            headers: expect.any(Headers),
        });
        expect(state.setup?.qrCode).toMatch(/^data:image\/png;base64,/);
        expect(state.setup?.secret).toBe("JBSWY3DPEHPK3PXP");
        expect(state.setup?.backupCodes).toEqual(["AbCd1-23EfG", "HiJk4-56LmN"]);
    });

    it("ativar sem senha não chama o Better Auth", async () => {
        // O formulário sempre envia o campo; vazio quando a pessoa não digita nada.
        const state = await enableTwoFactorAction({}, form({ currentPassword: "" }));

        expect(state.fieldErrors?.currentPassword).toEqual(["Informe a senha atual"]);
        expect(enableTwoFactor).not.toHaveBeenCalled();
    });

    it("ativar com senha errada mostra a mensagem em português", async () => {
        enableTwoFactor.mockRejectedValue(invalidPassword());

        const state = await enableTwoFactorAction({}, form({ currentPassword: "errada" }));

        expect(state).toEqual({ error: "Senha atual incorreta." });
    });

    it("confirmar com o código do app ativa, sem recarregar a página antes de mostrar os códigos", async () => {
        const state = await confirmTwoFactorAction({}, form({ code: "123 456" }));

        expect(verifyTOTP).toHaveBeenCalledWith({ body: { code: "123456" }, headers: expect.any(Headers) });
        expect(refresh).not.toHaveBeenCalled();
        expect(state).toEqual({ success: "Verificação em duas etapas ativada." });
    });

    it("confirmar com código errado não ativa", async () => {
        verifyTOTP.mockRejectedValue(new APIError("UNAUTHORIZED", { code: "INVALID_CODE", message: "Invalid code" }));

        const state = await confirmTwoFactorAction({}, form({ code: "000000" }));

        expect(state.error).toBe("Código incorreto. Confira o app autenticador e tente de novo.");
    });

    it("desativar confere a senha e recarrega a página", async () => {
        const state = await disableTwoFactorAction({}, form({ currentPassword: "senha-atual" }));

        expect(checkAuthRateLimit).toHaveBeenCalledWith("/two-factor/disable");
        expect(disableTwoFactor).toHaveBeenCalledWith({ body: { password: "senha-atual" }, headers: expect.any(Headers) });
        expect(refresh).toHaveBeenCalled();
        expect(state).toEqual({ success: "Verificação em duas etapas desativada." });
    });

    it("gerar novos códigos devolve os códigos novos", async () => {
        const state = await regenerateBackupCodesAction({}, form({ currentPassword: "senha-atual" }));

        expect(checkAuthRateLimit).toHaveBeenCalledWith("/two-factor/generate-backup-codes");
        expect(state.backupCodes).toEqual(["Novo1-Cod1g", "Novo2-Cod2g"]);
    });

    it("rate limit bloqueia antes de conferir a senha", async () => {
        checkAuthRateLimit.mockResolvedValue({ error: "Muitas tentativas. Tente novamente em 1 minuto." });

        const state = await disableTwoFactorAction({}, form({ currentPassword: "senha-atual" }));

        expect(disableTwoFactor).not.toHaveBeenCalled();
        expect(state.error).toMatch(/Muitas tentativas/);
    });
});

describe("excluir conta (GOS-036)", () => {
    const valid = { currentPassword: "senha-atual", confirm: "on" };

    it("confere a senha, exclui, tira o cookie e manda para a página inicial", async () => {
        await expect(deleteAccountAction({}, form(valid))).rejects.toThrow("REDIRECT:/");
        expect(verifyPassword).toHaveBeenCalledWith(expect.objectContaining({ body: { password: "senha-atual" } }));
        expect(softDeleteAccount).toHaveBeenCalledWith("user-1", { ipAddress: "203.0.113.7" });
        expect(signOut).toHaveBeenCalled();
        // A senha é conferida antes de qualquer dado ser apagado.
        expect(verifyPassword.mock.invocationCallOrder[0]).toBeLessThan(softDeleteAccount.mock.invocationCallOrder[0]);
    });

    it("sem marcar a confirmação não confere a senha nem exclui", async () => {
        const state = await deleteAccountAction({}, form({ currentPassword: "senha-atual" }));
        expect(state.fieldErrors?.confirm).toEqual(["Marque para confirmar a exclusão"]);
        expect(verifyPassword).not.toHaveBeenCalled();
        expect(softDeleteAccount).not.toHaveBeenCalled();
    });

    it("sem senha não exclui", async () => {
        const state = await deleteAccountAction({}, form({ currentPassword: "", confirm: "on" }));
        expect(state.fieldErrors?.currentPassword).toEqual(["Informe a senha atual"]);
        expect(softDeleteAccount).not.toHaveBeenCalled();
    });

    it("com senha errada não exclui", async () => {
        verifyPassword.mockRejectedValue(invalidPassword());
        const state = await deleteAccountAction({}, form(valid));
        expect(state.error).toBe("Senha atual incorreta.");
        expect(softDeleteAccount).not.toHaveBeenCalled();
        expect(signOut).not.toHaveBeenCalled();
    });

    it("rate limit bloqueia antes de conferir a senha", async () => {
        checkAuthRateLimit.mockResolvedValue({ error: "Muitas tentativas. Tente novamente em 1 minuto." });
        const state = await deleteAccountAction({}, form(valid));
        expect(checkAuthRateLimit).toHaveBeenCalledWith("/delete-account");
        expect(state.error).toBe("Muitas tentativas. Tente novamente em 1 minuto.");
        expect(verifyPassword).not.toHaveBeenCalled();
    });

    it("conflito com outra alteração num grupo pede para tentar de novo, sem deslogar", async () => {
        const { Prisma } = await import("@/generated/prisma/client");
        softDeleteAccount.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError("conflito", { code: "P2034", clientVersion: "test" }),
        );
        const state = await deleteAccountAction({}, form(valid));
        expect(state.error).toBe("Um dos seus grupos mudou neste instante. Tente excluir de novo.");
        expect(signOut).not.toHaveBeenCalled();
    });

    it("erro inesperado vira a mensagem genérica e a pessoa continua logada", async () => {
        softDeleteAccount.mockRejectedValue(new Error("banco fora do ar"));
        const state = await deleteAccountAction({}, form(valid));
        expect(state.error).toBe("Algo deu errado. Tente novamente.");
        expect(signOut).not.toHaveBeenCalled();
    });

    it("se o signOut falhar, a conta já foi excluída e a pessoa vai para a página inicial mesmo assim", async () => {
        signOut.mockRejectedValue(new Error("cookie"));
        await expect(deleteAccountAction({}, form(valid))).rejects.toThrow("REDIRECT:/");
        expect(softDeleteAccount).toHaveBeenCalled();
    });
});
