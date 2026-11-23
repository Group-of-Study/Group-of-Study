import { z } from "zod";
import { emailField, nameField, passwordField } from "@/shared/features/auth/schemas";

const currentPassword = z.string().min(1, "Informe a senha atual");

// Checkbox marcado envia "on"; desmarcado, o campo nem vem no formulário.
const checkbox = z
    .literal("on")
    .optional()
    .transform((value) => value === "on");

// 2FA (GOS-034): ativar, desativar e gerar novos códigos pedem a senha atual.
export const twoFactorPasswordSchema = z.object({
    currentPassword,
});

// Confirmação da ativação: o primeiro código do app autenticador.
export const twoFactorConfirmSchema = z.object({
    code: z
        .string()
        .transform((code) => code.replace(/\s/g, ""))
        .pipe(z.string().regex(/^\d{6}$/, "Digite os 6 números do app autenticador")),
});

// Excluir conta (GOS-036): senha atual e a caixa "Entendo que não dá para desfazer".
export const deleteAccountSchema = z.object({
    currentPassword,
    confirm: z.literal("on", { error: "Marque para confirmar a exclusão" }),
});

export const updateProfileSchema = z.object({
    name: nameField,
});

export const changeEmailSchema = z.object({
    // Minúsculo, como o Better Auth guarda: "Miguel@x.com" e "miguel@x.com" são o mesmo e-mail.
    newEmail: emailField.transform((email) => email.toLowerCase()),
    currentPassword,
});

const passwords = z.object({
    currentPassword,
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
});

// Confere as senhas mesmo quando outro campo tem erro (mesma ideia do cadastro).
const passwordsAreValid = (payload: { value: unknown }) => passwords.safeParse(payload.value).success;

export const changePasswordSchema = passwords
    .extend({
        // Marcado: quem estiver logado com a senha antiga em outro aparelho é desconectado.
        revokeOtherSessions: checkbox,
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
        when: passwordsAreValid,
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
        message: "A nova senha precisa ser diferente da atual",
        path: ["newPassword"],
        when: passwordsAreValid,
    });
