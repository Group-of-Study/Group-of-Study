# Metas — como usar

Metas são passos concretos que um grupo combina ("Resolver a lista 5 até sexta"). O backend é o da GOS-007; a tela segue o Figma (Grupo — Visão geral, Metas e o modal Nova meta).

## Onde aparecem

**Página do grupo** (`/grupos/[groupId]`):
- **Visão geral › "Metas da semana"**: até 4 metas, com as pendentes que vencem até domingo (inclusive as atrasadas) e as concluídas desde segunda. "Ver todas" abre a aba Metas.
- **Aba "Metas"** (com o total ao lado do nome): todas as metas, em "Pendentes" (prazo mais próximo primeiro, sem prazo no fim) e "Concluídas" (a mais recente primeiro).
- O card "Metas" da visão geral mostra o total e quantas foram concluídas.

## Quem pode o quê

Espelha as regras da API. O front só esconde o que a API recusaria:

| Ação | Quem | Grupo |
|---|---|---|
| Ver | participantes (quem não participa vê "Metas são só para participantes") | qualquer status |
| Criar, concluir, reabrir | participantes | só ativo |
| Editar, excluir | quem criou a meta ou o líder | só ativo |

Com o grupo arquivado ou encerrado, a lista fica só para consulta.

## API

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/api/groups/[groupId]/goals` | lista as metas do grupo |
| `POST` | `/api/groups/[groupId]/goals` | cria (`{ title, description, dueDate }`) |
| `PATCH` | `/api/groups/[groupId]/goals/[goalId]` | edita |
| `DELETE` | `/api/groups/[groupId]/goals/[goalId]` | exclui |
| `PATCH` | `/api/groups/[groupId]/goals/[goalId]/complete` | conclui (preenche `completedAt`) |
| `DELETE` | `/api/groups/[groupId]/goals/[goalId]/complete` | reabre (desmarca; `completedAt` volta a `null`) |

- Todas devolvem a meta no mesmo formato (`GOAL_SELECT` em `src/features/goals/goal-select.ts`), então o front troca a meta da lista pela resposta, sem recarregar tudo.
- Concluir e reabrir só mudam se o status ainda for o de partida (`updateMany` com o status no `where`): dois cliques ao mesmo tempo não fazem a mesma coisa duas vezes; o segundo recebe 409.
- Erros de validação vêm como `issues: [{ field, message }]`, o formato da [auth.md](auth.md#formato-das-respostas-da-api).

## Prazo e fuso

- O prazo é um instante (`dueDate`). No formulário são dois campos: **dia** e **horário**. Sem horário, vale **até 23h59** daquele dia, e a lista mostra só o dia ("Sex, 24/10" em vez de "Sex, 24/10, 23h59").
- "Hoje", "Amanhã", "Esta semana" (segunda a domingo) e "Atrasada" são calculados **no navegador, no fuso de quem está vendo** (`src/features/goals/dates.ts`). As funções recebem `now` para os testes não dependerem do relógio; o teste fixa o fuso em `America/Sao_Paulo`.
- `completedAt` (migration `add_goal_completed_at`) guarda quando a meta foi concluída ("Concluída hoje"). Metas concluídas antes da migration ganharam o `updatedAt` como melhor estimativa.

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/features/goals/types.ts` | Tipos `Goal` e `GoalInput` do front |
| `src/features/goals/api.ts` | Chamadas à API (sobre o `fetchApi`; nunca lançam erro) |
| `src/features/goals/dates.ts` | Rótulos de prazo, ordenação, "metas da semana" e conversão dos campos de data |
| `src/features/goals/use-group-goals.ts` | Estado das metas de um grupo e dos modais (a visão geral e a aba dividem o mesmo) |
| `src/features/goals/components/goal-item.tsx` | Linha da meta: checkbox, título, detalhes, iniciais de quem criou, editar/excluir |
| `src/features/goals/components/goal-form-dialog.tsx` | Modal de criar/editar |
| `src/features/goals/components/group-goals.tsx` | "Metas da semana", aba Metas e os modais, para a página do grupo |
| `src/components/ui/dialog.tsx` | `Dialog` do Design System, sobre o `<dialog>` nativo (foco preso, Esc, fundo escuro) |

## Fora do escopo (por enquanto)

- **XP, recompensa e "Meta coletiva"** do modal do Figma: entram com a gamificação (GOS-044).
- **Responsável** pela meta: o Figma mostra "Responsável: Ana", mas a meta só tem quem criou. A linha mostra "Criada por".
- **Página `/metas`** (todas as metas de todos os grupos): vem num PR separado.
