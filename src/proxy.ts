import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Checagem otimista: só verifica se o cookie existe, sem consultar o banco.
// A verificação real fica em requireSession(), em cada página privada.
export function proxy(request: NextRequest) {
    if (!getSessionCookie(request)) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
}

// Rotas privadas. Criou uma página privada nova? Adicione aqui.
export const config = {
    matcher: ["/dashboard/:path*", "/grupos/:path*"],
};