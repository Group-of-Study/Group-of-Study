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

// Segunda etapa do login (GOS-034). O código do app tem 6 dígitos (espaços são
// ignorados: alguns apps mostram "123 456"); o de recuperação vem no formato "AbCd1-23EfG".
export const twoFactorSchema = z.discriminatedUnion("method", [
    z.object({
        method: z.literal("totp"),
        code: z
            .string()
            .transform((code) => code.replace(/\s/g, ""))
            .pipe(z.string().regex(/^\d{6}$/, "Digite os 6 números do app autenticador")),
        trustDevice: z
            .literal("on")
            .optional()
            .transform((value) => value === "on"),
    }),
    z.object({
        method: z.literal("backup"),
        code: z.string().trim().min(1, "Digite um código de recuperação"),
        trustDevice: z
            .literal("on")
            .optional()
            .transform((value) => value === "on"),
    }),
]);

export const signInSchema = z.object({
    email: emailField,
    password: z.string().min(1, "Informe a senha"),
    // "Lembrar de mim" desmarcado: a sessão acaba quando o navegador fecha.
    rememberMe: z
        .literal("on")
        .optional()
        .transform((value) => value === "on"),
});
