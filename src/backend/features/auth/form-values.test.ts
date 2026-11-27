import { describe, expect, it } from "vitest";
import { pickFormValues } from "./form-values";

describe("pickFormValues", () => {
    it("devolve só os campos pedidos", () => {
        const formData = new FormData();
        formData.set("email", "miguel@exemplo.com");
        formData.set("password", "senha-forte-123");
        formData.set("rememberMe", "on");

        expect(pickFormValues(formData, ["email", "rememberMe"])).toEqual({
            email: "miguel@exemplo.com",
            rememberMe: "on",
        });
    });

    it("ignora campos ausentes (checkbox desmarcado não vem no formulário)", () => {
        const formData = new FormData();
        formData.set("email", "miguel@exemplo.com");

        expect(pickFormValues(formData, ["email", "terms"])).toEqual({ email: "miguel@exemplo.com" });
    });

    it("ignora arquivos", () => {
        const formData = new FormData();
        formData.set("email", new Blob(["x"]));

        expect(pickFormValues(formData, ["email"])).toEqual({});
    });
});
