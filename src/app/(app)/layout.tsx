
import { Suspense, type ReactNode } from "react";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";



type Props = {
  children: ReactNode;
};

function AppLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 animate-pulse border-r border-zinc-200 bg-white p-6 lg:block">
        <div className="mb-10 h-10 w-40 rounded-lg bg-zinc-200" />

        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-10 rounded-lg bg-zinc-100"
            />
          ))}
        </div>
      </aside>

      <main className="min-h-screen animate-pulse p-6 pt-20 lg:ml-64 lg:pt-6">
        <div className="h-8 w-52 rounded-lg bg-zinc-200" />
        <div className="mt-4 h-5 w-80 rounded-lg bg-zinc-100" />
      </main>
    </div>
  );
}

async function AuthenticatedAppLayout({ children }: Props) {
  const session = await requireSession();

  const memberships = await prisma.groupMember.findMany({
    where: {
      userId: session.user.id,
      group: {
        status: "ACTIVE",
      },
    },
    select: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
    take: 10,
  });

  const groups = memberships.map((membership) => ({
    id: membership.group.id,
    name: membership.group.name,
  }));

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">
        <Sidebar groups={groups} />
      </div>

      <MobileSidebar groups={groups} />

      <main className="min-h-screen pt-16 lg:ml-64 lg:pt-0">
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({ children }: Props) {
  return (
    <Suspense fallback={<AppLayoutSkeleton />}>
      <AuthenticatedAppLayout>
        {children}
      </AuthenticatedAppLayout>
    </Suspense>
  );
}
