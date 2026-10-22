import { APIError } from "better-auth/api";

export type AuthFormState = {
    error?: string;
    fieldErrors?: Record<string, string[] | undefined>;
};

export const GENERIC_ERROR = "Algo deu errado. Tente novamente.";

export function rateLimitedError(retryAfter: number | null): AuthFormState {
    const seconds = retryAfter ?? 60;
    const unit = seconds === 1 ? "segundo" : "segundos";
    return { error: `Muitas tentativas. Tente novamente em ${seconds} ${unit}.` };
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
        if (code && MESSAGES[code]) {
            return { error: MESSAGES[code] };
        }
    }
    console.error(`[auth] ${action} falhou`, error);
    return { error: GENERIC_ERROR };
}
