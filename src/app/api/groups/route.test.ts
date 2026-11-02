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
      createRequest("/api/groups?q=direito"),
    );

    expect(response.status).toBe(200);

    // Sem cursor, não deve validar findFirst.
    expect(findFirstMock).not.toHaveBeenCalled();

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              status: "ACTIVE",
            }),

            // Grupos públicos ou dos quais o usuário participa.
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  visibility: "PUBLIC",
                }),
                expect.objectContaining({
                  members: {
                    some: {
                      userId: "user-1",
                    },
                  },
                }),
              ]),
            }),

            // Busca pelo nome ou descrição.
            expect.objectContaining({
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
            }),
          ]),
        }),
      }),
    );
  });

  it("permite visualizar grupos públicos e grupos privados dos quais o usuário participa", async () => {
    const response = await GET(
      createRequest("/api/groups"),
    );

    expect(response.status).toBe(200);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                {
                  visibility: "PUBLIC",
                },
                {
                  members: {
                    some: {
                      userId: "user-1",
                    },
                  },
                },
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it("filtra grupos dos quais o usuário participa quando member=me", async () => {
    const response = await GET(
      createRequest("/api/groups?member=me"),
    );

    expect(response.status).toBe(200);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              members: {
                some: {
                  userId: "user-1",
                },
              },
            }),
          ]),
        }),
      }),
    );
  });

  it("mantém os filtros ao validar e utilizar o cursor", async () => {
    const response = await GET(
      createRequest(
        "/api/groups?cursor=group-1&q=direito&member=me",
      ),
    );

    expect(response.status).toBe(200);

    const expectedFilters = [
      expect.objectContaining({
        status: "ACTIVE",
      }),

      // Filtro de visibilidade.
      expect.objectContaining({
        OR: expect.arrayContaining([
          {
            visibility: "PUBLIC",
          },
          {
            members: {
              some: {
                userId: "user-1",
              },
            },
          },
        ]),
      }),

      // Filtro de busca.
      expect.objectContaining({
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
      }),

      // Filtro member=me.
      expect.objectContaining({
        members: {
          some: {
            userId: "user-1",
          },
        },
      }),
    ];

    // Verifica se o cursor respeita todos os filtros.
    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "group-1",
          AND: expect.arrayContaining(expectedFilters),
        }),
        select: {
          id: true,
        },
      }),
    );

    // Verifica se a listagem também utiliza os mesmos filtros.
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining(expectedFilters),
        }),
        cursor: {
          id: "group-1",
        },
        skip: 1,
      }),
    );
  });

  it("devolve 400 quando o cursor não pertence aos resultados filtrados", async () => {
    findFirstMock.mockResolvedValue(null);

    const response = await GET(
      createRequest("/api/groups?cursor=invalid-group&q=direito"),
    );

    expect(response.status).toBe(400);

    await expect(response.json()).resolves.toEqual({
      error: "Cursor inválido ou grupo não encontrado.",
    });

    expect(findFirstMock).toHaveBeenCalled();

    // Não deve listar grupos se o cursor for inválido.
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("aplica o limite de resultados e informa o próximo cursor", async () => {
    findManyMock.mockResolvedValue([
      { id: "group-1" },
      { id: "group-2" },
      { id: "group-3" },
    ]);

    const response = await GET(
      createRequest("/api/groups?limit=2"),
    );

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      data: [
        { id: "group-1" },
        { id: "group-2" },
      ],
      pagination: {
        limit: 2,
        nextCursor: "group-2",
      },
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
      }),
    );
  });

  it("retorna nextCursor null quando não existem mais resultados", async () => {
    findManyMock.mockResolvedValue([
      { id: "group-1" },
      { id: "group-2" },
    ]);

    const response = await GET(
      createRequest("/api/groups?limit=2"),
    );

    expect(response.status).toBe(200);

    const result = await response.json();

    expect(result.pagination).toEqual({
      limit: 2,
      nextCursor: null,
    });

    expect(result.data).toHaveLength(2);
  });

  it("devolve 400 quando os parâmetros são inválidos", async () => {
    const response = await GET(
      createRequest("/api/groups?limit=100"),
    );

    expect(response.status).toBe(400);

    expect(findManyMock).not.toHaveBeenCalled();
  });
});