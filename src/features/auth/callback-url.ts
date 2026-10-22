export const DEFAULT_REDIRECT = "/dashboard";

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
