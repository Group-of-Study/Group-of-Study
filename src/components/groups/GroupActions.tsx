"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, LogIn, LogOut, UserRoundCog } from "lucide-react";

import Button from "@/components/ui/button";
import GroupConfirmationDialog from "./GroupConfirmationDialog";

import type { GroupDetails } from "@/types/group";

type Props = {
  group: GroupDetails;
  isMember: boolean;
  isLeader: boolean;
  onUpdated: () => void;
};

type PendingAction =
  | { type: "leave" }
  | { type: "transfer"; userId: string }
  | null;

export default function GroupActions({
  group,
  isMember,
  isLeader,
  onUpdated,
}: Props) {
  const router = useRouter();

  const [pendingAction, setPendingAction] =
    useState<PendingAction>(null);

  const [selectedLeader, setSelectedLeader] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canJoin =
    group.status === "ACTIVE" &&
    group.visibility === "PUBLIC" &&
    !isMember;

  const canLeave =
    isMember && group.status !== "CLOSED";

  const otherMembers = group.members.filter(
    (member) => member.user.id !== group.currentUserId,
  );

  async function handleJoin() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/groups/${encodeURIComponent(group.id)}/join`,
        {
          method: "POST",
          credentials: "same-origin",
        },
      );

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error || "Não foi possível entrar no grupo.",
        );
      }

      onUpdated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar no grupo.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/groups/${encodeURIComponent(group.id)}/leave`,
        {
          method: "POST",
          credentials: "same-origin",
        },
      );

      const result = (await response.json()) as {
        error?: string;
        message?: string;
        data?: {
          status?: string;
        };
      };

      if (!response.ok) {
        throw new Error(
          result.error || "Não foi possível sair do grupo.",
        );
      }

      setPendingAction(null);

      if (result.data?.status === "CLOSED") {
        router.push("/grupos");
        router.refresh();
        return;
      }

      router.push("/grupos");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível sair do grupo.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleTransferLeadership() {
    if (!pendingAction || pendingAction.type !== "transfer") {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/groups/${encodeURIComponent(group.id)}/leader`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: pendingAction.userId,
          }),
        },
      );

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error || "Não foi possível transferir a liderança.",
        );
      }

      setPendingAction(null);
      setSelectedLeader("");
      onUpdated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível transferir a liderança.",
      );
    } finally {
      setLoading(false);
    }
  }

  const dialogMessage =
    pendingAction?.type === "leave"
      ? isLeader
        ? group._count.members === 1
          ? "Você é o último participante. Ao sair, o grupo será encerrado permanentemente."
          : "Ao sair, o participante mais antigo que permanecer no grupo assumirá automaticamente a liderança."
        : "Você deixará de participar deste grupo. Poderá entrar novamente se ele for público e continuar ativo."
      : "A pessoa selecionada passará a ser o novo líder do grupo. Você deixará de ter as permissões de liderança.";

  return (
    <>
      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-zinc-900">
              Ações do grupo
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {isLeader
                ? "Você é o líder deste grupo."
                : isMember
                  ? "Você participa deste grupo."
                  : "Participe deste grupo para estudar com outros membros."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canJoin && (
              <Button
                onClick={handleJoin}
                disabled={loading}
                leadingIcon={<LogIn size={17} />}
              >
                {loading ? "Entrando..." : "Entrar no grupo"}
              </Button>
            )}

            {canLeave && (
              <Button
                variant="danger"
                onClick={() => {
                  setError(null);
                  setPendingAction({ type: "leave" });
                }}
                disabled={loading}
                leadingIcon={<LogOut size={17} />}
              >
                Sair do grupo
              </Button>
            )}
          </div>
        </div>

        {isLeader && group.status !== "CLOSED" && (
          <div className="mt-5 border-t border-zinc-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <Crown size={18} className="text-amber-600" />

              <h3 className="font-medium text-zinc-900">
                Transferir liderança
              </h3>
            </div>

            {otherMembers.length === 0 ? (
              <p className="text-sm text-zinc-500">
                É necessário ter outro participante para transferir a liderança.
              </p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedLeader}
                  onChange={(event) => setSelectedLeader(event.target.value)}
                  disabled={loading}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-blue-700"
                >
                  <option value="">Selecione o novo líder</option>

                  {otherMembers.map((member) => (
                    <option
                      key={member.user.id}
                      value={member.user.id}
                    >
                      {member.user.name}
                    </option>
                  ))}
                </select>

                <Button
                  variant="secondary"
                  disabled={!selectedLeader || loading}
                  leadingIcon={<UserRoundCog size={17} />}
                  onClick={() => {
                    setError(null);
                    setPendingAction({
                      type: "transfer",
                      userId: selectedLeader,
                    });
                  }}
                >
                  Transferir liderança
                </Button>
              </div>
            )}
          </div>
        )}

        {error && !pendingAction && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
      </section>

      <GroupConfirmationDialog
        open={pendingAction !== null}
        title={
          pendingAction?.type === "leave"
            ? "Confirmar saída do grupo"
            : "Confirmar transferência de liderança"
        }
        message={dialogMessage}
        confirmLabel={
          pendingAction?.type === "leave"
            ? "Sim, sair"
            : "Confirmar transferência"
        }
        loading={loading}
        danger={pendingAction?.type === "leave"}
        error={error}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction?.type === "leave") {
            void handleLeave();
          } else if (pendingAction?.type === "transfer") {
            void handleTransferLeadership();
          }
        }}
      />
    </>
  );
}