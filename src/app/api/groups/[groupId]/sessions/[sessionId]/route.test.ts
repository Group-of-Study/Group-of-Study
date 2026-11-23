import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock, db } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  db: {
    group: { findUnique: vi.fn() },
    groupMember: { findUnique: vi.fn() },
    studySession: { findFirst: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock("@/backend/lib/session", () => ({
  getSession: getSessionMock,
  unauthorized: () =>
    Response.json({ error: "Autenticação necessária." }, { status: 401 }),
}));

vi.mock("@/backend/lib/prisma", () => ({ prisma: db }));

import { DELETE, PATCH } from "./route";

const HOUR = 60 * 60 * 1000;
const inHours = (hours: number) => new Date(Date.now() + hours * HOUR);
const leader = { id: "leader-1" };
const context = () => ({
  params: Promise.resolve({ groupId: "group-1", sessionId: "session-1" }),
});

const validBody = {
  title: "Plantão remarcado",
  description: null,
  startsAt: inHours(48).toISOString(),
  endsAt: inHours(50).toISOString(),
  location: null,
  link: "https://meet.google.com/abc-defg-hij",
};

function patch(body: unknown) {
  return new Request("http://localhost", {
    method: "PATCH",
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
  db.studySession.findFirst.mockResolvedValue({ id: "session-1", endsAt: inHours(24) });
  db.studySession.update.mockResolvedValue({ id: "session-1" });
  db.studySession.deleteMany.mockResolvedValue({ count: 1 });
});

describe("PATCH /api/groups/[groupId]/sessions/[sessionId]", () => {
  it("o líder remarca o encontro", async () => {
    const response = await PATCH(patch(validBody), context());

    expect(response.status).toBe(200);
    expect(db.studySession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "session-1", groupId: "group-1" } }),
    );
    expect(db.studySession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "session-1" },
        data: expect.objectContaining({ title: "Plantão remarcado", location: null }),
      }),
    );
  });

  it("encontro de outro grupo: 404", async () => {
    db.studySession.findFirst.mockResolvedValue(null);

    const response = await PATCH(patch(validBody), context());

    expect(response.status).toBe(404);
    expect(db.studySession.update).not.toHaveBeenCalled();
  });

  it("encontro que já aconteceu não pode ser editado", async () => {
    db.studySession.findFirst.mockResolvedValue({ id: "session-1", endsAt: inHours(-1) });

    const response = await PATCH(patch(validBody), context());

    expect(response.status).toBe(409);
    expect(db.studySession.update).not.toHaveBeenCalled();
  });

  it("quem não é líder: 403", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "member-2" } });

    const response = await PATCH(patch(validBody), context());

    expect(response.status).toBe(403);
  });

  it("dados inválidos: 400 com issues", async () => {
    const response = await PATCH(
      patch({ ...validBody, endsAt: validBody.startsAt }),
      context(),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.issues[0]).toEqual({
      field: "endsAt",
      message: "O fim precisa ser depois do início",
    });
  });
});

describe("DELETE /api/groups/[groupId]/sessions/[sessionId]", () => {
  it("o líder exclui, só se o encontro for deste grupo", async () => {
    const response = await DELETE(new Request("http://localhost"), context());

    expect(response.status).toBe(200);
    expect(db.studySession.deleteMany).toHaveBeenCalledWith({
      where: { id: "session-1", groupId: "group-1" },
    });
  });

  it("encontro inexistente (ou de outro grupo): 404", async () => {
    db.studySession.deleteMany.mockResolvedValue({ count: 0 });

    const response = await DELETE(new Request("http://localhost"), context());

    expect(response.status).toBe(404);
  });

  it("quem não participa: 403", async () => {
    db.groupMember.findUnique.mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost"), context());

    expect(response.status).toBe(403);
    expect(db.studySession.deleteMany).not.toHaveBeenCalled();
  });
});
