# Agenda do grupo (GOS-042)

Encontros de estudo marcados pelo líder do grupo: plantão de dúvidas, revisão para a prova, leitura em dupla. Cada encontro tem início, fim e **onde** acontece (um local, um link ou os dois).

## Quem pode o quê

| Ação | Quem | Grupo |
|---|---|---|
| Ver a agenda | participantes | qualquer status |
| Marcar, editar, excluir | só o líder | só ativo |

As checagens ficam num lugar só: `checkSessionAccess` em `src/features/sessions/access.ts`. Ela devolve o grupo ou a resposta de erro pronta (400, 403, 404 ou 409).

## API

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/api/groups/[groupId]/sessions` | próximos encontros (ainda não acabaram), do mais próximo ao mais distante; até 50 |
| `GET` | `/api/groups/[groupId]/sessions?when=past` | encontros que já acabaram, do mais recente ao mais antigo; até 20 |
| `POST` | `/api/groups/[groupId]/sessions` | marca um encontro |
| `PATCH` | `/api/groups/[groupId]/sessions/[sessionId]` | edita (recebe o encontro inteiro, como o `POST`) |
| `DELETE` | `/api/groups/[groupId]/sessions/[sessionId]` | exclui |

Corpo do `POST` e do `PATCH`:

```json
{
  "title": "Plantão de dúvidas",
  "description": "Lista 4, questões 5 a 9",
  "startsAt": "2026-11-20T22:00:00.000Z",
  "endsAt": "2026-11-20T23:30:00.000Z",
  "location": "Biblioteca, sala 3",
  "link": "https://meet.google.com/abc-defg-hij"
}
```

Todas as respostas trazem o encontro no mesmo formato (`SESSION_SELECT`), com `createdBy: { id, name }`.

## Regras de validação

O schema (`sessionInputSchema` em `src/features/sessions/schema.ts`) é o mesmo na API e no formulário da tela, então as mensagens são as mesmas nos dois:

- título obrigatório, até 120 caracteres; descrição até 1000;
- **o fim depois do início**, e no máximo **12 horas** de duração;
- **local ou link** (pelo menos um); o link precisa começar com `http://` ou `https://` (nada de `javascript:`);
- **não dá para marcar um encontro que já acabou**. Um que já começou mas ainda não acabou pode ser salvo;
- encontro que **já aconteceu não pode ser editado** (409), só excluído. Ele fica como registro em `?when=past`;
- campos a mais são recusados (`.strict()`), então ninguém troca o `groupId` pelo corpo.

Erros de validação vêm como `issues: [{ field, message }]`, o formato da [auth.md](auth.md#formato-das-respostas-da-api).

## Banco

Tabela `study_session` (model `StudySession`, migration `add_study_sessions`):

- `onDelete: Cascade` no grupo: os encontros somem junto com o grupo;
- `onDelete: SetNull` em quem criou: o encontro continua se a conta for apagada;
- índice em `(groupId, startsAt)` para a lista da agenda.

## Fora do escopo (por enquanto)

- **Confirmar presença** ("Vou participar" e "5 confirmados" no card "Próximo encontro" do Figma).
- **Encontros recorrentes** ("3x por semana" no cabeçalho do grupo do Figma).
- **Avisar os participantes** quando um encontro é marcado ou muda (notificação).
