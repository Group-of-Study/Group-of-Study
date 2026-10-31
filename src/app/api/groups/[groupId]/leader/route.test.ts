
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
      updateMany: vi.fn(),
    },
    groupMember: {
      findUnique: vi.fn(),
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

import { POST } from "./route";

const leader = { id: "leader-1" };
const newLeader = { id: "member-1" };

function createRequest(body: unknown) {
  return new Request("http://localhost", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createContext(groupId = "group-1") {
  return {
    params: Promise.resolve({ groupId }),
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

  txMocks.group.updateMany.mockResolvedValue({ count: 1 });

  transactionMock.mockImplementation(
    async (callback: (tx: typeof txMocks) => Promise<unknown>) =>
      callback(txMocks),
  );
});

describe("POST /api/groups/[groupId]/leader", () => {
  it("transfere a liderança para um participante", async () => {
    const response = await POST(
      createRequest({ userId: newLeader.id }),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toMatchObject({
      message: "Liderança transferida com sucesso.",
      data: {
        groupId: "group-1",
        previousLeaderId: leader.id,
        newLeaderId: newLeader.id,
      },
    });

    expect(txMocks.group.updateMany).toHaveBeenCalledWith({
      where: {
        id: "group-1",
        leaderId: leader.id,
      },
      data: {
        leaderId: newLeader.id,
      },
    });
  });

  it("retorna 401 quando não existe sessão", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await POST(
      createRequest({ userId: newLeader.id }),
      createContext(),
    );

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("retorna 403 quando quem solicita não é o líder", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "member-2" },
    });

    const response = await POST(
      createRequest({ userId: newLeader.id }),
      createContext(),
    );

    expect(response.status).toBe(403);
    expect(txMocks.group.updateMany).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o grupo não existe", async () => {
    txMocks.group.findUnique.mockResolvedValue(null);

    const response = await POST(
      createRequest({ userId: newLeader.id }),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(txMocks.group.updateMany).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o novo líder não participa do grupo", async () => {
    txMocks.groupMember.findUnique.mockResolvedValue(null);

    const response = await POST(
      createRequest({ userId: newLeader.id }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(txMocks.group.updateMany).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o líder tenta transferir para si mesmo", async () => {
    const response = await POST(
      createRequest({ userId: leader.id }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(txMocks.groupMember.findUnique).not.toHaveBeenCalled();
    expect(txMocks.group.updateMany).not.toHaveBeenCalled();
  });

  it("retorna 400 quando os dados são inválidos", async () => {
    const response = await POST(
      createRequest({ userId: "" }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(txMocks.group.updateMany).not.toHaveBeenCalled();
  });

  it("utiliza transação com isolamento Serializable", async () => {
    await POST(
      createRequest({ userId: newLeader.id }),
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
