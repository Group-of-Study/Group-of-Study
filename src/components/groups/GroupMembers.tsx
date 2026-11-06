
"use client";

import { useState } from "react";
import { Crown, UserMinus, Users } from "lucide-react";

import type { GroupMemberDetails } from "@/types/group";

import Button from "@/components/ui/button";
import GroupConfirmationDialog from "./GroupConfirmationDialog";

type Props = {
  groupId: string;
  members: GroupMemberDetails[];
  leaderId: string | null;
  currentUserId: string;
  isLeader: boolean;
  onMemberRemoved: () => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(value),
  );
}

export default function GroupMembers({
  groupId,
  members,
  leaderId,
  currentUserId,
  isLeader,
  onMemberRemoved,
}: Props) {
  const [selectedMember, setSelectedMember] =
    useState<GroupMemberDetails | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemoveMember() {
    if (!selectedMember) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(selectedMember.user.id)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error || "Não foi possível remover o participante.",
        );
      }

      setSelectedMember(null);
      onMemberRemoved();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível remover o participante.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
              const isMemberLeader = member.user.id === leaderId;
              const isCurrentUser = member.user.id === currentUserId;

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

                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-zinc-400">
                            Você
                          </span>
                        )}
                      </p>

                      <p className="text-xs text-zinc-500">
                        Participa desde {formatDate(member.joinedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isMemberLeader && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                        <Crown size={13} />
                        Líder
                      </span>
                    )}

                    {isLeader && !isCurrentUser && (
                      <Button
                        variant="danger"
                        size="sm"
                        title={`Remover ${member.user.name}`}
                        aria-label={`Remover ${member.user.name} do grupo`}
                        leadingIcon={<UserMinus size={15} />}
                        onClick={() => {
                          setError(null);
                          setSelectedMember(member);
                        }}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 text-sm text-red-600"
          >
            {error}
          </p>
        )}
      </section>

      <GroupConfirmationDialog
        open={selectedMember !== null}
        title="Remover participante"
        message={
          selectedMember
            ? `Tem certeza de que deseja remover ${selectedMember.user.name} deste grupo? A pessoa deixará de ter acesso aos conteúdos e atividades disponíveis para os participantes.`
            : ""
        }
        confirmLabel="Remover participante"
        danger
        loading={loading}
        onCancel={() => setSelectedMember(null)}
        onConfirm={handleRemoveMember}
      />
    </>
  );
}
