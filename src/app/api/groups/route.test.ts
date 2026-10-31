
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
    getSessionMock,
    findFirstMock,
    findManyMock,
} = vi.hoisted(() => ({
    getSessionMock: vi.fn(),
    findFirstMock: vi.fn(),
    findManyMock: vi.fn(),
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
        group: {
            findFirst: findFirstMock,
            findMany: findManyMock,
        },
    },
}));

import { GET } from "./route";

const user = {
    id: "user-1",
    name: "Miguel",
    email: "miguel@exemplo.com",
};

function createRequest(url: string) {
    return new NextRequest(`http://localhost:3000${url}`);
}

beforeEach(() => {
    vi.clearAllMocks();

    getSessionMock.mockResolvedValue({ user });
    findFirstMock.mockResolvedValue({ id: "group-1" });
    findManyMock.mockResolvedValue([]);
});

describe("GET /api/groups", () => {
    it("devolve 401 sem sessão", async () => {
        getSessionMock.mockResolvedValue(null);

        const response = await GET(createRequest("/api/groups"));

        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({
            error: "Autenticação necessária.",
        });

        expect(findManyMock).not.toHaveBeenCalled();
    });

    it("busca grupos pelo nome ou descrição sem diferenciar maiúsculas", async () => {
        const response = await GET(
            createRequest("/api/groups?q=DIREITO"),
        );

        expect(response.status).toBe(200);

        expect(findManyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    status: "ACTIVE",
                    OR: [
                        {
                            name: {
                                contains: "DIREITO",
                                mode: "insensitive",
                            },
                        },
                        {
                            description: {
                                contains: "DIREITO",
                                mode: "insensitive",
                            },
                        },
                    ],
                },
            }),
        );
    });

    it("filtra somente os grupos dos quais o usuário participa", async () => {
        const response = await GET(
            createRequest("/api/groups?member=me"),
        );

        expect(response.status).toBe(200);

        expect(findManyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    status: "ACTIVE",
                    members: {
                        some: {
                            userId: user.id,
                        },
                    },
                },
            }),
        );
    });

    it("combina a busca com o filtro de participação", async () => {
        const response = await GET(
            createRequest("/api/groups?q=direito&member=me"),
        );

        expect(response.status).toBe(200);

        expect(findManyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    status: "ACTIVE",
                    OR: [
                        {
                            name: {
                                contains: "direito",
                                mode: "insensitive",
                            },
                        },
                        {
                            description: {
                                contains: "direito",
                                mode: "insensitive",
                            },
                        },
                    ],
                    members: {
                        some: {
                            userId: user.id,
                        },
                    },
                },
            }),
        );
    });

    it("devolve 400 quando o filtro member é inválido", async () => {
        const response = await GET(
            createRequest("/api/groups?member=all"),
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "Parâmetros de consulta inválidos.",
        });

        expect(findManyMock).not.toHaveBeenCalled();
    });

    it("devolve 400 quando o cursor não pertence aos grupos filtrados", async () => {
        findFirstMock.mockResolvedValue(null);

        const response = await GET(
            createRequest(
                "/api/groups?q=direito&member=me&cursor=cursor-invalido",
            ),
        );

        expect(response.status).toBe(400);
        expect(findManyMock).not.toHaveBeenCalled();
    });

    it("mantém os filtros ao validar e utilizar o cursor", async () => {
        const response = await GET(
            createRequest(
                "/api/groups?q=direito&member=me&cursor=group-1",
            ),
        );

        expect(response.status).toBe(200);

        expect(findFirstMock).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: "group-1",
                    status: "ACTIVE",
                    members: {
                        some: {
                            userId: user.id,
                        },
                    },
                }),
            }),
        );

        expect(findManyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                cursor: { id: "group-1" },
                skip: 1,
                where: expect.objectContaining({
                    status: "ACTIVE",
                    members: {
                        some: {
                            userId: user.id,
                        },
                    },
                }),
            }),
        );
    });

    it("respeita o limite e retorna o próximo cursor", async () => {
        findManyMock.mockResolvedValue([
            { id: "group-1" },
            { id: "group-2" },
            { id: "group-3" },
        ]);

        const response = await GET(
            createRequest("/api/groups?limit=2"),
        );

        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data).toHaveLength(2);

        expect(body.pagination).toEqual({
            limit: 2,
            nextCursor: "group-2",
        });
    });
});
