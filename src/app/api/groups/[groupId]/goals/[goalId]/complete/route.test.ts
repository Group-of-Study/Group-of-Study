import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionMock,
  groupFindUniqueMock,
  groupMemberFindUniqueMock,
  goalFindFirstMock,
  goalUpdateManyMock,
  goalFindUniqueMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  groupFindUniqueMock: vi.fn(),
  groupMemberFindUniqueMock: vi.fn(),
  goalFindFirstMock: vi.fn(),
  goalUpdateManyMock: vi.fn(),
  goalFindUniqueMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  unauthorized: () =>
    Response.json(
      { error: "Autenticação necessária." },
      { status: 401 },
    ),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    group: {
      findUnique: groupFindUniqueMock,
    },
    groupMember: {
      findUnique: groupMemberFindUniqueMock,
    },
    goal: {
      findFirst: goalFindFirstMock,
      updateMany: goalUpdateManyMock,
      findUnique: goalFindUniqueMock,
    },
  },
}));

import { PATCH } from "./route";

const user = {
  id: "member-1",
};

function createContext() {
  return {
    params: Promise.resolve({
      groupId: "group-1",
      goalId: "goal-1",
    }),
  };
}

function createRequest() {
  return new Request(
    "http://localhost/api/groups/group-1/goals/goal-1/complete",
    {
      method: "PATCH",
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  getSessionMock.mockResolvedValue({ user });

  groupFindUniqueMock.mockResolvedValue({
    id: "group-1",
    status: "ACTIVE",
  });

  groupMemberFindUniqueMock.mockResolvedValue({
    id: "membership-1",
  });

  goalFindFirstMock.mockResolvedValue({
    id: "goal-1",
    status: "PENDING",
  });

  goalUpdateManyMock.mockResolvedValue({
    count: 1,
  });

  goalFindUniqueMock.mockResolvedValue({
    id: "goal-1",
    title: "Estudar Direito",
    status: "COMPLETED",
  });
});

describe("PATCH /api/groups/[groupId]/goals/[goalId]/complete", () => {
  it("permite que um participante conclua uma meta", async () => {
    const response = await PATCH(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(200);

    expect(goalUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: "goal-1",
        groupId: "group-1",
        status: "PENDING",
      },
      data: {
        status: "COMPLETED",
      },
    });

    expect(goalFindUniqueMock).toHaveBeenCalled();
  });

  it("retorna 409 ao tentar concluir meta de grupo arquivado", async () => {
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
      status: "ARCHIVED",
    });

    const response = await PATCH(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(groupMemberFindUniqueMock).not.toHaveBeenCalled();
    expect(goalUpdateManyMock).not.toHaveBeenCalled();
  });

  it("retorna 409 ao tentar concluir meta de grupo encerrado", async () => {
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
      status: "CLOSED",
    });

    const response = await PATCH(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(goalUpdateManyMock).not.toHaveBeenCalled();
  });

  it("retorna 403 quando o usuário não participa do grupo", async () => {
    groupMemberFindUniqueMock.mockResolvedValue(null);

    const response = await PATCH(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(403);
    expect(goalUpdateManyMock).not.toHaveBeenCalled();
  });

  it("retorna 409 quando a meta já foi concluída", async () => {
    goalFindFirstMock.mockResolvedValue({
      id: "goal-1",
      status: "COMPLETED",
    });

    const response = await PATCH(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(goalUpdateManyMock).not.toHaveBeenCalled();
  });
});