# Autenticação — como usar

A sessão é lida no servidor pelos helpers de `src/lib/session.ts`:

| Função | Onde usar | Sem sessão |
|---|---|---|
| `getSession()` | Qualquer lugar do servidor, quando a sessão é opcional | retorna `null` |
| `requireSession()` | Páginas e Server Actions privadas | redireciona para `/login` |
| `unauthorized()` | Route Handlers (`route.ts`) | resposta 401 em JSON |

## Em Route Handlers (API)
```ts
import { getSession, unauthorized } from "@/lib/session";

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return unauthorized();
    }
    // session.user.id é o usuário logado
}
```

Exemplo completo: `src/app/api/me/route.ts` (retorna o usuário logado, 401 sem login).

## Em Server Actions privadas
```ts
"use server";

import { requireSession } from "@/lib/session";

export async function criarGrupo(formData: FormData) {
    const session = await requireSession(); // sem login → redireciona para /login
    // session.user.id é o usuário logado
}
```

## Páginas privadas
Toda página privada precisa de **duas coisas**:

1. Chamar `requireSession()` dentro de um `<Suspense>` (proteção real, consulta o banco).
2. Ter a rota no `matcher` de `src/proxy.ts` (redireciona rápido quem não tem cookie).

```tsx
import { Suspense } from "react";
import { requireSession } from "@/lib/session";

async function Conteudo() {
    const session = await requireSession();
    return <p>Olá, {session.user.name}</p>;
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<p>Carregando...</p>}>
            <Conteudo />
        </Suspense>
    );
}
```

Rotas privadas hoje: `/dashboard`, `/grupos` (e tudo abaixo delas).

## Regras
- **Nunca** aceite `userId` vindo do body, da query ou do formulário. O usuário é sempre `session.user.id`.
- Relações com usuário apontam para `User.id` (`String`).
- Em páginas, quem chama `getSession`/`requireSession` precisa estar dentro de um `<Suspense>` (exigência do `cacheComponents`).
- **Não** faça a checagem de login no `layout.tsx`: layouts não rodam de novo ao navegar entre páginas, então a sessão não seria verificada. A checagem vai em cada página.
- O `proxy.ts` só verifica se o cookie **existe**, não se a sessão é válida. Ele não substitui o `requireSession()`.
- **Não** coloque no proxy a regra "logado sai do `/login`": com cookie expirado isso gera loop de redirecionamento. Essa regra fica na própria página de login, usando `getSession()`.

## Pendente
- Telas de `/login` e `/cadastro` (até lá, o redirecionamento para `/login` cai em 404). Depois do login, o usuário volta para a página que tentou abrir, via `?callbackUrl=`.
