import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock, findManyMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  unauthorized: () =>
    Response.json({ error: "Autenticação necessária." }, { status: 401 }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { goal: { findMany: findManyMock } },
}));

import { NextRequest } from "next/server";

import { GET } from "./route";

const NOW = new Date("2026-11-15T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function request(query = "") {
  return new NextRequest(`http://localhost/api/goals${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
  findManyMock.mockResolvedValue([{ id: "goal-1" }]);
});

describe("GET /api/goals", () => {
  it("lista as metas dos grupos da pessoa: pendentes e concluídas dos últimos 30 dias", async () => {
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([{ id: "goal-1" }]);
    const since = new Date(NOW.getTime() - 30 * DAY);
    expect(body.completedSince).toBe(since.toISOString());

    const args = findManyMock.mock.calls[0][0];
    expect(args.where).toEqual({
      group: { members: { some: { userId: "user-1" } } },
      OR: [
        { status: "PENDING" },
        { status: "COMPLETED", completedAt: { gte: since } },
      ],
    });
    // Cada meta vem com o grupo dela.
    expect(args.select.group).toBeDefined();
    expect(args.take).toBe(500);
  });

  it("aceita completedSince e filtra por grupo", async () => {
    await GET(request("?completedSince=2026-11-09T03:00:00.000Z&groupId=group-9"));

    const { where } = findManyMock.mock.calls[0][0];
    expect(where.groupId).toBe("group-9");
    expect(where.OR[1].completedAt.gte).toEqual(new Date("2026-11-09T03:00:00.000Z"));
  });

  it("não volta mais de 90 dias nas concluídas", async () => {
    const response = await GET(request("?completedSince=2020-01-01T00:00:00.000Z"));
    const body = await response.json();

    expect(body.completedSince).toBe(new Date(NOW.getTime() - 90 * DAY).toISOString());
  });

  it("retorna 400 com data inválida", async () => {
    const response = await GET(request("?completedSince=ontem"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.issues[0].field).toBe("completedSince");
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("retorna 401 sem sessão", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });
});
