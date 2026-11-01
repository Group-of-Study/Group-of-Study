import { z } from "zod";

const email = z.string().trim().pipe(z.email("Email inválido"));

const passwords = z.object({
    password: z
        .string()
        .min(8, "A senha precisa ter pelo menos 8 caracteres")
        .max(128, "A senha pode ter no máximo 128 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a senha"),
});

export const signUpSchema = passwords
    .extend({
        name: z.string().trim().min(2, "Informe seu nome"),
        email,
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
    email,
    password: z.string().min(1, "Informe a senha"),
    // "Lembrar de mim" desmarcado: a sessão acaba quando o navegador fecha.
    rememberMe: z
        .literal("on")
        .optional()
        .transform((value) => value === "on"),
});
