import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionMock,
  transactionMock,
  groupFindUniqueMock,
  userFindUniqueMock,
  groupMemberFindUniqueMock,
  groupInviteFindManyMock,
  txMocks,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  transactionMock: vi.fn(),
  groupFindUniqueMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  groupMemberFindUniqueMock: vi.fn(),
  groupInviteFindManyMock: vi.fn(),
  txMocks: {
    groupInvite: {
      create: vi.fn(),
    },
    notification: {
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
    group: {
      findUnique: groupFindUniqueMock,
    },
    user: {
      findUnique: userFindUniqueMock,
    },
    groupMember: {
      findUnique: groupMemberFindUniqueMock,
    },
    groupInvite: {
      findMany: groupInviteFindManyMock,
    },
  },
}));

import { GET, POST } from "./route";

const leader = {
  id: "leader-1",
  name: "Talys",
};

const recipient = {
  id: "recipient-1",
  name: "Miguel",
};

const group = {
  id: "group-1",
  name: "Grupo de Java",
  leaderId: leader.id,
  status: "ACTIVE",
};

const createdInvite = {
  id: "invite-1",
  code: "invite-code",
  expiresAt: null,
  maxUses: 1,
  uses: 0,
  recipientId: recipient.id,
  createdAt: new Date("2026-11-01T12:00:00.000Z"),
};

function createContext() {
  return {
    params: Promise.resolve({
      groupId: "group-1",
    }),
  };
}

function createPostRequest(body: unknown) {
  return new Request(
    "http://localhost/api/groups/group-1/invites",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

function createGetRequest() {
  return new Request(
    "http://localhost/api/groups/group-1/invites",
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  getSessionMock.mockResolvedValue({
    user: leader,
  });

  groupFindUniqueMock.mockResolvedValue(group);

  userFindUniqueMock.mockResolvedValue({
    id: recipient.id,
  });

  groupMemberFindUniqueMock.mockResolvedValue(null);

  groupInviteFindManyMock.mockResolvedValue([]);

  txMocks.groupInvite.create.mockResolvedValue(createdInvite);
  txMocks.notification.create.mockResolvedValue({});

  transactionMock.mockImplementation(
    async (callback: (tx: typeof txMocks) => Promise<unknown>) =>
      callback(txMocks),
  );
});

describe("POST /api/groups/[groupId]/invites", () => {
  it("cria convite direcionado e envia notificação ao destinatário", async () => {
    const response = await POST(
      createPostRequest({
        recipientId: recipient.id,
        maxUses: 50,
      }),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.message).toBe("Convite criado com sucesso.");

    // Convites direcionados sempre possuem limite de uma utilização.
    expect(txMocks.groupInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          groupId: group.id,
          createdById: leader.id,
          recipientId: recipient.id,
          maxUses: 1,
        }),
      }),
    );

    // A notificação deve ser criada dentro da mesma transação.
    expect(txMocks.notification.create).toHaveBeenCalledWith({
      data: {
        userId: recipient.id,
        type: "GROUP_INVITE",
        data: {
          inviteId: createdInvite.id,
          code: createdInvite.code,
          groupId: group.id,
          groupName: group.name,
          invitedById: leader.id,
        },
      },
    });

    expect(transactionMock).toHaveBeenCalledOnce();
  });

  it("cria convite público sem destinatário e mantém o limite informado", async () => {
    const publicInvite = {
      ...createdInvite,
      recipientId: null,
      maxUses: 10,
    };

    txMocks.groupInvite.create.mockResolvedValue(publicInvite);

    const response = await POST(
      createPostRequest({
        maxUses: 10,
      }),
      createContext(),
    );

    expect(response.status).toBe(201);

    expect(txMocks.groupInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientId: null,
          maxUses: 10,
        }),
      }),
    );

    expect(txMocks.notification.create).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o destinatário não existe", async () => {
    userFindUniqueMock.mockResolvedValue(null);

    const response = await POST(
      createPostRequest({
        recipientId: recipient.id,
      }),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o destinatário já participa do grupo", async () => {
    groupMemberFindUniqueMock.mockResolvedValue({
      id: "membership-1",
    });

    const response = await POST(
      createPostRequest({
        recipientId: recipient.id,
      }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("retorna 403 quando outro usuário tenta criar convite", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "member-2",
      },
    });

    const response = await POST(
      createPostRequest({}),
      createContext(),
    );

    expect(response.status).toBe(403);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o grupo não está ativo", async () => {
    groupFindUniqueMock.mockResolvedValue({
      ...group,
      status: "ARCHIVED",
    });

    const response = await POST(
      createPostRequest({}),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("retorna 401 quando não existe sessão", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await POST(
      createPostRequest({}),
      createContext(),
    );

    expect(response.status).toBe(401);
    expect(groupFindUniqueMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/groups/[groupId]/invites", () => {
  it("permite que o líder liste os convites do grupo", async () => {
    groupInviteFindManyMock.mockResolvedValue([
      createdInvite,
    ]);

    const response = await GET(
      createGetRequest(),
      createContext(),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
   expect(body.data).toEqual([
  {
    ...createdInvite,
    createdAt: createdInvite.createdAt.toISOString(),
  },
]);

    expect(groupInviteFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          groupId: group.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    );
  });

  it("retorna 403 quando um participante comum tenta listar convites", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "member-2",
      },
    });

    const response = await GET(
      createGetRequest(),
      createContext(),
    );

    expect(response.status).toBe(403);
    expect(groupInviteFindManyMock).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o grupo não existe", async () => {
    groupFindUniqueMock.mockResolvedValue(null);

    const response = await GET(
      createGetRequest(),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(groupInviteFindManyMock).not.toHaveBeenCalled();
  });

  it("retorna 401 quando não existe sessão", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await GET(
      createGetRequest(),
      createContext(),
    );

    expect(response.status).toBe(401);
    expect(groupFindUniqueMock).not.toHaveBeenCalled();
  });
});