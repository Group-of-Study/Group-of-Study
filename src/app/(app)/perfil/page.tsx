
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileGroups from "@/components/profile/ProfileGroups";

async function ProfileContent() {
  const session = await requireSession();

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,

      memberships: {
        where: {
          group: {
            status: "ACTIVE",
          },
        },
        orderBy: {
          joinedAt: "desc",
        },
        select: {
          group: {
            select: {
              id: true,
              name: true,
              description: true,
              leader: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-10">
        <h1 className="text-h1 text-text-primary">
          Perfil não encontrado
        </h1>

        <p className="mt-2 text-body-md text-text-secondary">
          Não foi possível localizar os dados desta conta.
        </p>
      </div>
    );
  }

  const groups = user.memberships.map(({ group }) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    leader: group.leader,
    membersCount: group._count.members,
  }));

  const ledGroupsCount = groups.filter(
    (group) => group.leader?.id === user.id,
  ).length;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <ProfileHeader />

        <ProfileInfo
          name={user.name}
          email={user.email}
          image={user.image}
          createdAt={user.createdAt}
        />

        <ProfileStats
          groupsCount={groups.length}
          ledGroupsCount={ledGroupsCount}
        />

        <ProfileGroups
          groups={groups}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-canvas p-10">
          Carregando perfil...
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
