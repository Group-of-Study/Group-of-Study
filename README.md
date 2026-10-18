# Group of Study

Plataforma web para grupos de estudo.

# Integrantes
Matheus, Miguel, Gabriel, Eduardo e Talys

## Stack

| Tecnologia | Para que serve |
| --- | --- |
| [Next.js](https://nextjs.org) | Framework React usado no front-end e no back-end (App Router, Server Components e rotas de API). |
| [TypeScript](https://www.typescriptlang.org) | Tipagem estática em todo o projeto, para pegar erros antes de rodar. |
| [Tailwind CSS](https://tailwindcss.com) | Estilização com classes utilitárias direto no JSX. |
| [Node.js](https://nodejs.org) | Ambiente de execução do servidor (**20.9+**; imagens Docker usam **Node 22**). |
| [Prisma](https://www.prisma.io) | ORM: define os modelos do banco, gera as migrations e dá acesso tipado aos dados. |
| [PostgreSQL](https://www.postgresql.org) | Banco de dados relacional. |
| [Better Auth](https://www.better-auth.com) | Autenticação (cadastro, login e sessões). |
| [Docker](https://www.docker.com) | Ambiente de desenvolvimento e build de produção reproduzíveis. |

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/) (v2+)
- (Opcional, fora do Docker) Node.js 20.9+ e npm, se for rodar a app no host

## Arquivos Docker

| Arquivo | Papel |
| --- | --- |
| `Dockerfile` | Imagem de **produção** (multi-stage, `output: 'standalone'`, usuário não-root). |
| `Dockerfile.dev` | Imagem de **desenvolvimento** (`next dev`, hot reload, polling para Windows). |
| `compose.yaml` | Stack de **dev**: app + PostgreSQL. |
| `compose.prod.yaml` | Stack de **produção** opcional (segredos só via ambiente / `.env`). |
| `.dockerignore` | Reduz o contexto de build (exclui `node_modules`, `.next`, `.env`, etc.). |
| `.env.example` | Placeholders de variáveis; copie para `.env`. |

### Prisma 7 e config

O CLI Prisma 7.10+ procura, nesta ordem: `prisma7.config.*`, `.config/prisma7.*`, depois `prisma.config.*`.

Este repositório usa `prisma7.config.ts` na raiz. Os scripts e Dockerfiles passam `--config prisma7.config.ts` de forma explícita. O client é gerado em `src/generated/prisma` (gitignored).

O `postinstall` (`prisma generate --config prisma7.config.ts`) **não** exige um banco real; nos builds Docker usamos uma `DATABASE_URL` placeholder só para carregar a config.

### Dev vs produção

| | Desenvolvimento (`compose.yaml`) | Produção (`Dockerfile` / `compose.prod.yaml`) |
| --- | --- | --- |
| Comando | `next dev` | `node server.js` (standalone) |
| Código | Bind mount + hot reload | Copiado na imagem |
| Banco | Volume `postgres_data` | Volume `postgres_data_prod` |
| Migrations | Manuais (quando existirem) | Manuais — **não** rodam no start |

> O script `npm start` (`next start`) permanece válido para builds locais sem standalone. Na imagem de produção o processo é `node server.js`.

## Começar com Docker (desenvolvimento)

### 1. Copiar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e defina pelo menos `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` e, se desejar, `BETTER_AUTH_SECRET`.

**Host do banco:**

- **Fora do Docker** (Prisma/npm no host): use `localhost` e a porta publicada (`POSTGRES_PORT`, padrão `5432`) — como em `DATABASE_URL` do `.env.example`.
- **Dentro do contêiner `app`**: o Compose define `DATABASE_URL` com host **`postgres`** (nome do serviço). Não use `localhost` dentro do contêiner para falar com o Postgres.

### 2. Subir os serviços

```bash
docker compose up --build
```

Em segundo plano:

```bash
docker compose up --build -d
```

### 3. Verificar

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f postgres
```

Healthcheck do Postgres: o serviço `postgres` deve aparecer como healthy antes da `app` subir de fato (`depends_on: service_healthy`).

### 4. Acessar a aplicação

Abra [http://localhost:3000](http://localhost:3000).

Postgres no host: `127.0.0.1:${POSTGRES_PORT}` (não escuta em `0.0.0.0`).

### 5. Parar e reiniciar (sem perder dados)

```bash
# Parar (mantém o volume do banco)
docker compose stop

# Subir de novo
docker compose start

# Ou derrubar contêineres mantendo volumes
docker compose down
docker compose up -d
```

**Não use** `docker compose down -v` no dia a dia: a flag `-v` remove volumes e **apaga os dados** do PostgreSQL.

### 6. Rebuild após mudanças em dependências ou Dockerfiles

```bash
docker compose up --build -d
```

## Comandos npm e Prisma no contêiner

```bash
# Shell na app
docker compose exec app sh

# Scripts npm
docker compose exec app npm run lint
docker compose exec app npm run build

# Prisma (quando houver models/migrations)
docker compose exec app npx prisma generate --config prisma7.config.ts
docker compose exec app npx prisma migrate dev --config prisma7.config.ts --name nome_da_migration
docker compose exec app npx prisma migrate deploy --config prisma7.config.ts
docker compose exec app npx prisma studio --config prisma7.config.ts
```

### Migrations no futuro

1. Defina models em `prisma/schema.prisma`.
2. Com a stack de dev no ar, gere e aplique:

```bash
docker compose exec app npx prisma migrate dev --config prisma7.config.ts --name init
```

3. Em produção, aplique de forma controlada (job/CI/one-off), **não** no `CMD` da imagem:

```bash
docker compose -f compose.prod.yaml exec app npx prisma migrate deploy --config prisma7.config.ts
```

(Na imagem de produção o CLI Prisma pode não estar instalado se só as deps de produção forem necessárias; nesse caso rode `migrate deploy` a partir de um contêiner/CI com `npm ci` completo apontando para o mesmo `DATABASE_URL`.)

## Build de produção

### Só a imagem (sem Compose)

```bash
docker build -t group-of-study:prod .
```

Executar (é preciso um Postgres alcançável e `DATABASE_URL`):

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" \
  -e BETTER_AUTH_SECRET="..." \
  -e BETTER_AUTH_URL="http://localhost:3000" \
  group-of-study:prod
```

### Com Compose de produção

```bash
cp .env.example .env   # se ainda não tiver
docker compose -f compose.prod.yaml up --build -d
```

## Troubleshooting

| Sintoma | O que verificar |
| --- | --- |
| Porta 3000 em uso | Pare o processo local ou mude o mapeamento em `compose.yaml`. |
| Porta 5432 em uso ou “access permissions” no Windows | Altere `POSTGRES_PORT` no `.env` (ex.: `5433`) e alinhe `DATABASE_URL` no host para a mesma porta. |
| App não conecta ao banco | Dentro do Compose o host deve ser `postgres`, não `localhost`. Confira se o Compose está montando `DATABASE_URL` e se o Postgres está `healthy`. |
| Variáveis vazias / Compose falha | Existe `.env`? Foi copiado de `.env.example` e preenchido? |
| `node_modules` estranho / deps faltando | O volume anônimo `/app/node_modules` pode estar desatualizado: `docker compose down` e `docker compose up --build` (sem `-v`, a menos que queira apagar o banco). |
| Hot reload não funciona no Windows | `WATCHPACK_POLLING` e `CHOKIDAR_USEPOLLING` já estão ativos no Compose/`Dockerfile.dev`. |
| `prisma generate` falha no build | Confirme que `prisma/`, `prisma7.config.ts` e o lockfile entram na imagem (não estão no `.dockerignore`). |
| Cliente Prisma “sumiu” no dev | É regenerado no start do contêiner; se precisar: `docker compose exec app npx prisma generate --config prisma7.config.ts`. |

## Scripts npm (host ou contêiner)

| Script | Comando |
| --- | --- |
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` (local; produção Docker usa `node server.js`) |
| `lint` | `eslint` |
| `postinstall` | `prisma generate --config prisma7.config.ts` |
