import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

describe("GET /api/health", () => {
  it("retorna 200 quando o banco responde", async () => {
    (prisma.$queryRaw as any).mockResolvedValue([{ "?column?": 1 }]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok", db: "up" });
  });

  it("retorna 503 quando o banco falha", async () => {
    (prisma.$queryRaw as any).mockRejectedValue(new Error("db down"));
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ status: "unhealthy", db: "down" });
  });
});
