import { describe, expect, it } from "vitest";
import { z } from "zod";
import { changeEmailSchema, changePasswordSchema, updateProfileSchema } from "./schemas";

function fieldErrors(result: { success: boolean; error?: z.ZodError }) {
    return result.success || !result.error ? {} : z.flattenError(result.error).fieldErrors;
}

describe("updateProfileSchema", () => {
    it("aceita o nome e remove espaços", () => {
        expect(updateProfileSchema.safeParse({ name: "  Miguel " }).data).toEqual({ name: "Miguel" });
    });

    it("rejeita nome vazio", () => {
        expect(fieldErrors(updateProfileSchema.safeParse({ name: "  " }))).toEqual({ name: ["Informe seu nome"] });
    });
});

describe("changeEmailSchema", () => {
    it("deixa o email em minúsculas e sem espaços", () => {
        const result = changeEmailSchema.safeParse({ newEmail: " Miguel@Exemplo.com ", currentPassword: "senha" });
        expect(result.data).toEqual({ newEmail: "miguel@exemplo.com", currentPassword: "senha" });
    });

    it("exige email válido e a senha atual", () => {
        expect(fieldErrors(changeEmailSchema.safeParse({ newEmail: "x", currentPassword: "" }))).toEqual({
            newEmail: ["Email inválido"],
            currentPassword: ["Informe a senha atual"],
        });
    });
});

describe("changePasswordSchema", () => {
    const valid = {
        currentPassword: "senha-antiga-123",
        newPassword: "senha-nova-123",
        confirmPassword: "senha-nova-123",
        revokeOtherSessions: "on",
    };

    it("aceita dados válidos e converte o checkbox em booleano", () => {
        expect(changePasswordSchema.safeParse(valid).data).toEqual({ ...valid, revokeOtherSessions: true });
    });

    it("checkbox desmarcado (campo ausente) vira false", () => {
        const result = changePasswordSchema.safeParse({ ...valid, revokeOtherSessions: undefined });
        expect(result.data?.revokeOtherSessions).toBe(false);
    });

    it("rejeita nova senha curta", () => {
        const result = changePasswordSchema.safeParse({ ...valid, newPassword: "123", confirmPassword: "123" });
        expect(fieldErrors(result)).toEqual({ newPassword: ["A senha precisa ter pelo menos 8 caracteres"] });
    });

    it("rejeita confirmação diferente", () => {
        const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: "outra-senha-123" });
        expect(fieldErrors(result)).toEqual({ confirmPassword: ["As senhas não coincidem"] });
    });

    it("rejeita nova senha igual à atual", () => {
        const same = { ...valid, newPassword: valid.currentPassword, confirmPassword: valid.currentPassword };
        expect(fieldErrors(changePasswordSchema.safeParse(same))).toEqual({
            newPassword: ["A nova senha precisa ser diferente da atual"],
        });
    });

    it("exige a senha atual e a confirmação", () => {
        const result = changePasswordSchema.safeParse({ ...valid, currentPassword: "", confirmPassword: "" });
        expect(fieldErrors(result)).toEqual({
            currentPassword: ["Informe a senha atual"],
            confirmPassword: ["Confirme a nova senha"],
        });
    });
});
