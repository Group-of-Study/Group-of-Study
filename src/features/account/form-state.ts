import type { AuthFormState } from "@/features/auth/errors";

// Mesmo formato dos formulários de login e cadastro, mais a mensagem de sucesso:
// aqui a pessoa continua na página depois de salvar.
export type AccountFormState = AuthFormState & {
    success?: string;
};
