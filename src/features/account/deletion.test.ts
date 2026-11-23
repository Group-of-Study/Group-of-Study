import { beforeEach, describe, expect, it, vi } from "vitest";

const { tx, transaction, deleteManyUsers } = vi.hoisted(() => ({
    tx: {
        group: { update: vi.fn() },
        groupMember: { findMany: vi.fn(), delete: vi.fn() },
        notification: { create: vi.fn(), deleteMany: vi.fn() },
        session: { deleteMany: vi.fn() },
        account: { deleteMany: vi.fn() },
        twoFactor: { deleteMany: vi.fn() },
        groupInvite: { deleteMany: vi.fn() },
        user: { update: vi.fn() },
        auditLog: { create: vi.fn() },
    },
    transaction: vi.fn(),
    deleteManyUsers: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ auth: { options: {} } }));
vi.mock("@/lib/prisma", () => ({
    prisma: { $transaction: transaction, user: { deleteMany: deleteManyUsers } },
}));

import {
    anonymizedEmail,
    DELETED_USER_NAME,
    PURGE_AFTER_DAYS,
    purgeDeletedAccounts,
    softDeleteAccount,
} from "./deletion";

const USER = "user-1";
const NOW = new Date("2026-11-15T12:00:00Z");

function membership(id: string, leaderId: string | null) {
    return { group: { id, name: `Grupo ${id}`, status: "ACTIVE", leaderId } };
}

beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
    tx.groupMember.findMany.mockReset();
});

describe("softDeleteAccount", () => {
    it("anonimiza nome e e-mail, marca deletedAt e tira o acesso", async () => {
        tx.groupMember.findMany.mockResolvedValueOnce([]);

        await softDeleteAccount(USER, { ipAddress: "203.0.113.7", now: NOW });

        expect(tx.user.update).toHaveBeenCalledWith({
            where: { id: USER },
            data: {
                name: DELETED_USER_NAME,
                email: "excluida-user-1@contas.invalid",
                image: null,
                emailVerified: false,
                twoFactorEnabled: false,
                deletedAt: NOW,
            },
        });
        for (const table of [tx.session, tx.account, tx.twoFactor, tx.notification]) {
            expect(table.deleteMany).toHaveBeenCalledWith({ where: { userId: USER } });
        }
        expect(tx.groupInvite.deleteMany).toHaveBeenCalledWith({ where: { recipientId: USER } });
    });

    it("roda tudo numa única transação Serializable", async () => {
        tx.groupMember.findMany.mockResolvedValueOnce([]);
        await softDeleteAccount(USER, { ipAddress: "203.0.113.7", now: NOW });
        expect(transaction).toHaveBeenCalledTimes(1);
        expect(transaction.mock.calls[0][1]).toEqual({ isolationLevel: "Serializable" });
    });

    it("sai de cada grupo com a regra do leave: passa a liderança ou encerra o grupo", async () => {
        tx.groupMember.findMany
            // 1ª chamada: os grupos da pessoa (líder do g1, membro do g2, sozinha no g3).
            .mockResolvedValueOnce([membership("g1", USER), membership("g2", "outra"), membership("g3", USER)])
            // Depois, os restantes de cada grupo, na ordem do leave.
            .mockResolvedValueOnce([{ userId: "mais-antigo" }, { userId: "mais-novo" }])
            .mockResolvedValueOnce([{ userId: "outra" }])
            .mockResolvedValueOnce([]);

        await softDeleteAccount(USER, { ipAddress: "203.0.113.7", now: NOW });

        for (const groupId of ["g1", "g2", "g3"]) {
            expect(tx.groupMember.delete).toHaveBeenCalledWith({ where: { userId_groupId: { userId: USER, groupId } } });
        }
        // g1: o mais antigo vira líder e é avisado.
        expect(tx.group.update).toHaveBeenCalledWith({ where: { id: "g1" }, data: { leaderId: "mais-antigo" } });
        expect(tx.notification.create).toHaveBeenCalledWith({
            data: {
                userId: "mais-antigo",
                type: "BECAME_LEADER",
                data: { groupId: "g1", groupName: "Grupo g1", previousLeaderId: USER },
            },
        });
        // g2: não era líder, nada muda no grupo.
        expect(tx.group.update).not.toHaveBeenCalledWith(expect.objectContaining({ where: { id: "g2" } }));
        // g3: sem ninguém, o grupo é encerrado.
        expect(tx.group.update).toHaveBeenCalledWith({
            where: { id: "g3" },
            data: { status: "CLOSED", leaderId: null },
        });
        expect(tx.notification.create).toHaveBeenCalledTimes(1);
    });

    it("sai dos grupos antes de apagar as notificações (a do novo líder é de outra pessoa)", async () => {
        tx.groupMember.findMany.mockResolvedValueOnce([membership("g1", USER)]).mockResolvedValueOnce([{ userId: "outra" }]);
        await softDeleteAccount(USER, { ipAddress: "203.0.113.7", now: NOW });
        expect(tx.notification.create.mock.invocationCallOrder[0]).toBeLessThan(
            tx.notification.deleteMany.mock.invocationCallOrder[0],
        );
        expect(tx.notification.deleteMany).toHaveBeenCalledWith({ where: { userId: USER } });
    });
});

describe("audit log (GOS-037)", () => {
    it("registra a exclusão na mesma transação, só com ids", async () => {
        tx.groupMember.findMany.mockResolvedValueOnce([membership("g1", "outra")]).mockResolvedValueOnce([{ userId: "outra" }]);

        await softDeleteAccount(USER, { ipAddress: "203.0.113.7", now: NOW });

        expect(tx.auditLog.create).toHaveBeenCalledWith({
            data: {
                action: "ACCOUNT_DELETED",
                actorId: USER,
                targetType: "USER",
                targetId: USER,
                metadata: { groupsLeft: 1 },
                ipAddress: "203.0.113.7",
            },
        });
    });
});

describe("anonymizedEmail", () => {
    it("é único por conta e usa um domínio que nunca recebe e-mail", () => {
        expect(anonymizedEmail("a")).not.toBe(anonymizedEmail("b"));
        expect(anonymizedEmail("a")).toMatch(/@contas\.invalid$/);
    });
});

describe("purgeDeletedAccounts", () => {
    it(`apaga de vez só as contas excluídas há mais de ${PURGE_AFTER_DAYS} dias`, async () => {
        deleteManyUsers.mockResolvedValue({ count: 2 });

        await expect(purgeDeletedAccounts(NOW)).resolves.toBe(2);

        expect(deleteManyUsers).toHaveBeenCalledWith({
            where: { deletedAt: { not: null, lte: new Date("2026-10-16T12:00:00Z") } },
        });
    });
});
