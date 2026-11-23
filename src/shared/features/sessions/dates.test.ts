import { describe, expect, it, vi } from "vitest";

// Fuso do Brasil, como nos testes das metas.
vi.hoisted(() => {
    process.env.TZ = "America/Sao_Paulo";
});

import { combineDayAndTime, formatSessionWhen, isOngoing, sessionBadge, toTimeValue } from "./dates";
import type { StudySession } from "./types";

// Quarta, 21/10/2026, 10h.
const NOW = new Date(2026, 9, 21, 10, 0);
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, day, hours, minutes).toISOString();

function session(startsAt: string, endsAt: string): StudySession {
    return {
        id: "s",
        title: "Plantão",
        description: null,
        startsAt,
        endsAt,
        location: "Biblioteca",
        link: null,
        createdAt: at(1, 0),
        updatedAt: at(1, 0),
        createdBy: { id: "u", name: "Ana" },
    };
}

describe("formatSessionWhen", () => {
    it("hoje e outro dia da semana", () => {
        expect(formatSessionWhen(session(at(21, 19), at(21, 20, 30)), NOW)).toBe("Hoje · 19h–20h30");
        expect(formatSessionWhen(session(at(22, 19), at(22, 21)), NOW)).toBe("Amanhã · 19h–21h");
        expect(formatSessionWhen(session(at(23, 14), at(23, 16)), NOW)).toBe("Sex, 23/10 · 14h–16h");
    });

    it("acontecendo agora", () => {
        const now = session(at(21, 9), at(21, 11));
        expect(isOngoing(now, NOW)).toBe(true);
        expect(formatSessionWhen(now, NOW)).toBe("Acontecendo agora · até 11h");
    });

    it("atravessando a meia-noite", () => {
        expect(formatSessionWhen(session(at(22, 23), at(23, 1)), NOW)).toBe("Amanhã · 23h até sex, 23/10, 1h");
    });
});

describe("sessionBadge", () => {
    it("mês abreviado em maiúsculas e o dia", () => {
        expect(sessionBadge(session(at(23, 19), at(23, 20)))).toEqual({ month: "OUT", day: "23" });
    });
});

describe("campos do formulário", () => {
    it("dia + horário viram o instante certo (19h no Brasil = 22h UTC)", () => {
        expect(combineDayAndTime("2026-10-23", "19:00")).toBe("2026-10-23T22:00:00.000Z");
    });

    it("sem dia ou sem horário, fica vazio (o schema pede o campo)", () => {
        expect(combineDayAndTime("", "19:00")).toBe("");
        expect(combineDayAndTime("2026-10-23", "")).toBe("");
    });

    it("preenche o horário de volta", () => {
        expect(toTimeValue("2026-10-23T22:30:00.000Z")).toBe("19:30");
    });
});
