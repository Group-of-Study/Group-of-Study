
import { Archive, CircleStop } from "lucide-react";

import type { GroupStatus } from "@/types/group";

type Props = {
  status: GroupStatus;
};

export default function GroupStatusAlert({ status }: Props) {
  if (status === "ACTIVE") {
    return null;
  }

  if (status === "ARCHIVED") {
    return (
      <div
        role="alert"
        className="flex gap-3 rounded-xl border border-border-default bg-bg-subtle p-4 text-text-primary"
      >
        <Archive className="mt-0.5 shrink-0" size={20} />

        <div>
          <p className="font-semibold">Grupo arquivado</p>

          <p className="mt-1 text-sm">
            Este grupo está arquivado. Algumas atividades e
            interações podem estar indisponíveis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex gap-3 rounded-xl border border-border-danger bg-bg-danger-subtle p-4 text-text-danger"
    >
      <CircleStop className="mt-0.5 shrink-0" size={20} />

      <div>
        <p className="font-semibold">Grupo encerrado</p>

        <p className="mt-1 text-sm">
          Este grupo foi encerrado e não está mais ativo.
        </p>
      </div>
    </div>
  );
}
