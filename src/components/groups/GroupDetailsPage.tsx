
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Globe,
  LockKeyhole,
  RefreshCw,
  Users,
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(value));
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-5 py-10 sm:px-8 lg:px-10">
      <div className="mb-8 h-5 w-32 rounded bg-zinc-200" />

      <div className="mb-3 h-9 w-64 rounded bg-zinc-200" />

      <div className="mb-8 h-5 w-96 max-w-full rounded bg-zinc-100" />

      <div className="mb-6 h-24 rounded-2xl bg-zinc-200" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="h-52 rounded-2xl bg-zinc-200" />
        <div className="h-52 rounded-2xl bg-zinc-200" />
      </div>
    </div>
  );
}

export default function GroupDetailsPage({ groupId }: Props) {
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

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
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
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
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
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
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <Link
          href="/grupos"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={17} />
          Voltar para grupos
        </Link>

        <header className="mb-8">
          <p className="mb-2 text-overline uppercase text-text-brand">
            Comunidade
          </p>

          <h1 className="text-h1 text-text-primary">
            {group.name}
          </h1>

          <p className="mt-2 max-w-2xl text-body-md text-text-secondary">
            {group.description ||
              "Este grupo ainda não possui uma descrição."}
          </p>
        </header>

        <div className="mb-6">
          <GroupStatusAlert status={group.status} />
        </div>

        <GroupActions
          group={group}
          isMember={isMember}
          isLeader={isLeader}
          onUpdated={() => setRetryKey((current) => current + 1)}
        />

        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                <CalendarDays size={20} />
              </div>

              <div>
                <p className="text-xs text-zinc-500">
                  Criado em
                </p>

                <p className="text-sm font-medium text-zinc-900">
                  {formatDate(group.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                <Users size={20} />
              </div>

              <div>
                <p className="text-xs text-zinc-500">
                  Participantes
                </p>

                <p className="text-sm font-medium text-zinc-900">
                  {group._count.members}{" "}
                  {group._count.members === 1
                    ? "membro"
                    : "membros"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                {group.visibility === "PUBLIC" ? (
                  <Globe size={20} />
                ) : (
                  <LockKeyhole size={20} />
                )}
              </div>

              <div>
                <p className="text-xs text-zinc-500">
                  Visibilidade
                </p>

                <p className="text-sm font-medium text-zinc-900">
                  {group.visibility === "PUBLIC"
                    ? "Público"
                    : "Privado"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <GroupLeader leader={group.leader} />

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

        {group.creator && (
          <p className="mt-6 text-sm text-text-secondary">
            Grupo criado por{" "}
            <span className="font-medium text-text-primary">
              {group.creator.name}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
