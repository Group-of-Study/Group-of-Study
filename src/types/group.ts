
export type Group = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  creator: {
    id: string;
    name: string;
  } | null;
  leader: {
    id: string;
    name: string;
  } | null;
  _count: {
    members: number;
  };
};

export type GroupsResponse = {
  data: Group[];
  pagination: {
    limit: number;
    nextCursor: string | null;
  };
};

export type GroupsErrorResponse = {
  error: string;
};

export type GroupStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "CLOSED";

export type GroupVisibility =
  | "PUBLIC"
  | "PRIVATE";

export type GroupPerson = {
  id: string;
  name: string;
};

export type GroupMemberDetails = {
  id: string;
  joinedAt: string;
  user: GroupPerson;
};

export type GroupDetails = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  status: GroupStatus;
  visibility: GroupVisibility;
  creator: GroupPerson | null;
  leader: GroupPerson | null;
  members: GroupMemberDetails[];
  _count: {
    members: number;
  };
};

export type GroupDetailsResponse = {
  data: GroupDetails;
};
