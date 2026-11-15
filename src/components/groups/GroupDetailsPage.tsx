
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Globe,
  LockKeyhole,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Target,
  Trophy,
  Users,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";

import GroupLeader from "./GroupLeader";
import GroupMembers from "./GroupMembers";
import GroupStatusAlert from "./GroupStatusAlert";
import GroupActions from "./GroupActions";

import {
  goalCounts,
  GroupGoalDialogs,
  GroupGoalsTab,
  GroupWeekGoals,
} from "@/features/goals/components/group-goals";
import { useGroupGoals } from "@/features/goals/use-group-goals";
import {
  GroupAgendaTab,
  GroupSessionDialogs,
  NextSessionCard,
} from "@/features/sessions/components/group-agenda";
import { useGroupSessions } from "@/features/sessions/use-group-sessions";

import type {
  GroupDetails,
  GroupDetailsResponse,
  GroupsErrorResponse,
} from "@/types/group";

type Props = {
  groupId: string;
};

type Tab =
  | "overview"
  | "goals"
  | "agenda"
  | "tasks"
  | "challenges"
  | "members"
  | "ranking"
  | "wall";

const tabs: {
  id: Tab;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "goals", label: "Metas", icon: Target },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "tasks", label: "Tarefas", icon: ClipboardList },
  { id: "challenges", label: "Desafios", icon: Trophy },
  { id: "members", label: "Membros", icon: Users },
  { id: "ranking", label: "Ranking", icon: ShieldCheck },
  { id: "wall", label: "Mural", icon: MessageSquare },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(value));
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-5 py-10 sm:px-8">
      <div className="mb-8 h-5 w-32 rounded bg-bg-muted" />
      <div className="mb-4 h-40 rounded-3xl bg-bg-muted" />
      <div className="mb-6 h-14 rounded-xl bg-bg-muted" />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="h-72 rounded-2xl bg-bg-muted" />
        <div className="h-72 rounded-2xl bg-bg-muted" />
      </div>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Target;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-bg-surface px-6 py-12 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-bg-brand-subtle text-text-brand">
        <Icon size={26} />
      </div>

      <h3 className="text-base font-semibold text-text-primary">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
        {description}
      </p>
    </div>
  );
}

export default function GroupDetailsPage({ groupId }: Props) {
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  // Metas do grupo: recarregam junto com o grupo (entrar, sair, remover alguém).
  const goals = useGroupGoals(groupId, retryKey);
  // Agenda (GOS-042): também recarrega junto com o grupo.
  const sessions = useGroupSessions(groupId, retryKey);
  const counts = goalCounts(goals);

  useEffect(() => {
    const controller = new AbortController();

    async function loadGroup() {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);

        const response = await fetch(
          `/api/groups/${encodeURIComponent(groupId)}`,
          {
            method: "GET",
            credentials: "same-origin",
            signal: controller.signal,
          },
        );

        const result = (await response.json()) as
          | GroupDetailsResponse
          | GroupsErrorResponse;

        if (!response.ok) {
          if (response.status === 404) {
            setNotFound(true);
            return;
          }

          throw new Error(
            "error" in result
              ? result.error
              : "Não foi possível carregar o grupo.",
          );
        }

        if (!("data" in result)) {
          throw new Error("Resposta inválida do servidor.");
        }

        setGroup(result.data);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os detalhes do grupo.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadGroup();

    return () => controller.abort();
  }, [groupId, retryKey]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8">
        <AlertCircle
          className="mx-auto mb-4 text-text-tertiary"
          size={40}
        />

        <h1 className="text-xl font-semibold text-text-primary">
          Grupo não encontrado
        </h1>

        <p className="mt-2 text-sm text-text-secondary">
          O grupo não existe ou você não tem acesso a ele.
        </p>

        <Link
          href="/grupos"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-bg-brand px-4 py-2.5 text-sm font-medium text-text-on-brand transition hover:bg-bg-brand-hover"
        >
          <ArrowLeft size={17} />
          Voltar para grupos
        </Link>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8">
        <AlertCircle
          className="mx-auto mb-4 text-text-danger"
          size={40}
        />

        <h1 className="text-xl font-semibold text-text-primary">
          Não foi possível carregar o grupo
        </h1>

        <p className="mt-2 text-sm text-text-secondary">
          {error ?? "Ocorreu um erro inesperado."}
        </p>

        <button
          type="button"
          onClick={() => setRetryKey((current) => current + 1)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-bg-brand px-4 py-2.5 text-sm font-medium text-text-on-brand transition hover:bg-bg-brand-hover"
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  const isMember = group.members.some(
    (member) => member.user.id === group.currentUserId,
  );

  const isLeader = group.leader?.id === group.currentUserId;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <Link
          href="/grupos"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-text-brand"
        >
          <ArrowLeft size={17} />
          Voltar para grupos
        </Link>

        <GroupStatusAlert status={group.status} />

        {/* Cabeçalho do grupo */}
        <section className="relative mt-5 overflow-hidden rounded-3xl bg-bg-brand-strong p-6 text-text-inverse shadow-lg sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[40px] border-text-inverse/5" />

          <div className="pointer-events-none absolute -bottom-36 right-32 size-72 rounded-full bg-bg-accent/10 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-text-inverse/10 px-3 py-1.5 text-xs font-medium text-text-inverse/80">
                <BookOpen size={14} />
                Grupo de estudos
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-text-inverse/10 px-3 py-1.5 text-xs font-medium text-text-inverse/80">
                {group.visibility === "PUBLIC" ? (
                  <Globe size={14} />
                ) : (
                  <LockKeyhole size={14} />
                )}

                {group.visibility === "PUBLIC" ? "Público" : "Privado"}
              </span>
            </div>

            <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              {group.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-text-inverse/80 sm:text-base">
              {group.description ||
                "Este grupo ainda não possui uma descrição."}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-text-inverse/80">
              <span className="inline-flex items-center gap-2">
                <Users size={17} />

                {group._count.members}{" "}
                {group._count.members === 1
                  ? "participante"
                  : "participantes"}
              </span>

              <span className="inline-flex items-center gap-2">
                <CalendarDays size={17} />
                Criado em {formatDate(group.createdAt)}
              </span>

              {group.leader && (
                <span className="inline-flex items-center gap-2">
                  <Trophy size={17} />
                  Líder: {group.leader.name}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Ações do grupo */}
        <section className="mt-5">
          <GroupActions
            group={group}
            isMember={isMember}
            isLeader={isLeader}
            onUpdated={() => setRetryKey((current) => current + 1)}
          />
        </section>

        {/* Navegação */}
        <nav className="mt-8 overflow-x-auto border-b border-border-default">
          <div className="flex min-w-max items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                    selected
                      ? "border-border-brand text-text-brand"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                  {tab.id === "goals" && counts && (
                    <span className="rounded-full bg-bg-muted px-2 py-0.5 text-caption text-text-secondary">
                      {counts.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Conteúdo das abas */}
        <div className="mt-7">
          {activeTab === "overview" && (
            <div className="grid items-start gap-6 lg:grid-cols-[1.55fr_0.85fr]">
              <div className="space-y-6">
                {/* Indicadores */}
                <section>
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-text-primary">
                      Visão geral
                    </h2>

                    <p className="mt-1 text-sm text-text-secondary">
                      Acompanhe as atividades e o desenvolvimento do grupo.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border-default bg-bg-surface p-5">
                      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-bg-brand-subtle text-text-brand">
                        <Target size={20} />
                      </div>

                      <p className="text-sm text-text-secondary">Metas</p>

                      <p className="mt-1 text-2xl font-bold text-text-primary">
                        {counts ? counts.total : "—"}
                      </p>

                      <p className="mt-1 text-xs text-text-tertiary">
                        {counts
                          ? `${counts.completed} ${counts.completed === 1 ? "concluída" : "concluídas"}`
                          : "Metas cadastradas"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border-default bg-bg-surface p-5">
                      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-bg-success-subtle text-text-success">
                        <CheckCircle2 size={20} />
                      </div>

                      <p className="text-sm text-text-secondary">Tarefas</p>

                      <p className="mt-1 text-2xl font-bold text-text-primary">
                        —
                      </p>

                      <p className="mt-1 text-xs text-text-tertiary">
                        Tarefas concluídas
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border-default bg-bg-surface p-5">
                      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-bg-level-subtle text-text-level">
                        <Trophy size={20} />
                      </div>

                      <p className="text-sm text-text-secondary">Desafios</p>

                      <p className="mt-1 text-2xl font-bold text-text-primary">
                        —
                      </p>

                      <p className="mt-1 text-xs text-text-tertiary">
                        Desafios ativos
                      </p>
                    </div>
                  </div>
                </section>

                {/* Metas da semana */}
                <GroupWeekGoals
                  controller={goals}
                  group={group}
                  isMember={isMember}
                  isLeader={isLeader}
                  onSeeAll={() => setActiveTab("goals")}
                />

                {/* Tarefas */}
                <section className="rounded-2xl border border-border-default bg-bg-surface p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-text-primary">
                        Tarefas recentes
                      </h2>

                      <p className="mt-1 text-sm text-text-secondary">
                        Organização das atividades de estudo.
                      </p>
                    </div>

                    <ClipboardList
                      className="text-text-brand"
                      size={21}
                    />
                  </div>

                  <EmptyPanel
                    icon={ClipboardList}
                    title="Nenhuma tarefa cadastrada"
                    description="As tarefas do grupo serão exibidas aqui quando estiverem disponíveis."
                  />
                </section>
              </div>

              {/* Coluna lateral */}
              <aside className="space-y-6">
                <NextSessionCard
                  controller={sessions}
                  group={group}
                  isMember={isMember}
                  isLeader={isLeader}
                  onSeeAgenda={() => setActiveTab("agenda")}
                />

                <GroupLeader leader={group.leader} />

                <section className="rounded-2xl border border-border-default bg-bg-surface p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold text-text-primary">
                      Participantes
                    </h2>

                    <button
                      type="button"
                      onClick={() => setActiveTab("members")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-text-brand hover:underline"
                    >
                      Ver todos
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-bg-brand-subtle text-text-brand">
                      <Users size={21} />
                    </div>

                    <div>
                      <p className="text-2xl font-bold text-text-primary">
                        {group._count.members}
                      </p>

                      <p className="text-xs text-text-secondary">
                        Pessoas neste grupo
                      </p>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-bg-muted">
                    <div className="h-full w-full rounded-full bg-bg-brand" />
                  </div>

                  <p className="mt-2 text-xs text-text-tertiary">
                    Comunidade de estudos
                  </p>
                </section>

                <section className="rounded-2xl border border-border-default bg-bg-surface p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <CalendarDays
                      size={19}
                      className="text-text-brand"
                    />

                    <h2 className="font-bold text-text-primary">
                      Sobre o grupo
                    </h2>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-text-secondary">
                        Visibilidade
                      </span>

                      <span className="font-medium text-text-primary">
                        {group.visibility === "PUBLIC"
                          ? "Público"
                          : "Privado"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-text-secondary">
                        Participantes
                      </span>

                      <span className="font-medium text-text-primary">
                        {group._count.members}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-text-secondary">
                        Criado em
                      </span>

                      <span className="font-medium text-text-primary">
                        {new Date(group.createdAt).toLocaleDateString(
                          "pt-BR",
                        )}
                      </span>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          )}

          {activeTab === "agenda" && (
            <GroupAgendaTab
              controller={sessions}
              group={group}
              isMember={isMember}
              isLeader={isLeader}
            />
          )}

          {activeTab === "goals" && (
            <GroupGoalsTab
              controller={goals}
              group={group}
              isMember={isMember}
              isLeader={isLeader}
            />
          )}

          {activeTab === "tasks" && (
            <EmptyPanel
              icon={ClipboardList}
              title="Tarefas do grupo"
              description="Aqui ficarão as tarefas e atividades organizadas pelos participantes."
            />
          )}

          {activeTab === "challenges" && (
            <EmptyPanel
              icon={Trophy}
              title="Desafios"
              description="Os desafios de estudo do grupo aparecerão nesta área."
            />
          )}

          {activeTab === "members" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  Membros do grupo
                </h2>

                <p className="mt-1 text-sm text-text-secondary">
                  Conheça os participantes e veja quem lidera a comunidade.
                </p>
              </div>

              <GroupMembers
                groupId={group.id}
                members={group.members}
                leaderId={group.leader?.id ?? null}
                currentUserId={group.currentUserId}
                isLeader={isLeader}
                onMemberRemoved={() =>
                  setRetryKey((current) => current + 1)
                }
              />
            </div>
          )}

          {activeTab === "ranking" && (
            <EmptyPanel
              icon={Trophy}
              title="Ranking do grupo"
              description="O ranking ficará disponível quando a pontuação e as atividades dos participantes estiverem integradas."
            />
          )}

          {activeTab === "wall" && (
            <EmptyPanel
              icon={MessageSquare}
              title="Mural do grupo"
              description="Este espaço será utilizado para compartilhar avisos e mensagens com os participantes."
            />
          )}
        </div>

        {group.creator && (
          <p className="mt-8 border-t border-border-default pt-5 text-sm text-text-secondary">
            Grupo criado por{" "}
            <span className="font-semibold text-text-primary">
              {group.creator.name}
            </span>
          </p>
        )}
      </div>

      <GroupGoalDialogs controller={goals} groupId={group.id} />
      <GroupSessionDialogs controller={sessions} />
    </div>
  );
}
