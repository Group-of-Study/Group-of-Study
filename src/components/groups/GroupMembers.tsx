
import { Crown, Users } from "lucide-react";

import type { GroupMemberDetails } from "@/types/group";

type Props = {
  members: GroupMemberDetails[];
  leaderId: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(value),
  );
}

export default function GroupMembers({
  members,
  leaderId,
}: Props) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-zinc-500" />

          <h2 className="text-lg font-semibold text-zinc-900">
            Membros
          </h2>
        </div>

        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600">
          {members.length}
        </span>
      </div>

      {members.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">
          Nenhum membro encontrado.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100">
          {members.map((member) => {
            const isLeader = member.user.id === leaderId;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-800">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {member.user.name}
                    </p>

                    <p className="text-xs text-zinc-500">
                      Participa desde {formatDate(member.joinedAt)}
                    </p>
                  </div>
                </div>

                {isLeader && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    <Crown size={13} />
                    Líder
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
