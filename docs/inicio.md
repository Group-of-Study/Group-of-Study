# Início e onboarding (GOS-040)

`/dashboard` é o **Início**: para onde login e cadastro levam (`DEFAULT_REDIRECT` em `src/features/auth/callback-url.ts`) e o primeiro item do menu.

Hoje a página tem:
- o checklist **"Primeiros passos"** (Figma: 11 · Início — novo usuário), só para quem acabou de chegar;
- **"Seus grupos"**: os grupos ativos da pessoa (`GroupCard`) ou, sem nenhum, o convite para explorar ou criar um grupo.

O resto do Figma 01 · Dashboard (nível, XP, sequência, constância, ranking, desafio da semana, mural) depende da gamificação (GOS-044) e de metas (tela ainda não existe).

## "Primeiros passos"

| Arquivo | Papel |
|---|---|
| `src/features/onboarding/steps.ts` | Calcula os passos a partir dos dados da pessoa (`buildOnboarding`). Função pura, com testes |
| `src/features/onboarding/actions.ts` | `dismissOnboardingAction`: "Pular" ou "Fechar" salvam `user.onboardingDoneAt` |
| `src/features/onboarding/components/` | O checklist e o botão Pular/Fechar |
| `src/app/(app)/dashboard/page.tsx` | A página Início |

| Passo | Quando conta como feito |
|---|---|
| Criar sua conta | Sempre (a pessoa já está logada) |
| Entrar ou criar um grupo | Está em pelo menos um grupo ativo. Botão "Encontrar grupo" → `/grupos` |
| Definir sua primeira meta | **"Em breve"**: ainda não existe tela para criar meta. Não entra na conta do progresso |

- **Os passos não são salvos um a um:** são calculados na hora (ex.: quantos grupos a pessoa tem). Só fica salvo quando ela **pula** ou **fecha** o checklist (`onboardingDoneAt`), e a partir daí ele não aparece mais, em nenhum aparelho.
- Completou os passos disponíveis: o título vira "Tudo pronto!" e o botão "Pular" vira "Fechar". O checklist não some sozinho: assim, quando o passo da meta for ativado, quem já fechou não vê o checklist de novo.
- **Contas que já existiam** foram marcadas como concluídas na migration `add_onboarding_done_at`: o checklist é só para o primeiro acesso.
- Sem o "+50 XP" e sem o card de nível do Figma: dependem da gamificação.

## Quando a tela de Metas existir
Em `steps.ts`, trocar o `status: "soon"` do passo `goal` por `done`/`pending` conforme a pessoa já tenha criado uma meta (`Goal.authorId`), e pôr o botão "Criar meta" no checklist.
