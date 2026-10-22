import { NextRequest } from "next/server";
import { getRedirectUrl, unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

// No Next 16.4 o helper ainda se chama "Middleware" (a doc já cita "Proxy").
function matches(url: string) {
    return unstable_doesMiddlewareMatch({ config, url });
}

function request(path: string, cookie?: string) {
    return new NextRequest(`http://localhost:3000${path}`, {
        headers: cookie ? { cookie } : {},
    });
}

describe("proxy: quais rotas ele protege", () => {
    it.each(["/dashboard", "/dashboard/config", "/grupos", "/grupos/123/membros"])("roda em %s", (url) => {
        expect(matches(url)).toBe(true);
    });

    it.each(["/", "/login", "/cadastro", "/dashboardx", "/grupo", "/api/me", "/api/auth/get-session"])(
        "não roda em %s",
        (url) => {
            expect(matches(url)).toBe(false);
        },
    );
});

describe("proxy: o que ele faz", () => {
    it("sem cookie, redireciona para o login guardando a página pedida", () => {
        const response = proxy(request("/grupos/123?aba=membros"));

        expect(response.status).toBe(307);
        const redirectUrl = getRedirectUrl(response);
        expect(redirectUrl).not.toBeNull();
        const location = new URL(redirectUrl as string);
        expect(location.pathname).toBe("/login");
        expect(location.searchParams.get("callbackUrl")).toBe("/grupos/123?aba=membros");
    });

    it("sem query, guarda só o caminho", () => {
        const response = proxy(request("/dashboard"));

        const location = new URL(getRedirectUrl(response) as string);
        expect(location.searchParams.get("callbackUrl")).toBe("/dashboard");
    });

    it.each([
        ["http (dev)", "better-auth.session_token=abc"],
        ["https (produção)", "__Secure-better-auth.session_token=abc"],
    ])("com cookie de sessão em %s, deixa passar", (_ambiente, cookie) => {
        const response = proxy(request("/dashboard", cookie));

        expect(getRedirectUrl(response)).toBeNull();
        expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("ignora cookies que não são de sessão", () => {
        const response = proxy(request("/dashboard", "tema=escuro; outro=1"));

        expect(response.status).toBe(307);
    });
});
