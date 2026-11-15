
import { Crown, Users } from "lucide-react";

type ProfileStatsProps = {
  groupsCount: number;
  ledGroupsCount: number;
};

export default function ProfileStats({
  groupsCount,
  ledGroupsCount,
}: ProfileStatsProps) {
  const stats = [
    {
      label: "Grupos ativos",
      value: groupsCount,
      icon: Users,
    },
    {
      label: "Grupos liderados",
      value: ledGroupsCount,
      icon: Crown,
    },
  ];

  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            key={stat.label}
            className="rounded-2xl border border-border-default bg-bg-surface p-6 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-bg-brand-subtle text-text-brand">
                <Icon size={22} />
              </div>

              <div>
                <p className="text-body-sm text-text-secondary">
                  {stat.label}
                </p>

                <p className="text-2xl font-bold text-text-primary">
                  {stat.value}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
