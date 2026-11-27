"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LogOut } from "lucide-react";

import { signOutAction } from "@/backend/features/auth/actions";

type Props = {
  onNavigate?: () => void;
};

export function ProfileMenu({ onNavigate }: Props) {
  const pathname = usePathname();

  const active = pathname === "/configuracoes" ||
    pathname.startsWith("/configuracoes/");

  return (
    <div className="space-y-1 border-t border-border-default pt-4">
      <Link
        href="/configuracoes"
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          active
            ? "bg-bg-brand-subtle text-text-brand"
            : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
        }`}
      >
        <Settings size={19} />
        Configurações
      </Link>

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-danger transition-colors hover:bg-bg-danger-subtle"
        >
          <LogOut size={19} />
          Sair
        </button>
      </form>
    </div>
  );
}