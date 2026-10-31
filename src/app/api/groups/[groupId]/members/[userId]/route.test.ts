
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionMock,
  transactionMock,
  txMocks,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  transactionMock: vi.fn(),
  txMocks: {
    group: {
      findUnique: vi.fn(),
    },
    groupMember: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
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
    $transaction: transactionMock,
  },
}));

import { DELETE } from "./route";

const leader = {
  id: "leader-1",
  name: "Líder",
};

function createContext(
  groupId = "group-1",
  userId = "member-1",
) {
  return {
    params: Promise.resolve({
      groupId,
      userId,
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  getSessionMock.mockResolvedValue({ user: leader });

  txMocks.group.findUnique.mockResolvedValue({
    id: "group-1",
    leaderId: leader.id,
  });

  txMocks.groupMember.findUnique.mockResolvedValue({
    id: "membership-1",
  });

  txMocks.groupMember.delete.mockResolvedValue({
    id: "membership-1",
  });

  txMocks.groupMember.count.mockResolvedValue(2);

  transactionMock.mockImplementation(
    async (
      callback: (tx: typeof txMocks) => Promise<unknown>,
    ) => callback(txMocks),
  );
});

describe("DELETE /api/groups/[groupId]/members/[userId]", () => {
  it("remove um participante quando solicitado pelo líder", async () => {
    const response = await DELETE(
      new Request("http://localhost"),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toMatchObject({
      message: "Participante removido do grupo com sucesso.",
      data: {
        groupId: "group-1",
        removedUserId: "member-1",
        remainingMembers: 2,
      },
    });

    expect(txMocks.groupMember.delete).toHaveBeenCalledWith({
      where: {
        userId_groupId: {
          userId: "member-1",
          groupId: "group-1",
        },
      },
    });
  });

  it("retorna 401 quando não existe sessão", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost"),
      createContext(),
    );

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("retorna 403 quando quem solicita não é o líder", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "member-2" },
    });

    const response = await DELETE(
      new Request("http://localhost"),
      createContext(),
    );

    expect(response.status).toBe(403);
    expect(txMocks.groupMember.delete).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o grupo não existe", async () => {
    txMocks.group.findUnique.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost"),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(txMocks.groupMember.delete).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o líder tenta remover a si mesmo", async () => {
    const response = await DELETE(
      new Request("http://localhost"),
      createContext("group-1", leader.id),
    );

    expect(response.status).toBe(409);
    expect(txMocks.groupMember.delete).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o usuário não participa do grupo", async () => {
    txMocks.groupMember.findUnique.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost"),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(txMocks.groupMember.delete).not.toHaveBeenCalled();
  });

  it("utiliza transação com isolamento Serializable", async () => {
    await DELETE(
      new Request("http://localhost"),
      createContext(),
    );

    expect(transactionMock).toHaveBeenCalledWith(
      expect.any(Function),
      {
        isolationLevel: "Serializable",
      },
    );
  });
});
