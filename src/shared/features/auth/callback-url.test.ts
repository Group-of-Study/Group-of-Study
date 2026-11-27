import { describe, expect, it } from "vitest";
import { DEFAULT_REDIRECT, readCallbackUrl, safeCallbackUrl, withCallbackUrl } from "./callback-url";

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

describe("readCallbackUrl", () => {
    it("devolve o caminho interno da URL da página", () => {
        expect(readCallbackUrl("/grupos/1?aba=metas")).toBe("/grupos/1?aba=metas");
    });

    it("aceita o próprio padrão", () => {
        expect(readCallbackUrl(DEFAULT_REDIRECT)).toBe(DEFAULT_REDIRECT);
    });

    it.each(["https://site-falso.com", "//site-falso.com", ""])("descarta %j", (input) => {
        expect(readCallbackUrl(input)).toBeUndefined();
    });

    it("descarta quando vem repetido na URL (?callbackUrl=a&callbackUrl=b)", () => {
        expect(readCallbackUrl(["/a", "/b"])).toBeUndefined();
    });

    it("devolve undefined sem callbackUrl", () => {
        expect(readCallbackUrl(undefined)).toBeUndefined();
    });
});

describe("withCallbackUrl", () => {
    it("mantém o destino no link, codificado", () => {
        expect(withCallbackUrl("/cadastro", "/grupos/1?aba=metas")).toBe(
            "/cadastro?callbackUrl=%2Fgrupos%2F1%3Faba%3Dmetas",
        );
    });

    it("devolve o caminho puro sem callbackUrl", () => {
        expect(withCallbackUrl("/login", undefined)).toBe("/login");
    });
});
