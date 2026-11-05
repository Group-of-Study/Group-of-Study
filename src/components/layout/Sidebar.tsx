"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import {
  SidebarNavigation,
} from "./SidebarNavigation";
import {
  SidebarGroups,
  type SidebarGroup,
} from "./SidebarGroups";
import { ProfileMenu } from "./ProfileMenu";

type Props = {
  groups: SidebarGroup[];
  onNavigate?: () => void;
};

export function Sidebar({ groups, onNavigate }: Props) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-20 items-center border-b border-zinc-200 px-6">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-900 text-white">
            <GraduationCap size={23} />
          </div>

          <span className="text-lg font-bold tracking-tight text-zinc-900">
            Group of Study
          </span>
        </Link>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
        <section className="space-y-3">
          <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Menu principal
          </h2>

          <SidebarNavigation onNavigate={onNavigate} />
        </section>

        <SidebarGroups
          groups={groups}
          onNavigate={onNavigate}
        />
      </div>

      <div className="p-4">
        <ProfileMenu onNavigate={onNavigate} />
      </div>
    </aside>
  );
}