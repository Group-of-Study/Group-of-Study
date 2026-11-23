import { describe, expect, it } from "vitest";
import { z } from "zod";
import { sessionInputSchema } from "./schema";

const HOUR = 60 * 60 * 1000;
const inHours = (hours: number) => new Date(Date.now() + hours * HOUR).toISOString();

const valid = {
    title: "Plantão de dúvidas",
    description: "",
    startsAt: inHours(24),
    endsAt: inHours(25.5),
    location: "",
    link: "https://meet.google.com/abc-defg-hij",
};

function errors(input: unknown) {
    const result = sessionInputSchema.safeParse(input);
    return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("sessionInputSchema", () => {
    it("aceita um encontro online e transforma os vazios em null", () => {
        const parsed = sessionInputSchema.parse(valid);
        expect(parsed).toMatchObject({ title: "Plantão de dúvidas", description: null, location: null });
        expect(parsed.startsAt).toBeInstanceOf(Date);
    });

    it("aceita só o local, sem link", () => {
        expect(errors({ ...valid, link: "", location: "Biblioteca, sala 3" })).toEqual({});
    });

    it("pede local ou link", () => {
        expect(errors({ ...valid, link: "", location: "  " }).location).toEqual(["Informe o local, o link ou os dois"]);
    });

    it("link só http ou https", () => {
        expect(errors({ ...valid, link: "javascript:alert(1)" }).link).toEqual([
            "Use um link que comece com http:// ou https://",
        ]);
        expect(errors({ ...valid, link: "meet.google.com/abc" }).link).toBeDefined();
    });

    it("o fim precisa ser depois do início", () => {
        expect(errors({ ...valid, endsAt: valid.startsAt }).endsAt).toEqual(["O fim precisa ser depois do início"]);
    });

    it("no máximo 12 horas", () => {
        expect(errors({ ...valid, endsAt: inHours(24 + 13) }).endsAt).toEqual(["Um encontro dura no máximo 12 horas"]);
    });

    it("não aceita encontro que já acabou", () => {
        expect(errors({ ...valid, startsAt: inHours(-3), endsAt: inHours(-1) }).startsAt).toEqual(["Esse horário já passou"]);
    });

    it("um encontro que já começou mas não acabou pode ser salvo", () => {
        expect(errors({ ...valid, startsAt: inHours(-1), endsAt: inHours(1) })).toEqual({});
    });

    it("título obrigatório e com limite", () => {
        expect(errors({ ...valid, title: "  " }).title).toEqual(["Dê um nome ao encontro"]);
        expect(errors({ ...valid, title: "a".repeat(121) }).title).toEqual(["Use no máximo 120 caracteres"]);
    });

    it("datas inválidas", () => {
        expect(errors({ ...valid, startsAt: "amanhã" }).startsAt).toEqual(["Informe o início"]);
    });

    it("não aceita campos a mais", () => {
        expect(sessionInputSchema.safeParse({ ...valid, groupId: "outro" }).success).toBe(false);
    });
});
