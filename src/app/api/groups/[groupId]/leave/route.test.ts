
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
      update: vi.fn(),
    },
    groupMember: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
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
    name: "Grupo de Java",
    status: "ACTIVE",
    leaderId: leader.id,
  });

  txMocks.groupMember.findUnique.mockResolvedValue({
    id: "membership-1",
  });

  txMocks.groupMember.delete.mockResolvedValue({
    id: "membership-1",
  });

  txMocks.groupMember.findMany.mockResolvedValue([
    { userId: "member-oldest" },
    { userId: "member-newest" },
  ]);

  transactionMock.mockImplementation(
    async (callback: (tx: typeof txMocks) => Promise<unknown>) =>
      callback(txMocks),
  );
});

describe("POST /api/groups/[groupId]/leave", () => {
  it("transfere a liderança para o participante mais antigo", async () => {
    const response = await POST(
      new Request("http://localhost"),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.data.leaderId).toBe("member-oldest");

    expect(txMocks.groupMember.findMany).toHaveBeenCalledWith({
      where: { groupId: "group-1" },
      select: { userId: true },
      orderBy: [
        { joinedAt: "asc" },
        { userId: "asc" },
      ],
    });

    expect(txMocks.group.update).toHaveBeenCalledWith({
      where: { id: "group-1" },
      data: { leaderId: "member-oldest" },
    });
  });

  it("mantém a liderança quando um participante comum sai", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "member-2" },
    });

    txMocks.groupMember.findMany.mockResolvedValue([
      { userId: leader.id },
      { userId: "member-3" },
    ]);

    const response = await POST(
      new Request("http://localhost"),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.leaderId).toBe(leader.id);
    expect(txMocks.group.update).not.toHaveBeenCalled();
  });

  it("encerra o grupo quando o último participante sai", async () => {
    txMocks.groupMember.findMany.mockResolvedValue([]);

    const response = await POST(
      new Request("http://localhost"),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("CLOSED");
    expect(body.data.leaderId).toBeNull();

    expect(txMocks.group.update).toHaveBeenCalledWith({
      where: { id: "group-1" },
      data: {
        status: "CLOSED",
        leaderId: null,
      },
    });
  });

  it("retorna 401 quando não existe sessão", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost"),
      createContext(),
    );

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o grupo não existe", async () => {
    txMocks.group.findUnique.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost"),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(txMocks.groupMember.delete).not.toHaveBeenCalled();
  });
});
