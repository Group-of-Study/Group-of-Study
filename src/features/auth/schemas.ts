import { z } from "zod";

// Campos com as mesmas regras no cadastro e nas configurações da conta.
export const nameField = z.string().trim().min(2, "Informe seu nome");
export const emailField = z.string().trim().pipe(z.email("Email inválido"));
export const passwordField = z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres")
    .max(128, "A senha pode ter no máximo 128 caracteres");

const passwords = z.object({
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirme a senha"),
});

export const signUpSchema = passwords
    .extend({
        name: nameField,
        email: emailField,
        // Checkbox marcado envia "on"; desmarcado, o campo nem vem no formulário.
        terms: z.literal("on", "Aceite os termos de uso para continuar"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
        // Confere as senhas mesmo quando outro campo (ex.: termos) tem erro.
        when: (payload) => passwords.safeParse(payload.value).success,
    });

export const signInSchema = z.object({
    email: emailField,
    password: z.string().min(1, "Informe a senha"),
    // "Lembrar de mim" desmarcado: a sessão acaba quando o navegador fecha.
    rememberMe: z
        .literal("on")
        .optional()
        .transform((value) => value === "on"),
});
