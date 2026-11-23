# Audit log (GOS-037)

Registro das ações sensíveis: quem fez, o quê, em quem, de onde e quando. Por enquanto é só leitura direto no banco; não há tela.

## O que é registrado

| `action` | Quando | `actorId` | `targetType` / `targetId` | `metadata` |
|---|---|---|---|---|
| `GROUP_ARCHIVED` | líder arquiva o grupo (`POST /api/groups/[groupId]/archive`) | líder | `GROUP` / id do grupo | — |
| `GROUP_MEMBER_REMOVED` | líder remove alguém (`DELETE /api/groups/[groupId]/members/[userId]`) | líder | `GROUP` / id do grupo | `{ removedUserId }` |
| `GROUP_LEADER_TRANSFERRED` | líder passa a liderança (`POST /api/groups/[groupId]/leader`) | líder anterior | `GROUP` / id do grupo | `{ previousLeaderId, newLeaderId }` |
| `ACCOUNT_DELETED` | a pessoa exclui a conta (`deleteAccountAction`, [GOS-036](auth.md#excluir-conta-gos-036)) | a própria pessoa | `USER` / id dela | `{ groupsLeft }` |

A troca **automática** de líder (quando o líder sai do grupo ou exclui a conta) não gera `GROUP_LEADER_TRANSFERRED`: ela é consequência de outra ação. No caso da exclusão, quem fica registrado é o `ACCOUNT_DELETED`.

## Como funciona

- **Tabela `audit_log`** (`AuditLog` no `prisma/schema.prisma`), com os enums `AuditAction` e `AuditTargetType`.
- **`recordAuditLog(tx, entry)`** (`src/backend/lib/audit-log.ts`) grava **dentro da transação da própria ação**: ou as duas acontecem, ou nenhuma. Se o registro falhar, a ação é desfeita, porque uma ação sensível sem rastro é pior do que um erro.
- **IP:** `requestIp(headers)` usa o `getIP` do Better Auth com as mesmas opções do `src/backend/lib/auth.ts`, então é o mesmo IP que aparece nas sessões e no rate limit. Fica `null` quando não dá para saber (sem proxy configurado em produção). Rodando local, aparece `127.0.0.1`.
- **Só se acrescenta linha:** o app nunca edita nem apaga registros.

### Por que `actorId` e `targetId` não têm chave estrangeira

O registro precisa continuar existindo, e apontando para o mesmo id, depois que a conta ou o grupo somem: o `purgeDeletedAccounts` (GOS-036) apaga o usuário de vez depois de 30 dias. Com chave estrangeira, o banco apagaria o log junto (`Cascade`) ou zeraria quem fez (`SetNull`).

Pela mesma razão, **`metadata` só leva ids**, nunca nome ou e-mail: depois da anonimização, um id sozinho não identifica mais ninguém.

## Registrar uma ação nova

1. Acrescente o valor no enum `AuditAction` (e uma migration).
2. Na rota ou action, leia o IP **antes** da transação: `const ipAddress = requestIp(request.headers)` (Route Handler) ou `requestIp(await headers())` (Server Action).
3. Dentro do `prisma.$transaction`, depois de a ação dar certo:

   ```ts
   await recordAuditLog(tx, {
       action: "GROUP_ARCHIVED",
       actorId: user.id,
       targetType: "GROUP",
       targetId: groupId,
       ipAddress,
   });
   ```
4. Nos testes da rota, simule o `@/lib/auth` (`vi.mock("@/lib/auth", () => ({ auth: { options: {} } }))`) e o `tx.auditLog.create`, e confira que nada é registrado nos casos de erro.
5. Acrescente a linha na tabela acima.

## Consultas úteis

```sql
-- Histórico de um grupo
SELECT * FROM audit_log WHERE "targetType" = 'GROUP' AND "targetId" = '<id do grupo>' ORDER BY "createdAt" DESC;

-- Tudo o que uma pessoa fez
SELECT * FROM audit_log WHERE "actorId" = '<id do usuário>' ORDER BY "createdAt" DESC;
```

## Pendente

- **Tela** para o líder ver o histórico do grupo (fora do escopo da GOS-037).
- **Prazo de guarda:** o IP é dado pessoal (LGPD). Falta definir por quanto tempo os registros ficam, junto com o inventário de dados pessoais da GOS-027; a limpeza entraria na fila de jobs (GOS-048).
