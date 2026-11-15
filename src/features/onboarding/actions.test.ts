import { beforeEach, describe, expect, it, vi } from "vitest";

const { update, refresh, session } = vi.hoisted(() => ({
    update: vi.fn(),
    refresh: vi.fn(),
    session: { current: null as { user: { id: string } } | null },
}));

vi.mock("@/lib/prisma", () => ({ prisma: { user: { update } } }));
vi.mock("next/cache", () => ({ refresh }));
vi.mock("@/lib/session", () => ({
    requireSession: async () => {
        if (!session.current) {
            throw new Error("REDIRECT:/login");
        }
        return session.current;
    },
}));

import { dismissOnboardingAction } from "./actions";

beforeEach(() => {
    vi.clearAllMocks();
    session.current = { user: { id: "user-1" } };
    update.mockResolvedValue({});
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("dismissOnboardingAction", () => {
    it("salva na conta da pessoa logada e recarrega a página", async () => {
        await dismissOnboardingAction();

        expect(update).toHaveBeenCalledWith({
            where: { id: "user-1" },
            data: { onboardingDoneAt: expect.any(Date) },
        });
        expect(refresh).toHaveBeenCalled();
    });

    it("sem sessão vai para o login sem tocar no banco", async () => {
        session.current = null;

        await expect(dismissOnboardingAction()).rejects.toThrow("REDIRECT:/login");
        expect(update).not.toHaveBeenCalled();
    });

    it("erro no banco não quebra a página (o checklist continua)", async () => {
        update.mockRejectedValue(new Error("banco fora do ar"));

        await expect(dismissOnboardingAction()).resolves.toBeUndefined();
        expect(refresh).not.toHaveBeenCalled();
    });
});
