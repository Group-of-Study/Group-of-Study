import { z } from "zod";
import { emailField, nameField, passwordField } from "@/features/auth/schemas";

const currentPassword = z.string().min(1, "Informe a senha atual");

// Checkbox marcado envia "on"; desmarcado, o campo nem vem no formulário.
const checkbox = z
    .literal("on")
    .optional()
    .transform((value) => value === "on");

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
