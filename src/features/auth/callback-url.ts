export const DEFAULT_REDIRECT = "/grupos";

const INTERNAL_ORIGIN = "http://internal.invalid";

// Aceita só caminhos internos ("/grupos?id=1"). Qualquer coisa que leve
// para outro site ("https://...", "//site.com", "/\site.com") vira o padrão.
export function safeCallbackUrl(value: unknown): string {
    if (typeof value !== "string" || !value.startsWith("/")) {
        return DEFAULT_REDIRECT;
    }
    try {
        const url = new URL(value, INTERNAL_ORIGIN);
        if (url.origin !== INTERNAL_ORIGIN) {
            return DEFAULT_REDIRECT;
        }
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return DEFAULT_REDIRECT;
    }
}

// Lê o ?callbackUrl= das páginas de login e cadastro. Valor externo ou
// inválido é descartado (undefined), em vez de virar o padrão.
export function readCallbackUrl(value: string | string[] | undefined): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }
    const safe = safeCallbackUrl(value);
    if (safe === DEFAULT_REDIRECT && value !== DEFAULT_REDIRECT) {
        return undefined;
    }
    return safe;
}

// Link entre login e cadastro mantendo o destino ("/cadastro?callbackUrl=...").
export function withCallbackUrl(path: string, callbackUrl: string | undefined): string {
    if (!callbackUrl) {
        return path;
    }
    return `${path}?${new URLSearchParams({ callbackUrl })}`;
}
