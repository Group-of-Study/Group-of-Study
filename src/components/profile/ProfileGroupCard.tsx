
import Link from "next/link";
import { ArrowRight, Crown, Users } from "lucide-react";

export type ProfileGroup = {
  id: string;
  name: string;
  description: string | null;
  leader: {
    id: string;
    name: string;
  } | null;
  membersCount: number;
};

type ProfileGroupCardProps = {
  group: ProfileGroup;
  currentUserId: string;
};

export default function ProfileGroupCard({
  group,
  currentUserId,
}: ProfileGroupCardProps) {
  const isLeader = group.leader?.id === currentUserId;

  return (
    <Link
      href={`/grupos/${group.id}`}
      className="group rounded-2xl border border-border-default bg-bg-surface p-5 shadow-xs transition hover:border-border-brand hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-text-primary transition group-hover:text-text-brand">
            {group.name}
          </h3>

          {group.description && (
            <p className="mt-2 line-clamp-2 text-body-sm text-text-secondary">
              {group.description}
            </p>
          )}
        </div>

        <ArrowRight
          size={18}
          className="shrink-0 text-text-tertiary transition group-hover:text-text-brand"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <Users size={15} />
         {group.membersCount} {group.membersCount === 1 ? "membro" : "membros"}
        </span>

        {group.leader && (
          <span className="inline-flex items-center gap-1.5">
            <Crown size={15} />
            {group.leader.name}
          </span>
        )}
      </div>

      {isLeader && (
        <span className="mt-4 inline-flex rounded-full bg-bg-brand-subtle px-3 py-1 text-xs font-semibold text-text-brand">
          Você é líder
        </span>
      )}
    </Link>
  );
}
