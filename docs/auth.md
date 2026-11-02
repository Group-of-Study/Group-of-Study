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

## Rate limit
Limita tentativas por IP para dificultar ataques de força bruta. **Só fica ativo em produção** (`NODE_ENV=production`).

| Rota | Limite |
|---|---|
| Login (`/sign-in/email`) | 5 tentativas por minuto **por IP** |
| Login (`/sign-in/email`) | 10 tentativas a cada 15 minutos **por conta (email)** |
| Cadastro (`/sign-up/email`) | 3 tentativas por minuto por IP |
| Demais rotas de `/api/auth/*` | 100 requisições por minuto por IP |

- Os limites ficam em `src/lib/rate-limit.ts` (`AUTH_RATE_LIMITS` e `ACCOUNT_SIGN_IN_LIMIT`).
- **Limite por conta:** conta todas as tentativas de login de um email (maiúsculas e espaços não importam), venham de qualquer IP. Protege a senha mesmo que o IP seja falsificado. É um hook do Better Auth (`src/lib/account-rate-limit.ts`), então vale para a API e para as Server Actions. **Contra:** quem errar a senha de outra pessoa de propósito trava o login dela por até 15 minutos.
- Vale para os **dois caminhos**: a API HTTP (`/api/auth/*`, via Better Auth) e as Server Actions. O rate limit do Better Auth não roda em chamadas `auth.api.*` feitas no servidor, então as actions aplicam o mesmo limite com o mesmo contador (`checkAuthRateLimit` em `src/features/auth/rate-limit.ts`). Trocar de caminho não zera as tentativas.
- Bloqueado: a API responde `429` com o header `X-Retry-After`; a action devolve `{ error: "Muitas tentativas. Tente novamente em N segundos." }` (ou "N minutos").
- O contador fica **em memória**: zera quando o servidor reinicia e não é compartilhado entre instâncias. Para rodar mais de uma instância, trocar por um armazenamento compartilhado (banco ou Redis) em `src/lib/rate-limit.ts`.
- O IP vem do header `x-forwarded-for`. **O Next repassa esse header como o cliente mandou**, então com o app exposto direto qualquer um inventa um IP por tentativa e escapa do limite por IP (o limite por conta continua valendo). Em produção, colocar um proxy reverso (Nginx, Caddy, Cloudflare) que **sobrescreva** o `x-forwarded-for` com o IP real e configurar `advanced.ipAddress.trustedProxies` no `src/lib/auth.ts`. Pedidos sem IP confiável dividem um único contador.

Para testar localmente: `npm run build && npm start` (modo produção) e repetir o login mais de 5 vezes.

## Login, cadastro e logout (Server Actions)
Ficam em `src/features/auth/actions.ts`, no formato do `useActionState`:

| Action | Sucesso | Erro |
|---|---|---|
| `signUpAction` | cria a conta, inicia a sessão e redireciona para o `callbackUrl` | devolve `{ error }` ou `{ fieldErrors }`, sempre com `values` |
| `signInAction` | inicia a sessão e redireciona para o `callbackUrl` | devolve `{ error }` ou `{ fieldErrors }`, sempre com `values` |
| `signOutAction` | encerra a sessão e redireciona para `/login` | — |

Exemplo mínimo (a versão completa, com o visual do Figma, está em `src/features/auth/components/login-form.tsx`):

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

## Telas de login e cadastro
`/login` e `/cadastro` seguem o Figma (Público / 02 · Login, Público / 03 · Cadastro e as versões Mobile).

| Arquivo | Papel |
|---|---|
| `src/app/(auth)/layout.tsx` | Moldura das duas telas: painel da marca + área do formulário (no mobile, marca em cima e formulário numa "folha" branca) |
| `src/app/(auth)/login/page.tsx`, `cadastro/page.tsx` | Páginas: só montam os `<Suspense>` e o formulário |
| `src/features/auth/components/` | `LoginForm`, `SignUpForm` (Client Components com `useActionState`) e as partes das telas |
| `src/features/auth/auth-page.ts` | `getCallbackUrl` (lê o `?callbackUrl=`) e `redirectIfAuthenticated` |
| `src/components/ui/` | Componentes base do Design System: `Button`, `TextField`, `Checkbox`, `Alert`, `LogoMark` |

- **Logado abrindo `/login` ou `/cadastro`:** vai direto para o `callbackUrl` (ou `/dashboard`). A regra fica na página, não no proxy, para não criar loop com cookie expirado.
- **`callbackUrl`:** a página repassa o `?callbackUrl=` para o formulário (campo escondido) e para o link "Criar conta" / "Entrar", então o destino não se perde ao trocar de tela. Valor externo é descartado já na página.
- **Suspense:** sessão e `searchParams` só existem na hora do request (exigência do `cacheComponents`). O formulário aparece na hora (fallback) e a checagem de sessão roda num `<Suspense>` separado, para não atrasar a tela.
- **Campos só do formulário:** o cadastro pede "Confirmar senha" e "Li e aceito os termos de uso", validados no `signUpSchema`; o Better Auth recebe só `name`, `email` e `password`. No login, "Lembrar de mim" vira o `rememberMe` do Better Auth (desmarcado, a sessão acaba ao fechar o navegador).
- **Valores após erro:** o React limpa o formulário depois da action. Por isso as actions devolvem `values` (email, nome, checkboxes; **nunca a senha**) e os campos usam como `defaultValue`.

### Tokens do Design System
Os tokens do Figma (Foundations) ficam no `@theme` do `src/app/globals.css`, **com o mesmo nome do Figma**: `--color-bg-brand` vira a classe `bg-bg-brand`, `--color-text-secondary` vira `text-text-secondary`, `--color-border-default` vira `border-border-default`. Tipografia: `text-display-lg`, `text-h1`…`text-h4`, `text-body-md`, `text-body-sm`, `text-label-sm`, `text-caption` (tamanho, altura de linha, espaçamento e peso juntos). Use os tokens em vez de cores fixas (`#0969DA`) ou da paleta padrão do Tailwind (`zinc-*`).

## Pendente
- "Esqueci minha senha": está no Figma, mas fica de fora até existir a recuperação de senha (precisa de envio de email).
- Página de termos de uso (o checkbox do cadastro ainda não tem link).
- Tema escuro: os tokens do escuro já existem no Figma; hoje só o claro está no `globals.css`.
