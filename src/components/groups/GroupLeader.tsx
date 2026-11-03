
import { Crown } from "lucide-react";

import type { GroupPerson } from "@/types/group";

type Props = {
  leader: GroupPerson | null;
};

export default function GroupLeader({ leader }: Props) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="mb-4 flex items-center gap-2 text-amber-800">
        <Crown size={20} />

        <h2 className="font-semibold">
          Líder do grupo
        </h2>
      </div>

      {leader ? (
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-200 text-lg font-bold text-amber-900">
            {leader.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <p className="font-semibold text-zinc-900">
              {leader.name}
            </p>

            <p className="text-sm text-amber-800">
              Responsável pelo grupo
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-amber-800">
          Este grupo está sem um líder definido.
        </p>
      )}
    </section>
  );
}
