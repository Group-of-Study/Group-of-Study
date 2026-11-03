
import GroupCard from "./GroupCard";
import type { Group } from "@/types/group";

type GroupListProps = {
  groups: Group[];
};

export default function GroupList({ groups }: GroupListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
