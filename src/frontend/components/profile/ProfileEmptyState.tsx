
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";

export default function ProfileEmptyState() {
  return (
    <div className="rounded-2xl border border-border-default bg-bg-surface px-6 py-12 text-center">
      <Users
        size={32}
        className="mx-auto text-text-tertiary"
      />

      <h3 className="mt-4 font-semibold text-text-primary">
        Você ainda não participa de grupos
      </h3>

      <p className="mt-2 text-body-sm text-text-secondary">
        Quando você entrar em um grupo, ele aparecerá aqui.
      </p>

      <Link
        href="/grupos"
        className="mt-5 inline-flex items-center gap-2 text-body-sm font-semibold text-text-brand hover:underline"
      >
        Explorar grupos
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
