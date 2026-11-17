
import { Suspense } from "react";

import GroupDetailsPage from "@/components/groups/GroupDetailsPage";

type Props = {
  params: Promise<{
    groupId: string;
  }>;
};

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-5 py-10 sm:px-8 lg:px-10">
      <div className="mb-8 h-5 w-32 rounded bg-bg-muted" />
      <div className="mb-3 h-9 w-64 rounded bg-bg-muted" />
      <div className="mb-8 h-5 w-96 max-w-full rounded bg-bg-subtle" />

      <div className="mb-6 h-24 rounded-2xl bg-bg-muted" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="h-52 rounded-2xl bg-bg-muted" />
        <div className="h-52 rounded-2xl bg-bg-muted" />
      </div>
    </div>
  );
}

async function GroupDetailsRouteContent({ params }: Props) {
  const { groupId } = await params;

  return <GroupDetailsPage groupId={groupId} />;
}

export default function GroupDetailsRoute({ params }: Props) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <GroupDetailsRouteContent params={params} />
    </Suspense>
  );
}
