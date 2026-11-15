import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { session: { findMany } } }));

import { listActiveSessions } from "./sessions";

const CHROME_MAC =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";
const SAFARI_IPHONE =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("listActiveSessions", () => {
    it("busca só as sessões do usuário que ainda não expiraram, sem o token", async () => {
        findMany.mockResolvedValue([]);

        await listActiveSessions("user-1", "sessao-atual");

        const query = findMany.mock.calls[0][0];
        expect(query.where.userId).toBe("user-1");
        expect(query.where.expiresAt.gt).toBeInstanceOf(Date);
        // O token nunca sai do banco por aqui.
        expect(query.select).not.toHaveProperty("token");
    });

    it("coloca a sessão atual primeiro e descreve o dispositivo", async () => {
        // 14/11/2026 22:30 UTC = 19:30 em Brasília.
        findMany.mockResolvedValue([
            { id: "outra", userAgent: SAFARI_IPHONE, ipAddress: "", createdAt: new Date("2026-11-14T22:30:00Z") },
            { id: "sessao-atual", userAgent: CHROME_MAC, ipAddress: "189.1.2.3", createdAt: new Date("2026-11-10T12:00:00Z") },
        ]);

        const sessions = await listActiveSessions("user-1", "sessao-atual");

        expect(sessions.map((s) => s.id)).toEqual(["sessao-atual", "outra"]);
        expect(sessions[0]).toMatchObject({ device: "Chrome no macOS", mobile: false, ipAddress: "189.1.2.3", current: true });
        // IP vazio vira null (a tela mostra "IP desconhecido").
        expect(sessions[1]).toMatchObject({ device: "Safari no iOS", mobile: true, ipAddress: null, current: false });
        expect(sessions[1].connectedAt).toContain("19:30");
    });

    it.each(["::", "0000:0000:0000:0000:0000:0000:0000:0000", "0.0.0.0", null])(
        "IP vazio (%s) vira null",
        async (ipAddress) => {
            findMany.mockResolvedValue([{ id: "s", userAgent: null, ipAddress, createdAt: new Date() }]);

            const [session] = await listActiveSessions("user-1", "s");

            expect(session.ipAddress).toBeNull();
        },
    );
});
