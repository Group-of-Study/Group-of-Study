"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";

export type SidebarGroup = {
  id: string;
  name: string;
};

type Props = {
  groups: SidebarGroup[];
  onNavigate?: () => void;
};

export function SidebarGroups({ groups, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Seus grupos
        </h2>

        <Link
          href="/grupos"
          onClick={onNavigate}
          aria-label="Ver grupos"
          className="rounded p-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <Plus size={16} />
        </Link>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-1">
          {groups.map((group) => {
            const href = `/grupos/${group.id}`;
            const active =
              pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={group.id}
                href={href}
                onClick={onNavigate}
                title={group.name}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <BookOpen size={18} className="shrink-0" />
                <span className="truncate">{group.name}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="px-3 py-2 text-sm text-zinc-600">
          Você ainda não participa de grupos.
        </p>
      )}
    </section>
  );
}