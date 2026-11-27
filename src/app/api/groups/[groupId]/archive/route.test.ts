import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock, findUniqueMock, transactionMock, txMocks } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
  transactionMock: vi.fn(),
  txMocks: {
    group: { updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("@/backend/lib/session", () => ({
  getSession: getSessionMock,
  unauthorized: () =>
    Response.json({ error: "Autenticação necessária." }, { status: 401 }),
}));

vi.mock("@/backend/lib/prisma", () => ({
  prisma: {
    group: { findUnique: findUniqueMock },
    $transaction: transactionMock,
  },
}));

// O audit log (GOS-037) lê o IP com as opções do Better Auth.
vi.mock("@/backend/lib/auth", () => ({ auth: { options: {} } }));

import { POST } from "./route";

const leader = { id: "leader-1" };

function createRequest() {
  return new Request("http://localhost", {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.7" },
  });
}

function createContext(groupId = "group-1") {
  return { params: Promise.resolve({ groupId }) };
}

beforeEach(() => {
  vi.clearAllMocks();

  getSessionMock.mockResolvedValue({ user: leader });

  // clearAllMocks não esvazia a fila dos mockResolvedValueOnce de um teste anterior.
  findUniqueMock.mockReset();
  findUniqueMock
    // 1ª leitura: as checagens.
    .mockResolvedValueOnce({ id: "group-1", leaderId: leader.id, status: "ACTIVE" })
    // 2ª leitura: o grupo já arquivado, para a resposta.
    .mockResolvedValueOnce({
      id: "group-1",
      name: "Grupo de teste",
      description: null,
      status: "ARCHIVED",
      updatedAt: new Date("2026-11-15T12:00:00Z"),
    });

  txMocks.group.updateMany.mockResolvedValue({ count: 1 });
  txMocks.auditLog.create.mockResolvedValue({});

  transactionMock.mockImplementation(
    async (callback: (tx: typeof txMocks) => Promise<unknown>) => callback(txMocks),
  );
});

describe("POST /api/groups/[groupId]/archive", () => {
  it("arquiva o grupo e registra no audit log na mesma transação (GOS-037)", async () => {
    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(txMocks.group.updateMany).toHaveBeenCalledWith({
      where: { id: "group-1", leaderId: leader.id, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });
    expect(txMocks.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "GROUP_ARCHIVED",
        actorId: leader.id,
        targetType: "GROUP",
        targetId: "group-1",
        metadata: undefined,
        ipAddress: "203.0.113.7",
      },
    });
  });

  it("retorna 403 sem arquivar nem registrar quando quem pede não é o líder", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "member-2" } });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(403);
    expect(transactionMock).not.toHaveBeenCalled();
    expect(txMocks.auditLog.create).not.toHaveBeenCalled();
  });

  it("retorna 409 sem registrar quando o grupo deixou de estar disponível no meio do caminho", async () => {
    txMocks.group.updateMany.mockResolvedValue({ count: 0 });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(409);
    expect(txMocks.auditLog.create).not.toHaveBeenCalled();
  });

  it("retorna 401 sem sessão", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });
});
