import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionMock,
  transactionMock,
  txMocks,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  transactionMock: vi.fn(),
  txMocks: {
    groupInvite: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    groupMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
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

const user = {
  id: "user-1",
  name: "Talys",
};

const invite = {
  id: "invite-1",
  groupId: "group-1",
  expiresAt: null,
  maxUses: null,
  uses: 0,
  revokedAt: null,
  recipientId: null,
  group: {
    id: "group-1",
    name: "Grupo de Java",
    status: "ACTIVE",
  },
};

function createContext(code = "invite-code") {
  return {
    params: Promise.resolve({ code }),
  };
}

function createRequest() {
  return new Request("http://localhost/api/invites/invite-code/accept", {
    method: "POST",
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  getSessionMock.mockResolvedValue({ user });

  txMocks.groupInvite.findUnique.mockResolvedValue({
    ...invite,
    group: { ...invite.group },
  });

  txMocks.groupInvite.updateMany.mockResolvedValue({
    count: 1,
  });

  txMocks.groupMember.findUnique.mockResolvedValue(null);

  txMocks.groupMember.create.mockResolvedValue({
    id: "membership-1",
  });

  transactionMock.mockImplementation(
    async (callback: (tx: typeof txMocks) => Promise<unknown>) =>
      callback(txMocks),
  );
});

describe("POST /api/invites/[code]/accept", () => {
  it("aceita um convite válido e adiciona o usuário ao grupo", async () => {
    const response = await POST(
      createRequest(),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(201);

    expect(body).toEqual({
      message: "Você entrou no grupo com sucesso.",
      data: {
        groupId: "group-1",
        groupName: "Grupo de Java",
        inviteId: "invite-1",
      },
    });

    expect(txMocks.groupInvite.updateMany).toHaveBeenCalled();
    expect(txMocks.groupMember.create).toHaveBeenCalledWith({
      data: {
        groupId: "group-1",
        userId: user.id,
      },
    });
  });

  it("aceita convite direcionado pelo destinatário correto", async () => {
    txMocks.groupInvite.findUnique.mockResolvedValue({
      ...invite,
      recipientId: user.id,
      maxUses: 1,
    });

    const response = await POST(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(201);

    expect(txMocks.groupInvite.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "invite-1",
          uses: {
            equals: 0,
            lt: 1,
          },
        }),
      }),
    );

    expect(txMocks.groupMember.create).toHaveBeenCalled();
  });

  it("retorna 404 quando o convite não existe", async () => {
    txMocks.groupInvite.findUnique.mockResolvedValue(null);

    const response = await POST(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(txMocks.groupMember.create).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o convite foi revogado", async () => {
    txMocks.groupInvite.findUnique.mockResolvedValue({
      ...invite,
      revokedAt: new Date(),
    });

    const response = await POST(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(409);

    await expect(response.json()).resolves.toEqual({
      error: "Este convite foi revogado.",
    });

    expect(txMocks.groupInvite.updateMany).not.toHaveBeenCalled();
    expect(txMocks.groupMember.create).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o convite expirou", async () => {
    txMocks.groupInvite.findUnique.mockResolvedValue({
      ...invite,
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
    });

    const response = await POST(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(409);

    await expect(response.json()).resolves.toEqual({
      error: "Este convite expirou.",
    });

    expect(txMocks.groupMember.create).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o limite de utilizações foi atingido", async () => {
    txMocks.groupInvite.findUnique.mockResolvedValue({
      ...invite,
      maxUses: 1,
      uses: 1,
    });

    const response = await POST(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(409);

    await expect(response.json()).resolves.toEqual({
      error: "O convite atingiu o limite de utilizações.",
    });

    expect(txMocks.groupMember.create).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o usuário já participa do grupo", async () => {
    txMocks.groupMember.findUnique.mockResolvedValue({
      id: "membership-1",
    });

    const response = await POST(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(409);

    await expect(response.json()).resolves.toEqual({
      error: "Você já participa deste grupo.",
    });

    expect(txMocks.groupInvite.updateMany).not.toHaveBeenCalled();
    expect(txMocks.groupMember.create).not.toHaveBeenCalled();
  });

  it("retorna 403 quando outro usuário tenta aceitar convite direcionado", async () => {
    txMocks.groupInvite.findUnique.mockResolvedValue({
      ...invite,
      recipientId: "user-2",
      maxUses: 1,
    });

    const response = await POST(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(403);

    await expect(response.json()).resolves.toEqual({
      error: "Este convite foi direcionado a outro usuário.",
    });

    expect(txMocks.groupMember.findUnique).not.toHaveBeenCalled();
    expect(txMocks.groupInvite.updateMany).not.toHaveBeenCalled();
    expect(txMocks.groupMember.create).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o grupo não está ativo", async () => {
    txMocks.groupInvite.findUnique.mockResolvedValue({
      ...invite,
      group: {
        ...invite.group,
        status: "ARCHIVED",
      },
    });

    const response = await POST(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(txMocks.groupMember.create).not.toHaveBeenCalled();
  });

  it("retorna 401 quando não existe sessão", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await POST(
      createRequest(),
      createContext(),
    );

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });
});