
import Link from "next/link";
import { CalendarDays, Mail, Pencil } from "lucide-react";

import ProfileAvatar from "./ProfileAvatar";

type ProfileInfoProps = {
  name: string;
  email: string;
  image: string | null;
  createdAt: Date;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function ProfileInfo({
  name,
  email,
  image,
  createdAt,
}: ProfileInfoProps) {
  return (
    <section className="rounded-2xl border border-border-default bg-bg-surface p-6 shadow-xs sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ProfileAvatar name={name} image={image} />

        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-text-primary">
            {name}
          </h2>

          <p className="mt-2 flex items-center gap-2 break-all text-body-md text-text-secondary">
            <Mail size={16} className="shrink-0" />
            {email}
          </p>

          <p className="mt-3 flex items-center gap-2 text-body-sm text-text-secondary">
            <CalendarDays size={16} />
            Membro desde {formatDate(createdAt)}
          </p>
        </div>

        <Link
          href="/configuracoes"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border-default px-5 py-3 text-body-sm font-semibold text-text-primary transition hover:bg-bg-subtle"
        >
          <Pencil size={16} />
          Editar perfil
        </Link>
      </div>
    </section>
  );
}
