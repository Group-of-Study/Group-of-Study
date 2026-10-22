import { z } from "zod";

const email = z.string().trim().pipe(z.email("Email inválido"));

export const signUpSchema = z.object({
    name: z.string().trim().min(2, "Informe seu nome"),
    email,
    password: z
        .string()
        .min(8, "A senha precisa ter pelo menos 8 caracteres")
        .max(128, "A senha pode ter no máximo 128 caracteres"),
});

export const signInSchema = z.object({
    email,
    password: z.string().min(1, "Informe a senha"),
});
