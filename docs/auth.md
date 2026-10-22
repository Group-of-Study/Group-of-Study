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

## Formato das respostas da API
Todas as rotas do projeto (`src/app/api/**/route.ts`) seguem o mesmo formato, o das rotas de grupos:

| Caso | Corpo | Exemplo |
|---|---|---|
| Sucesso | `{ data }` (e outros campos quando precisar, ex.: `pagination`, `message`) | `{ "data": { "id": "...", "name": "..." } }` |
| Erro | `{ error }` com mensagem em português | `{ "error": "Grupo não encontrado." }` |
| Erro de validação (400) | `{ error, issues }` | `{ "error": "Dados inválidos.", "issues": [{ "field": "name", "message": "..." }] }` |

- O status HTTP diz o tipo do erro: 400 (dados inválidos), 401 (sem login, use `unauthorized()`), 403 (sem permissão), 404 (não encontrado), 409 (conflito), 500 (erro inesperado, registrar no log).
- **Exceção:** as rotas do Better Auth (`/api/auth/*`) usam o formato dele (`{ message, code }`) e não podem ser alteradas. O front usa as Server Actions, que já devolvem `{ error }`.

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

## Login, cadastro e logout (Server Actions)
Ficam em `src/features/auth/actions.ts`, no formato do `useActionState`:

| Action | Sucesso | Erro |
|---|---|---|
| `signUpAction` | cria a conta, inicia a sessão e redireciona para o `callbackUrl` | devolve `{ error }` ou `{ fieldErrors }` |
| `signInAction` | inicia a sessão e redireciona para o `callbackUrl` | devolve `{ error }` ou `{ fieldErrors }` |
| `signOutAction` | encerra a sessão e redireciona para `/login` | — |

```tsx
"use client";

import { useActionState } from "react";
import { signInAction } from "@/features/auth/actions";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
    const [state, formAction, pending] = useActionState(signInAction, {});

    return (
        <form action={formAction}>
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
            <input name="email" type="email" />
            {state.fieldErrors?.email && <p>{state.fieldErrors.email[0]}</p>}
            <input name="password" type="password" />
            {state.fieldErrors?.password && <p>{state.fieldErrors.password[0]}</p>}
            {state.error && <p>{state.error}</p>}
            <button disabled={pending}>{pending ? "Entrando..." : "Entrar"}</button>
        </form>
    );
}
```

Logout: `<form action={signOutAction}><button>Sair</button></form>`.

- **Validação:** os dados passam pelos schemas Zod de `src/features/auth/schemas.ts` antes de chegar ao Better Auth. Erros de campo voltam em `fieldErrors` (ex.: `{ email: ["Email inválido"] }`).
- **`callbackUrl`:** vem de um campo do formulário. Só caminhos internos são aceitos (`/grupos/1`); URLs externas (`https://...`, `//site.com`) viram `/dashboard`, para evitar open redirect.
- **Erros:** os conhecidos (email já cadastrado, senha errada) viram mensagens em português em `error`. Os inesperados (banco fora do ar, bug) vão para o log do servidor como `[auth] <action> falhou` e o usuário vê "Algo deu errado. Tente novamente.".

## Testes
- `npm test` roda os testes (Vitest) uma vez; `npm run test:watch` roda a cada alteração.
- Os testes ficam ao lado do código (`*.test.ts`) e não precisam de banco: Better Auth e Next são substituídos por mocks.

| Arquivo | O que cobre |
|---|---|
| `src/features/auth/*.test.ts` | Server Actions, validação Zod, mensagens de erro e `callbackUrl` |
| `src/lib/session.test.ts` | `getSession`, `requireSession` (redireciona sem sessão) e `unauthorized` (401) |
| `src/app/api/me/route.test.ts` | `/api/me`: 200 com o usuário, 401 sem sessão, sem expor o token |
| `src/proxy.test.ts` | Rotas que o proxy protege (e as que não) e o redirecionamento para `/login` |

Para testar um Route Handler novo, siga o `route.test.ts` da `/api/me`: simule `@/lib/auth`, `next/headers` e, se a rota usar o banco, `@/lib/prisma`, e chame a função (`GET`, `POST`) direto. Arquivos que importam `server-only` precisam de `vi.mock("server-only", () => ({}))`.

O `@/lib/prisma` precisa ser simulado porque ele lança erro ao ser importado sem `DATABASE_URL` (o Vitest não carrega o `.env`) e, com a variável, conectaria num banco de verdade. Simule só os métodos que a rota usa:

```ts
vi.mock("@/lib/prisma", () => ({
    prisma: {
        group: { findMany: vi.fn(), create: vi.fn() },
    },
}));
```

## Pendente
- Telas de `/login` e `/cadastro` (até lá, o redirecionamento para `/login` cai em 404). Usam as Server Actions acima.
