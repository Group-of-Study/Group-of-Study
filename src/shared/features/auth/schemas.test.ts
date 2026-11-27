import { describe, expect, it } from "vitest";
import { z } from "zod";
import { signInSchema, signUpSchema } from "./schemas";

// Como chega do formulário: confirmação igual à senha e termos marcados ("on").
const valid = {
    name: "Miguel",
    email: "miguel@exemplo.com",
    password: "senha-forte-123",
    confirmPassword: "senha-forte-123",
    terms: "on",
};

function fieldErrors(result: ReturnType<typeof signUpSchema.safeParse>) {
    return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("signUpSchema", () => {
    it("aceita dados válidos e remove espaços do nome e do email", () => {
        const result = signUpSchema.safeParse({ ...valid, name: "  Miguel ", email: " miguel@exemplo.com " });
        expect(result.success).toBe(true);
        expect(result.data).toEqual(valid);
    });

    it("rejeita email inválido", () => {
        expect(fieldErrors(signUpSchema.safeParse({ ...valid, email: "nao-e-email" }))).toEqual({
            email: ["Email inválido"],
        });
    });

    it("rejeita senha com menos de 8 caracteres", () => {
        expect(fieldErrors(signUpSchema.safeParse({ ...valid, password: "123", confirmPassword: "123" }))).toEqual({
            password: ["A senha precisa ter pelo menos 8 caracteres"],
        });
    });

    it("rejeita senha com mais de 128 caracteres", () => {
        const long = "a".repeat(129);
        expect(fieldErrors(signUpSchema.safeParse({ ...valid, password: long, confirmPassword: long }))).toEqual({
            password: ["A senha pode ter no máximo 128 caracteres"],
        });
    });

    it("rejeita nome vazio", () => {
        expect(fieldErrors(signUpSchema.safeParse({ ...valid, name: "   " }))).toEqual({
            name: ["Informe seu nome"],
        });
    });

    it("rejeita confirmação diferente da senha", () => {
        expect(fieldErrors(signUpSchema.safeParse({ ...valid, confirmPassword: "outra-senha-123" }))).toEqual({
            confirmPassword: ["As senhas não coincidem"],
        });
    });

    it("exige a confirmação da senha", () => {
        expect(fieldErrors(signUpSchema.safeParse({ ...valid, confirmPassword: "" }))).toEqual({
            confirmPassword: ["Confirme a senha"],
        });
    });

    it("exige aceitar os termos (checkbox desmarcado não vem no formulário)", () => {
        expect(fieldErrors(signUpSchema.safeParse({ ...valid, terms: undefined }))).toEqual({
            terms: ["Aceite os termos de uso para continuar"],
        });
    });

    it("mostra senhas diferentes junto com os outros erros", () => {
        const input = { ...valid, terms: undefined, confirmPassword: "outra-senha-123" };
        expect(fieldErrors(signUpSchema.safeParse(input))).toEqual({
            terms: ["Aceite os termos de uso para continuar"],
            confirmPassword: ["As senhas não coincidem"],
        });
    });

    it("ignora campos extras, como o callbackUrl", () => {
        const result = signUpSchema.safeParse({ ...valid, callbackUrl: "/grupos" });
        expect(result.data).toEqual(valid);
    });
});

describe("signInSchema", () => {
    it("aceita email e senha", () => {
        const result = signInSchema.safeParse({ email: " miguel@exemplo.com ", password: "qualquer" });
        expect(result.data).toEqual({ email: "miguel@exemplo.com", password: "qualquer", rememberMe: false });
    });

    it("exige a senha", () => {
        const result = signInSchema.safeParse({ email: valid.email, password: "" });
        expect(result.success).toBe(false);
    });

    it("converte o checkbox 'Lembrar de mim' em booleano", () => {
        const result = signInSchema.safeParse({ email: valid.email, password: "qualquer", rememberMe: "on" });
        expect(result.data?.rememberMe).toBe(true);
    });
});
