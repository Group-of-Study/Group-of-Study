
type GroupListSkeletonProps = {
  count?: number;
};

export default function GroupListSkeleton({
  count = 6,
}: GroupListSkeletonProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      aria-label="Carregando grupos"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-border-default bg-bg-surface p-5"
        >
          <div className="flex justify-between gap-3">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-3/4 rounded bg-bg-muted" />
              <div className="h-4 w-full rounded bg-bg-muted" />
              <div className="h-4 w-2/3 rounded bg-bg-muted" />
            </div>

            <div className="h-6 w-14 rounded-full bg-bg-muted" />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-4">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-full bg-bg-muted" />
              <div className="space-y-2">
                <div className="h-3 w-12 rounded bg-bg-muted" />
                <div className="h-3 w-20 rounded bg-bg-muted" />
              </div>
            </div>

            <div className="h-4 w-20 rounded bg-bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
