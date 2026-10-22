import { APIError } from "better-auth/api";
import { ACCOUNT_RATE_LIMIT_CODE } from "@/lib/rate-limit";

export type AuthFormState = {
    error?: string;
    fieldErrors?: Record<string, string[] | undefined>;
};

export const GENERIC_ERROR = "Algo deu errado. Tente novamente.";

export function rateLimitedError(retryAfter: number | null): AuthFormState {
    const seconds = retryAfter ?? 60;
    const wait =
        seconds < 60
            ? `${seconds} ${seconds === 1 ? "segundo" : "segundos"}`
            : `${Math.ceil(seconds / 60)} ${Math.ceil(seconds / 60) === 1 ? "minuto" : "minutos"}`;
    return { error: `Muitas tentativas. Tente novamente em ${wait}.` };
}

// Códigos do Better Auth → mensagem para o usuário.
const MESSAGES: Record<string, string> = {
    USER_ALREADY_EXISTS: "Este email já está cadastrado.",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Este email já está cadastrado.",
    INVALID_EMAIL_OR_PASSWORD: "Email ou senha incorretos.",
    INVALID_EMAIL: "Email inválido.",
    PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
    PASSWORD_TOO_LONG: "A senha pode ter no máximo 128 caracteres.",
};

// Erro conhecido do Better Auth vira mensagem amigável. Erro inesperado
// (banco fora do ar, bug) é registrado no log e o usuário vê a genérica.
export function handleAuthError(action: string, error: unknown): AuthFormState {
    if (error instanceof APIError) {
        const code = error.body?.code;
        if (code === ACCOUNT_RATE_LIMIT_CODE) {
            return rateLimitedError(Number(error.body?.retryAfter) || null);
        }
        if (code && MESSAGES[code]) {
            return { error: MESSAGES[code] };
        }
    }
    console.error(`[auth] ${action} falhou`, error);
    return { error: GENERIC_ERROR };
}
