import { describe, expect, it } from "vitest";
import { DEFAULT_REDIRECT, safeCallbackUrl } from "./callback-url";

describe("safeCallbackUrl", () => {
    it.each([
        ["/grupos", "/grupos"],
        ["/grupos/123?aba=membros", "/grupos/123?aba=membros"],
        ["/dashboard#topo", "/dashboard#topo"],
    ])("aceita caminho interno %s", (input, expected) => {
        expect(safeCallbackUrl(input)).toBe(expected);
    });

    it.each([
        "https://site-falso.com",
        "//site-falso.com",
        "/\\site-falso.com",
        "/\t/site-falso.com",
        "javascript:alert(1)",
        "grupos",
        "",
    ])("bloqueia %j e volta para o padrão", (input) => {
        expect(safeCallbackUrl(input)).toBe(DEFAULT_REDIRECT);
    });

    it.each([null, undefined, 123])("usa o padrão quando o valor não é texto (%s)", (input) => {
        expect(safeCallbackUrl(input)).toBe(DEFAULT_REDIRECT);
    });
});
