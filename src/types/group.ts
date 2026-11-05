
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
