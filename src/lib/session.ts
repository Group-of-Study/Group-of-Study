import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const LOGIN_PATH = "/login";

export type Session = typeof auth.$Infer.Session;

// Lê a sessão do request atual. O cache() evita consultar o banco
// mais de uma vez quando vários componentes pedem a sessão.
export const getSession = cache(async (): Promise<Session | null> => {
    return auth.api.getSession({ headers: await headers() });
});

// Para páginas e Server Actions: sem sessão, manda para o login.
export async function requireSession(): Promise<Session> {
    const session = await getSession();
    if (!session) {
        redirect(LOGIN_PATH);
    }
    return session;
}

// Para Route Handlers (API): resposta padrão de não autenticado, no formato
// de erro da API ({ error }), o mesmo das rotas de grupos.
export function unauthorized(): Response {
    return Response.json({ error: "Autenticação necessária." }, { status: 401 });
}
