import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionMock,
  groupFindUniqueMock,
  groupMemberFindUniqueMock,
  goalFindFirstMock,
  goalUpdateMock,
  goalDeleteMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  groupFindUniqueMock: vi.fn(),
  groupMemberFindUniqueMock: vi.fn(),
  goalFindFirstMock: vi.fn(),
  goalUpdateMock: vi.fn(),
  goalDeleteMock: vi.fn(),
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
      update: goalUpdateMock,
      delete: goalDeleteMock,
    },
  },
}));

import { DELETE, PATCH } from "./route";

const author = {
  id: "author-1",
  name: "Autor",
};

const leader = {
  id: "leader-1",
  name: "Líder",
};

function createContext() {
  return {
    params: Promise.resolve({
      groupId: "group-1",
      goalId: "goal-1",
    }),
  };
}

function createPatchRequest(body: unknown) {
  return new Request("http://localhost/api/groups/group-1/goals/goal-1", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createDeleteRequest() {
  return new Request("http://localhost/api/groups/group-1/goals/goal-1", {
    method: "DELETE",
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  getSessionMock.mockResolvedValue({ user: author });

  groupFindUniqueMock.mockResolvedValue({
    id: "group-1",
    leaderId: leader.id,
    status: "ACTIVE",
  });

  groupMemberFindUniqueMock.mockResolvedValue({
    id: "membership-1",
  });

  goalFindFirstMock.mockResolvedValue({
    id: "goal-1",
    authorId: author.id,
  });

  goalUpdateMock.mockResolvedValue({
    id: "goal-1",
    title: "Estudar Direito",
    description: null,
    dueDate: null,
    status: "PENDING",
  });

  goalDeleteMock.mockResolvedValue({
    id: "goal-1",
  });
});

describe("PATCH /api/groups/[groupId]/goals/[goalId]", () => {
  it("permite que o autor edite sua meta", async () => {
    const response = await PATCH(
      createPatchRequest({
        title: "Nova meta",
      }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(goalUpdateMock).toHaveBeenCalled();
  });

  it("permite que o líder edite uma meta de outro participante", async () => {
    getSessionMock.mockResolvedValue({ user: leader });

    const response = await PATCH(
      createPatchRequest({
        title: "Meta atualizada pelo líder",
      }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(goalUpdateMock).toHaveBeenCalled();
  });

  it("converte descrição vazia e dueDate vazio para null", async () => {
    const response = await PATCH(
      createPatchRequest({
        description: "   ",
        dueDate: "",
      }),
      createContext(),
    );

    expect(response.status).toBe(200);

    expect(goalUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          description: null,
          dueDate: null,
        },
      }),
    );
  });

  it("retorna 403 quando quem edita não é autor nem líder", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "member-2" },
    });

    const response = await PATCH(
      createPatchRequest({
        title: "Tentativa de alteração",
      }),
      createContext(),
    );

    expect(response.status).toBe(403);
    expect(goalUpdateMock).not.toHaveBeenCalled();
  });

  it("retorna 409 ao editar meta de grupo arquivado", async () => {
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
      leaderId: leader.id,
      status: "ARCHIVED",
    });

    const response = await PATCH(
      createPatchRequest({
        title: "Tentativa de alteração",
      }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(groupMemberFindUniqueMock).not.toHaveBeenCalled();
    expect(goalUpdateMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/groups/[groupId]/goals/[goalId]", () => {
  it("permite que o autor exclua sua meta", async () => {
    const response = await DELETE(
      createDeleteRequest(),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(goalDeleteMock).toHaveBeenCalledWith({
      where: {
        id: "goal-1",
      },
    });
  });

  it("permite que o líder exclua a meta de outro participante", async () => {
    getSessionMock.mockResolvedValue({ user: leader });

    const response = await DELETE(
      createDeleteRequest(),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(goalDeleteMock).toHaveBeenCalled();
  });

  it("retorna 403 quando quem exclui não é autor nem líder", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "member-2" },
    });

    const response = await DELETE(
      createDeleteRequest(),
      createContext(),
    );

    expect(response.status).toBe(403);
    expect(goalDeleteMock).not.toHaveBeenCalled();
  });

  it("retorna 409 ao excluir meta de grupo arquivado", async () => {
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
      leaderId: leader.id,
      status: "ARCHIVED",
    });

    const response = await DELETE(
      createDeleteRequest(),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(groupMemberFindUniqueMock).not.toHaveBeenCalled();
    expect(goalDeleteMock).not.toHaveBeenCalled();
  });
});