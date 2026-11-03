
"use client";

import { useEffect, useState } from "react";

import Button from "@/components/ui/button";
import GroupEmptyState from "@/components/groups/GroupEmptyState";
import GroupList from "@/components/groups/GroupList";
import GroupListSkeleton from "@/components/groups/GroupListSkeleton";
import LoadMoreButton from "@/components/groups/LoadMoreButton";

import type {
  GroupsResponse,
  GroupsErrorResponse,
  Group,
} from "@/types/group";

async function fetchGroups(cursor?: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    limit: "20",
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  const response = await fetch(`/api/groups?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
    signal,
  });

  const result = await response.json();

  if (!response.ok) {
    const errorResult = result as GroupsErrorResponse;

    throw new Error(
      errorResult.error || "Não foi possível carregar os grupos.",
    );
  }

  return result as GroupsResponse;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialGroups() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchGroups(undefined, controller.signal);

        setGroups(result.data);
        setNextCursor(result.pagination.nextCursor);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os grupos.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadInitialGroups();

    return () => controller.abort();
  }, []);

  async function loadMoreGroups() {
    if (!nextCursor || loadingMore) {
      return;
    }

    try {
      setLoadingMore(true);
      setError(null);

      const result = await fetchGroups(nextCursor);

      setGroups((currentGroups) => [
        ...currentGroups,
        ...result.data,
      ]);

      setNextCursor(result.pagination.nextCursor);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar mais grupos.",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function retryInitialLoad() {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchGroups();

      setGroups(result.data);
      setNextCursor(result.pagination.nextCursor);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os grupos.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-canvas">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <header className="mb-8">
          <p className="mb-2 text-overline uppercase text-text-brand">
            Comunidade
          </p>

          <h1 className="text-h1 text-text-primary">
            Grupos de estudo
          </h1>

          <p className="mt-2 text-body-md text-text-secondary">
            Encontre grupos, compartilhe conhecimento e evolua junto.
          </p>
        </header>

        {loading && <GroupListSkeleton />}

        {!loading && error && groups.length === 0 && (
          <div className="rounded-2xl border border-border-danger bg-bg-danger-subtle p-6 text-center">
            <p className="text-body-md font-medium text-text-danger">
              {error}
            </p>

            <Button className="mt-4" onClick={retryInitialLoad}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <GroupEmptyState />
        )}

        {!loading && groups.length > 0 && (
          <>
            <div className="mb-5">
              <p className="text-body-sm text-text-secondary">
                {groups.length}{" "}
                {groups.length === 1
                  ? "grupo encontrado"
                  : "grupos encontrados"}
              </p>
            </div>

            <GroupList groups={groups} />

            {error && (
              <p
                role="alert"
                className="mt-5 text-center text-body-sm text-text-danger"
              >
                {error}
              </p>
            )}

            {nextCursor && (
              <LoadMoreButton
                loading={loadingMore}
                onClick={loadMoreGroups}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
