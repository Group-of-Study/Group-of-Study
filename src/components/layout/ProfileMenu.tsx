"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LogOut } from "lucide-react";

import { signOutAction } from "@/features/auth/actions";

type Props = {
  onNavigate?: () => void;
};

export function ProfileMenu({ onNavigate }: Props) {
  const pathname = usePathname();

  const active = pathname === "/configuracoes" ||
    pathname.startsWith("/configuracoes/");

  return (
    <div className="space-y-1 border-t border-zinc-200 pt-4">
      <Link
        href="/configuracoes"
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          active
            ? "bg-blue-50 text-blue-700"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }`}
      >
        <Settings size={19} />
        Configurações
      </Link>

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