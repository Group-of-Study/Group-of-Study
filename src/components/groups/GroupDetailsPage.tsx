
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
      <div className="mb-8 h-5 w-32 rounded bg-zinc-200" />
      <div className="mb-4 h-40 rounded-3xl bg-zinc-200" />
      <div className="mb-6 h-14 rounded-xl bg-zinc-200" />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="h-72 rounded-2xl bg-zinc-200" />
        <div className="h-72 rounded-2xl bg-zinc-200" />
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
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
        <Icon size={26} />
      </div>

      <h3 className="text-base font-semibold text-zinc-900">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
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
          className="mx-auto mb-4 text-zinc-400"
          size={40}
        />

        <h1 className="text-xl font-semibold text-zinc-900">
          Grupo não encontrado
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          O grupo não existe ou você não tem acesso a ele.
        </p>

        <Link
          href="/grupos"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
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
          className="mx-auto mb-4 text-red-500"
          size={40}
        />

        <h1 className="text-xl font-semibold text-zinc-900">
          Não foi possível carregar o grupo
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          {error ?? "Ocorreu um erro inesperado."}
        </p>

        <button
          type="button"
          onClick={() => setRetryKey((current) => current + 1)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
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
    <main className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <Link
          href="/grupos"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-blue-900"
        >
          <ArrowLeft size={17} />
          Voltar para grupos
        </Link>

        <GroupStatusAlert status={group.status} />

        {/* Cabeçalho do grupo */}
        <section className="relative mt-5 overflow-hidden rounded-3xl bg-[#14294f] p-6 text-white shadow-lg sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[40px] border-white/5" />

          <div className="pointer-events-none absolute -bottom-36 right-32 size-72 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
                <BookOpen size={14} />
                Grupo de estudos
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
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

            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/80 sm:text-base">
              {group.description ||
                "Este grupo ainda não possui uma descrição."}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-blue-100/80">
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
        <nav className="mt-8 overflow-x-auto border-b border-zinc-200">
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
                      ? "border-blue-800 text-blue-900"
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
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
                    <h2 className="text-lg font-bold text-zinc-900">
                      Visão geral
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Acompanhe as atividades e o desenvolvimento do grupo.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                        <Target size={20} />
                      </div>

                      <p className="text-sm text-zinc-500">Metas</p>

                      <p className="mt-1 text-2xl font-bold text-zinc-900">
                        —
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        Metas cadastradas
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <CheckCircle2 size={20} />
                      </div>

                      <p className="text-sm text-zinc-500">Tarefas</p>

                      <p className="mt-1 text-2xl font-bold text-zinc-900">
                        —
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        Tarefas concluídas
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                        <Trophy size={20} />
                      </div>

                      <p className="text-sm text-zinc-500">Desafios</p>

                      <p className="mt-1 text-2xl font-bold text-zinc-900">
                        —
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        Desafios ativos
                      </p>
                    </div>
                  </div>
                </section>

                {/* Metas */}
                <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-zinc-900">
                        Metas do grupo
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Objetivos que orientam os estudos.
                      </p>
                    </div>

                    <Target className="text-blue-800" size={21} />
                  </div>

                  <EmptyPanel
                    icon={Target}
                    title="Nenhuma meta disponível"
                    description="Quando uma meta for criada, ela aparecerá aqui para que todos possam acompanhar o progresso."
                  />
                </section>

                {/* Tarefas */}
                <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-zinc-900">
                        Tarefas recentes
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Organização das atividades de estudo.
                      </p>
                    </div>

                    <ClipboardList
                      className="text-blue-800"
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
                <GroupLeader leader={group.leader} />

                <section className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold text-zinc-900">
                      Participantes
                    </h2>

                    <button
                      type="button"
                      onClick={() => setActiveTab("members")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:text-blue-950"
                    >
                      Ver todos
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                      <Users size={21} />
                    </div>

                    <div>
                      <p className="text-2xl font-bold text-zinc-900">
                        {group._count.members}
                      </p>

                      <p className="text-xs text-zinc-500">
                        Pessoas neste grupo
                      </p>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full w-full rounded-full bg-blue-800" />
                  </div>

                  <p className="mt-2 text-xs text-zinc-400">
                    Comunidade de estudos
                  </p>
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <CalendarDays
                      size={19}
                      className="text-blue-800"
                    />

                    <h2 className="font-bold text-zinc-900">
                      Sobre o grupo
                    </h2>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-zinc-500">
                        Visibilidade
                      </span>

                      <span className="font-medium text-zinc-800">
                        {group.visibility === "PUBLIC"
                          ? "Público"
                          : "Privado"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-zinc-500">
                        Participantes
                      </span>

                      <span className="font-medium text-zinc-800">
                        {group._count.members}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-zinc-500">
                        Criado em
                      </span>

                      <span className="font-medium text-zinc-800">
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

          {activeTab === "goals" && (
            <EmptyPanel
              icon={Target}
              title="Metas do grupo"
              description="As metas cadastradas para este grupo serão exibidas nesta área."
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
                <h2 className="text-xl font-bold text-zinc-900">
                  Membros do grupo
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
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
          <p className="mt-8 border-t border-zinc-200 pt-5 text-sm text-zinc-500">
            Grupo criado por{" "}
            <span className="font-semibold text-zinc-800">
              {group.creator.name}
            </span>
          </p>
        )}
      </div>
    </main>
  );
}
