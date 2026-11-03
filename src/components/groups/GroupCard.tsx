
import Link from "next/link";

import Badge from "@/components/ui/badge";
import type { Group } from "@/types/group";

type GroupCardProps = {
  group: Group;
};

export default function GroupCard({ group }: GroupCardProps) {
  const memberCount = group._count.members;

  return (
    <Link
      href={`/grupos/${group.id}`}
      aria-label={`Ver detalhes do grupo ${group.name}`}
      className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-brand"
    >
      <article className="flex flex-col gap-4 rounded-2xl border border-border-default bg-bg-surface p-5 shadow-xs transition-all hover:border-border-brand hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-h3 text-text-primary">
              {group.name}
            </h2>

            <p className="mt-2 min-h-10 text-body-sm leading-relaxed text-text-secondary">
              {group.description || "Este grupo ainda não possui descrição."}
            </p>
          </div>

          <Badge variant="success">Ativo</Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-brand-subtle text-sm font-semibold text-text-brand">
              {group.leader?.name?.charAt(0).toUpperCase() || "?"}
            </div>

            <div className="min-w-0">
              <p className="text-caption text-text-tertiary">
                Líder
              </p>

              <p className="truncate text-body-sm font-medium text-text-primary">
                {group.leader?.name || "Sem líder"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-text-secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="size-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m16-10a4 4 0 0 1 4 4v2m-8-14a4 4 0 1 1 0 8m-6-8a4 4 0 1 1 0 8"
              />
            </svg>

            <span className="text-body-sm font-medium">
              {memberCount} {memberCount === 1 ? "membro" : "membros"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
