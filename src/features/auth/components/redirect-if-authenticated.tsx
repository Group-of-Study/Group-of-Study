import { redirectIfAuthenticated, type AuthSearchParams } from "../auth-page";

// Não mostra nada: só redireciona quem já tem sessão. Fica num <Suspense>
// separado do formulário para a consulta da sessão não atrasar a tela.
export async function RedirectIfAuthenticated({ searchParams }: { searchParams: AuthSearchParams }) {
    await redirectIfAuthenticated(searchParams);
    return null;
}
