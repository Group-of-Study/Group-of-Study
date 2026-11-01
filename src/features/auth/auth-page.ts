import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { readCallbackUrl, safeCallbackUrl } from "./callback-url";

export type AuthSearchParams = Promise<Record<string, string | string[] | undefined>>;

// callbackUrl das páginas de login e cadastro (?callbackUrl=/grupos/1).
export async function getCallbackUrl(searchParams: AuthSearchParams): Promise<string | undefined> {
    return readCallbackUrl((await searchParams).callbackUrl);
}

// Quem já está logado não fica no login/cadastro: vai direto para o destino.
// A regra fica na página, e não no proxy, para não criar loop com cookie expirado.
export async function redirectIfAuthenticated(searchParams: AuthSearchParams): Promise<void> {
    const session = await getSession();
    if (session) {
        redirect(safeCallbackUrl(await getCallbackUrl(searchParams)));
    }
}
