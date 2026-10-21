import { describe, expect, it } from "vitest";
import { z } from "zod";
import { signInSchema, signUpSchema } from "./schemas";

const valid = { name: "Miguel", email: "miguel@exemplo.com", password: "senha-forte-123" };

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
        expect(fieldErrors(signUpSchema.safeParse({ ...valid, password: "123" }))).toEqual({
            password: ["A senha precisa ter pelo menos 8 caracteres"],
        });
    });

    it("rejeita senha com mais de 128 caracteres", () => {
        expect(fieldErrors(signUpSchema.safeParse({ ...valid, password: "a".repeat(129) }))).toEqual({
            password: ["A senha pode ter no máximo 128 caracteres"],
        });
    });

    it("rejeita nome vazio", () => {
        expect(fieldErrors(signUpSchema.safeParse({ ...valid, name: "   " }))).toEqual({
            name: ["Informe seu nome"],
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
        expect(result.data).toEqual({ email: "miguel@exemplo.com", password: "qualquer" });
    });

    it("exige a senha", () => {
        const result = signInSchema.safeParse({ email: valid.email, password: "" });
        expect(result.success).toBe(false);
    });
});
