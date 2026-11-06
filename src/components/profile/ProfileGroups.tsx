
import { Users } from "lucide-react";

import ProfileEmptyState from "./ProfileEmptyState";
import ProfileGroupCard, {
  type ProfileGroup,
} from "./ProfileGroupCard";

type ProfileGroupsProps = {
  groups: ProfileGroup[];
  currentUserId: string;
};

export default function ProfileGroups({
  groups,
  currentUserId,
}: ProfileGroupsProps) {
  return (
    <section className="mt-10">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-xl font-bold text-text-primary">
          <Users size={21} />
          Meus grupos
        </h2>

        <p className="mt-1 text-body-sm text-text-secondary">
          Grupos ativos dos quais você participa.
        </p>
      </div>

      {groups.length === 0 ? (
        <ProfileEmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <ProfileGroupCard
              key={group.id}
              group={group}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
