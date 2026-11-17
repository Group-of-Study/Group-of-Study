import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock, db } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  db: {
    group: { findUnique: vi.fn() },
    groupMember: { findUnique: vi.fn() },
    studySession: { findMany: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  unauthorized: () =>
    Response.json({ error: "Autenticação necessária." }, { status: 401 }),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { GET, POST } from "./route";

const HOUR = 60 * 60 * 1000;
const inHours = (hours: number) => new Date(Date.now() + hours * HOUR).toISOString();
const leader = { id: "leader-1" };
const context = () => ({ params: Promise.resolve({ groupId: "group-1" }) });

const validBody = {
  title: "Plantão de dúvidas",
  description: null,
  startsAt: inHours(24),
  endsAt: inHours(26),
  location: "Biblioteca, sala 3",
  link: null,
};

function post(body: unknown) {
  return new Request("http://localhost/api/groups/group-1/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: leader });
  db.group.findUnique.mockResolvedValue({
    id: "group-1",
    name: "Cálculo I",
    status: "ACTIVE",
    leaderId: leader.id,
  });
  db.groupMember.findUnique.mockResolvedValue({ id: "membership-1" });
  db.studySession.findMany.mockResolvedValue([{ id: "session-1" }]);
  db.studySession.create.mockResolvedValue({ id: "session-1" });
});

describe("GET /api/groups/[groupId]/sessions", () => {
  it("lista os próximos encontros (ainda não acabaram), do mais próximo ao mais distante", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/groups/group-1/sessions"),
      context(),
    );

    expect(response.status).toBe(200);
    const args = db.studySession.findMany.mock.calls[0][0];
    expect(args.where.groupId).toBe("group-1");
    expect(args.where.endsAt.gt).toBeInstanceOf(Date);
    expect(args.orderBy).toEqual({ startsAt: "asc" });
    expect(args.take).toBe(50);
  });

  it("lista os anteriores, do mais recente ao mais antigo", async () => {
    await GET(
      new NextRequest("http://localhost/api/groups/group-1/sessions?when=past"),
      context(),
    );

    const args = db.studySession.findMany.mock.calls[0][0];
    expect(args.where.endsAt.lte).toBeInstanceOf(Date);
    expect(args.orderBy).toEqual({ startsAt: "desc" });
    expect(args.take).toBe(20);
  });

  it("qualquer participante vê, mesmo sem ser o líder e com o grupo arquivado", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "member-2" } });
    db.group.findUnique.mockResolvedValue({
      id: "group-1",
      name: "Cálculo I",
      status: "ARCHIVED",
      leaderId: leader.id,
    });

    const response = await GET(
      new NextRequest("http://localhost/api/groups/group-1/sessions"),
      context(),
    );

    expect(response.status).toBe(200);
  });

  it("retorna 403 para quem não participa", async () => {
    db.groupMember.findUnique.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/groups/group-1/sessions"),
      context(),
    );

    expect(response.status).toBe(403);
    expect(db.studySession.findMany).not.toHaveBeenCalled();
  });

  it("retorna 400 com filtro inválido", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/groups/group-1/sessions?when=ontem"),
      context(),
    );

    expect(response.status).toBe(400);
  });

  it("retorna 404 quando o grupo não existe", async () => {
    db.group.findUnique.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/groups/group-1/sessions"),
      context(),
    );

    expect(response.status).toBe(404);
  });
});

describe("POST /api/groups/[groupId]/sessions", () => {
  it("o líder marca um encontro", async () => {
    const response = await POST(post(validBody), context());

    expect(response.status).toBe(201);
    expect(db.studySession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Plantão de dúvidas",
          location: "Biblioteca, sala 3",
          link: null,
          groupId: "group-1",
          createdById: leader.id,
          startsAt: new Date(validBody.startsAt),
        }),
      }),
    );
  });

  it("participante que não é líder recebe 403", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "member-2" } });

    const response = await POST(post(validBody), context());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Somente o líder pode marcar, editar ou excluir encontros.");
    expect(db.studySession.create).not.toHaveBeenCalled();
  });

  it("grupo arquivado: 409", async () => {
    db.group.findUnique.mockResolvedValue({
      id: "group-1",
      name: "Cálculo I",
      status: "ARCHIVED",
      leaderId: leader.id,
    });

    const response = await POST(post(validBody), context());

    expect(response.status).toBe(409);
    expect(db.studySession.create).not.toHaveBeenCalled();
  });

  it("dados inválidos voltam com issues por campo", async () => {
    const response = await POST(
      post({ ...validBody, location: null, link: null }),
      context(),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.issues).toEqual([
      { field: "location", message: "Informe o local, o link ou os dois" },
    ]);
  });

  it("JSON inválido: 400", async () => {
    const response = await POST(
      new Request("http://localhost/api/groups/group-1/sessions", {
        method: "POST",
        body: "{",
      }),
      context(),
    );

    expect(response.status).toBe(400);
  });

  it("sem sessão: 401", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await POST(post(validBody), context());

    expect(response.status).toBe(401);
  });
});
