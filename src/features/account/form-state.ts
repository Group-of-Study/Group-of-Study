import type { AuthFormState } from "@/features/auth/errors";

// Mesmo formato dos formulários de login e cadastro, mais a mensagem de sucesso:
// aqui a pessoa continua na página depois de salvar.
export type AccountFormState = AuthFormState & {
    success?: string;
};

// Valor do botão "Encerrar todas as outras" (os outros botões mandam o id da sessão).
// Fica aqui, e não em actions.ts, porque um arquivo "use server" só exporta funções async.
export const REVOKE_OTHERS = "outras";
