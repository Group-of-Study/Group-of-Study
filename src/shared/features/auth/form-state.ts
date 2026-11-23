// Estado devolvido pelas server actions de login e cadastro e lido pelos formulários.
// Fica em shared porque o backend monta e o frontend exibe.
export type AuthFormState = {
    error?: string;
    fieldErrors?: Record<string, string[] | undefined>;
    // O que a pessoa digitou (nunca a senha), para o formulário não voltar vazio.
    values?: Record<string, string>;
};
