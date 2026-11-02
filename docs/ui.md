# Telas e feedback — como usar

Componentes e arquivos especiais para carregamento, erro, "não encontrado" e avisos (toast). Os tokens e os componentes base do Design System estão em [auth.md › Tokens do Design System](auth.md#tokens-do-design-system).

## Arquivos especiais do Next
| Arquivo | Quando aparece |
|---|---|
| `src/app/not-found.tsx` | Endereço que não existe, ou `notFound()` chamado numa página. Responde 404. |
| `src/app/error.tsx` | Erro inesperado em qualquer página. Mostra "Algo deu errado", **Tentar de novo** (`retry()`) e o código do erro (`digest`). |
| `src/app/global-error.tsx` | Erro no próprio layout raiz. Substitui o layout inteiro, por isso tem `<html>`, `<body>` e importa o `globals.css`. |
| `src/app/(app)/loading.tsx` | Enquanto uma página do app (com login) espera dados fora de um `<Suspense>` próprio. |

- **Código do erro:** em produção, a mensagem de um erro do servidor não chega ao navegador (para não vazar detalhes). O `digest` mostrado na tela é o mesmo que aparece no log do servidor: peça esse código a quem reportar o problema.
- **Erro esperado não é erro:** "grupo não encontrado" numa página é `notFound()`; validação de formulário volta da Server Action em `fieldErrors`. O `error.tsx` é só para o que não deveria acontecer.
- Uma página pode ter o próprio `loading.tsx`, `error.tsx` ou `not-found.tsx` na pasta dela, quando precisar de um texto mais específico.
- O Figma não tem telas de erro, 404 e carregamento: elas usam o `EmptyState` e blocos cinza. O "!" no lugar do ícone é provisório até existir um ícone de alerta no Figma.

## EmptyState
Figma: Components › EmptyState. Para listas vazias e para as telas de 404 e erro.

```tsx
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

<EmptyState
    title="Você ainda não está em nenhum grupo"
    description="Crie um grupo para estudar com amigos ou explore grupos abertos da comunidade."
>
    <Link href="/grupos" className={buttonClassName({ variant: "ds-secondary", size: "ds-md" })}>
        Explorar grupos
    </Link>
    <Link href="/grupos/novo" className={buttonClassName({ size: "ds-md" })}>
        Criar grupo
    </Link>
</EmptyState>
```

**Link com visual de botão:** use `buttonClassName()` no `<Link>`. Não coloque `<Button>` dentro de `<Link>` (botão dentro de link é HTML inválido e confunde o teclado e o leitor de tela).

## Toast e chamadas à API
Para Client Components que chamam as rotas de `src/app/api`. O `ToastProvider` já está no `src/app/layout.tsx`.

```tsx
"use client";

import { useToast } from "@/components/ui/toast";
import { fetchApi } from "@/lib/api-client";

export function JoinGroupButton({ groupId }: { groupId: string }) {
    const toast = useToast();

    async function join() {
        const result = await fetchApi(`/api/groups/${groupId}/join`, { method: "POST" });
        toast.fromResult(result, { success: "Você entrou no grupo." });
    }

    return <button onClick={join}>Entrar no grupo</button>;
}
```

- **`fetchApi<T>(url, { method, json })`** devolve `{ ok: true, data }` ou `{ ok: false, error, issues? }` e **nunca lança erro**: falha de rede vira "Sem conexão com o servidor…" e resposta sem JSON vira a mensagem genérica. `json` é o corpo, já convertido e com o `Content-Type`.
- **`toast.fromResult(result, { success })`**: em erro, mostra a mensagem da API; em sucesso, só mostra algo se `success` for passado.
- **`toast.success(título, descrição?)`** e **`toast.error(título, descrição?)`** para os outros casos.
- No máximo 3 toasts na tela. Sucesso some em 5 s, erro em 8 s, e os dois têm botão de fechar. Os toasts ficam numa região `aria-live`, então leitores de tela anunciam.
- **Erros de campo (`issues`) não vão para o toast:** mostre cada um no campo dele (`TextField` com `error`).
- **Server Actions** (login, cadastro, configurações) continuam com o `Alert` dentro do formulário: o aviso fica perto de onde a pessoa está olhando.
