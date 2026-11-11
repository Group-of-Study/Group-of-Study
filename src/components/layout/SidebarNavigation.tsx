"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Target,
  Trophy,
  Swords,
} from "lucide-react";

const navigation = [
  {
    label: "Início",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Grupos",
    href: "/grupos",
    icon: Users,
  },
  {
    label: "Metas",
    href: "/metas",
    icon: Target,
  },
  {
    label: "Conquistas",
    href: "/conquistas",
    icon: Trophy,
  },
  {
    label: "Desafios",
    href: "/desafios",
    icon: Swords,
  },
];

type Props = {
  onNavigate?: () => void;
};

export function SidebarNavigation({ onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
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
                ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }`}
          >
            <Icon size={19} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}