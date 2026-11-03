"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, UserRound, LogOut } from "lucide-react";
import { signOutAction } from "@/features/auth/actions";

type Props = {
  onNavigate?: () => void;
};

export function ProfileMenu({ onNavigate }: Props) {
  const pathname = usePathname();

  const links = [
    {
      label: "Perfil",
      href: "/perfil",
      icon: UserRound,
    },
    {
      label: "Configurações",
      href: "/configuracoes",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-1 border-t border-zinc-200 pt-4">
      {links.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-50 text-blue-700"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <Icon size={19} />
            {item.label}
          </Link>
        );
      })}

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={19} />
          Sair
        </button>
      </form>
    </div>
  );
}