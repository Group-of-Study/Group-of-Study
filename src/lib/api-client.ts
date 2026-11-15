// Chamadas às rotas do projeto (src/app/api) a partir de Client Components. Lê o formato
// padrão da API ({ data } / { error } / { error, issues }, ver docs/auth.md) e nunca
// lança erro: falha de rede e resposta inesperada também voltam como { ok: false }.

export type ApiIssue = { field: string; message: string };

export type ApiResult<T> =
    | { ok: true; status: number; data: T }
    | { ok: false; status: number; error: string; issues?: ApiIssue[] };

export const NETWORK_ERROR = "Sem conexão com o servidor. Verifique sua internet e tente de novo.";
// Mesmo texto do erro genérico das Server Actions (src/features/auth/errors.ts).
export const UNEXPECTED_ERROR = "Algo deu errado. Tente novamente.";

type FetchApiInit = Omit<RequestInit, "body"> & {
    // Corpo em JSON: vira string e ganha o Content-Type certo.
    json?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isIssue(value: unknown): value is ApiIssue {
    return isRecord(value) && typeof value.field === "string" && typeof value.message === "string";
}

export async function fetchApi<T>(url: string, { json, headers, ...init }: FetchApiInit = {}): Promise<ApiResult<T>> {
    let response: Response;
    try {
        response = await fetch(url, {
            ...init,
            headers: {
                Accept: "application/json",
                ...(json !== undefined && { "Content-Type": "application/json" }),
                ...headers,
            },
            body: json !== undefined ? JSON.stringify(json) : undefined,
        });
    } catch {
        return { ok: false, status: 0, error: NETWORK_ERROR };
    }

    const body: unknown = await response.json().catch(() => null);

    if (response.ok) {
        return { ok: true, status: response.status, data: (isRecord(body) ? body.data : undefined) as T };
    }

    // Sem { error } (ex.: página de erro em HTML de um proxy), mostra a mensagem genérica.
    const error = isRecord(body) && typeof body.error === "string" ? body.error : UNEXPECTED_ERROR;
    const issues = isRecord(body) && Array.isArray(body.issues) ? body.issues.filter(isIssue) : undefined;
    return { ok: false, status: response.status, error, ...(issues && { issues }) };
}
