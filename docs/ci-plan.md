# Rascunho — CI com GitHub Actions (Task 3)

> Status: **implementado** — workflow em `.github/workflows/ci.yml`, ajustes em `package.json`, `.nvmrc` e `eslint.config.mjs`. Uso documentado no `README.md`.
> Projeto: Group of Study (Next.js 16, React 19, TypeScript, Prisma 7, PostgreSQL, Docker).

## Objetivo

- Rodar **lint** e **typecheck TypeScript** em todo Pull Request para `main`.
- Adicionar **build** (`next build`) de forma condicional, virando obrigatório só depois de estabilizado.
- Não usar segredos reais no CI.
- Manter o CI rápido e com permissões mínimas.

## Baseline do repositório

> Estado **antes** da implementação (mantido como histórico do plano).

- `.github/` tem apenas `CODEOWNERS`; não existe workflow.
- `package.json` tem `lint`, mas não tem script de `typecheck`.
- `npm ci` dispara `postinstall` → `prisma generate`, que precisa de `DATABASE_URL`.
- Client Prisma é gerado em `src/generated/prisma` (gitignored) e não está no ignore do ESLint.
- Docker usa Node 22.
- `next.config.ts` tem flags experimentais (`cacheComponents`, `partialPrefetching`, `agentFeedback`), então o build precisa ser validado antes de virar obrigatório.

## Ajustes preparatórios

- [x] Adicionar script em `package.json`:
  ```json
  "typecheck": "next typegen && tsc --noEmit"
  ```
  O `next typegen` é necessário para gerar tipos de rota (ex.: `LayoutProps<"/">`).
- [x] Adicionar `"src/generated/**"` ao `globalIgnores` do `eslint.config.mjs`.
- [x] Criar `.nvmrc` com `22`.
- [ ] Opcional: adicionar `engines.node` no `package.json`.
- [x] Documentar o CI no `README.md`.

## Workflow proposto

Arquivo: `.github/workflows/ci.yml`

**Gatilhos:**
- `pull_request` para `main`
- `push` em `main`
- `workflow_dispatch`

**Configurações:**
- `permissions: contents: read`
- `concurrency` com `cancel-in-progress: true`
- cache npm via `actions/setup-node`
- Node 22
- `timeout-minutes`
- placeholders para `DATABASE_URL`, `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL`

### Esboço

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  DATABASE_URL: postgresql://ci:ci@127.0.0.1:5432/ci?schema=public
  BETTER_AUTH_SECRET: ci-placeholder-secret-not-used-in-production
  BETTER_AUTH_URL: http://localhost:3000
  NEXT_TELEMETRY_DISABLED: "1"

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: package-lock.json
      - run: npm ci
      - run: npm run lint

  typecheck:
    name: Typecheck
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: package-lock.json
      - run: npm ci
      - run: npm run typecheck

  build:
    name: Build
    # Habilite com a variável de repositório CI_BUILD_ENABLED=true
    if: ${{ vars.CI_BUILD_ENABLED == 'true' }}
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: package-lock.json
      - run: npm ci
      - run: npm run build
```

## Rollout

1. **Fase 0 — local** ✅
   ```bash
   npm ci
   npm run lint
   npm run typecheck
   npm run build
   ```
2. **Fase 1 — lint + typecheck** ✅ (workflow criado; branch protection ainda a configurar)
   - Criar o workflow.
   - Abrir PR de teste.
   - Exigir `Lint` e `Typecheck` na branch protection.
3. **Fase 2 — build em observação** ⏳ (falta criar a variável `CI_BUILD_ENABLED=true`)
   - Habilitar `CI_BUILD_ENABLED=true`.
   - Rodar por alguns PRs sem exigir o check.
4. **Fase 3 — build obrigatório** ⏳
   - Adicionar `Build` aos required status checks.
   - Atualizar README.

## Testes automatizados

`lint`, `typecheck` e `build` são verificações, não suítes de teste. A task 3, sozinha, **não inclui testes**.

> Atualização: a suíte Vitest já existe (41 testes em `src/features/auth`) e o job `Test` foi incluído no workflow. E2E continua fora do escopo.

### Agora
- Nenhum teste obrigatório; o projeto ainda é o template do Next.
- Opcional: smoke test da home e `prisma validate`.

### Quando houver autenticação
- **Unitário:** Vitest — validações, sessão, formatadores.
- **Componente:** Vitest + React Testing Library — formulários de login/cadastro.
- **Integração:** Vitest + PostgreSQL — rotas de auth, cookies, Better Auth.
- **E2E:** Playwright — cadastro → login → área protegida → logout.

### Quando houver grupos de estudo
- **Unitário:** regras de negócio, permissões, limites.
- **Integração:** criar/entrar/sair de grupo, persistência no Prisma.
- **E2E:** fluxo completo entre dois usuários.

### Recomendações
- Não exigir E2E desde o início (lentidão e flutuação).
- Subir PostgreSQL como `services` no job de integração.
- Rodar `prisma migrate deploy` antes dos testes de integração.
- Upload de traces/screenshots do Playwright em caso de falha.
- Evitar threshold de cobertura antes de haver testes maduros.

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| `LayoutProps`/tipos de rota ausentes | Rodar `next typegen` antes do `tsc` |
| Client Prisma lintado | Ignorar `src/generated/**` no ESLint |
| `postinstall` sem `DATABASE_URL` | Placeholder no `env` do workflow |
| Flags experimentais quebrarem o build | Build condicional até estabilizar |
| Build precisar de banco/auth | Placeholders + serviço Postgres quando necessário |
| Node divergente | `.nvmrc`, `engines` e Node 22 no CI |
| Jobs duplicando `npm ci` | Cache npm; unir jobs se necessário |
| Actions desatualizadas | Pinning de versões e permissões read-only |
| Segredos em PRs de fork | Usar apenas placeholders |

## Critérios de aceite

- [x] Todo PR para `main` dispara o workflow.
- [ ] `Lint` e `Typecheck` bloqueiam merge quando falham. *(falta configurar a branch protection)*
- [x] `next typegen` integrado ao typecheck.
- [x] Client Prisma não gera ruído no lint.
- [x] `npm ci` funciona sem banco real.
- [ ] Build roda com `CI_BUILD_ENABLED=true`. *(falta criar a variável de repositório)*
- [ ] Build vira obrigatório após validação.
- [x] Nenhum segredo real no CI.
- [x] README documenta o CI.

## Decisões pendentes

- [x] Build obrigatório desde o início? **Recomendação: não; começar condicional.**
- [x] Node 22 no CI? **Recomendação: sim.**
- [x] Jobs separados? **Recomendação: sim (`Lint`, `Typecheck`, `Test`, `Build`).**
- [x] Adicionar smoke test já na primeira versão? **Opcional.** — a suíte Vitest já existe (41 testes), então o job `Test` foi incluído; E2E continua fora do escopo.
