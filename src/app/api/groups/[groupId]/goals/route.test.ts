import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionMock,
  groupFindUniqueMock,
  groupMemberFindUniqueMock,
  goalFindManyMock,
  goalCreateMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  groupFindUniqueMock: vi.fn(),
  groupMemberFindUniqueMock: vi.fn(),
  goalFindManyMock: vi.fn(),
  goalCreateMock: vi.fn(),
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
      findMany: goalFindManyMock,
      create: goalCreateMock,
    },
  },
}));

import { GET, POST } from "./route";

const user = {
  id: "user-1",
  name: "Talys",
};

function createContext() {
  return {
    params: Promise.resolve({
      groupId: "group-1",
    }),
  };
}

function createPostRequest(body: unknown) {
  return new Request("http://localhost/api/groups/group-1/goals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
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

  goalFindManyMock.mockResolvedValue([]);

  goalCreateMock.mockResolvedValue({
    id: "goal-1",
    title: "Estudar Direito Tributário",
    description: null,
    dueDate: null,
    status: "PENDING",
  });
});

describe("/api/groups/[groupId]/goals", () => {
  it("permite consultar metas de um grupo arquivado", async () => {
    const response = await GET(
      new Request("http://localhost"),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(goalFindManyMock).toHaveBeenCalled();
  });

  it("retorna 409 ao tentar criar meta em grupo arquivado", async () => {
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
      status: "ARCHIVED",
    });

    const response = await POST(
      createPostRequest({
        title: "Estudar Direito Tributário",
      }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(groupMemberFindUniqueMock).not.toHaveBeenCalled();
    expect(goalCreateMock).not.toHaveBeenCalled();
  });

  it("retorna 409 ao tentar criar meta em grupo encerrado", async () => {
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
      status: "CLOSED",
    });

    const response = await POST(
      createPostRequest({
        title: "Estudar Direito Tributário",
      }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(goalCreateMock).not.toHaveBeenCalled();
  });

  it("cria meta e converte descrição vazia e dueDate vazio para null", async () => {
    const response = await POST(
      createPostRequest({
        title: "Estudar Direito Tributário",
        description: "   ",
        dueDate: "",
      }),
      createContext(),
    );

    expect(response.status).toBe(201);

    expect(goalCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: "Estudar Direito Tributário",
          description: null,
          dueDate: null,
          status: "PENDING",
          groupId: "group-1",
          authorId: user.id,
        },
      }),
    );
  });

  it("retorna 403 quando o usuário não participa do grupo", async () => {
    groupMemberFindUniqueMock.mockResolvedValue(null);

    const response = await POST(
      createPostRequest({
        title: "Estudar Direito Tributário",
      }),
      createContext(),
    );

    expect(response.status).toBe(403);
    expect(goalCreateMock).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o grupo não existe", async () => {
    groupFindUniqueMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost"),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(goalFindManyMock).not.toHaveBeenCalled();
  });
});