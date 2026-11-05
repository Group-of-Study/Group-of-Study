"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { SidebarGroup } from "./SidebarGroups";

type Props = {
  groups: SidebarGroup[];
};

export function MobileSidebar({ groups }: Props) {
  const [open, setOpen] = useState(false);

  function closeSidebar() {
    setOpen(false);
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b border-zinc-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100"
        >
          <Menu size={23} />
        </button>

        <span className="ml-3 font-bold text-zinc-900">
          Group of Study
        </span>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={closeSidebar}
            className="absolute inset-0 bg-black/40"
          />

          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Fechar menu"
              className="absolute right-3 top-5 z-10 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            >
              <X size={21} />
            </button>

            <Sidebar
              groups={groups}
              onNavigate={closeSidebar}
            />
          </div>
        </div>
      )}
    </>
  );
}