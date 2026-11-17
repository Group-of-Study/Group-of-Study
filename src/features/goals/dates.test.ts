import { describe, expect, it, vi } from "vitest";

// As regras usam o fuso de quem está vendo. Fixa o do Brasil antes de importar o
// módulo, para o teste dar o mesmo resultado em qualquer máquina (e no CI, em UTC).
vi.hoisted(() => {
    process.env.TZ = "America/Sao_Paulo";
});

import {
    combineDueDate,
    formatDay,
    formatDayHeading,
    formatDueLabel,
    goalViews,
    groupByDueDay,
    isOverdue,
    sortGoals,
    toDateInputValue,
    toTimeInputValue,
    undatedGoals,
    weekGoals,
    weekRange,
    weekRhythm,
} from "./dates";
import type { Goal } from "./types";

// Quarta, 21/10/2026, 10h (no Brasil).
const NOW = new Date(2026, 9, 21, 10, 0);

function goal(overrides: Partial<Goal>): Goal {
    return {
        id: overrides.id ?? "g",
        title: "Meta",
        description: null,
        dueDate: null,
        status: "PENDING",
        completedAt: null,
        createdAt: new Date(2026, 9, 1).toISOString(),
        updatedAt: new Date(2026, 9, 1).toISOString(),
        author: { id: "u1", name: "Miguel Andrade" },
        ...overrides,
    };
}

const at = (day: number, hours = 23, minutes = 59) => new Date(2026, 9, day, hours, minutes).toISOString();

describe("formatDay", () => {
    it.each([
        [21, "Hoje"],
        [22, "Amanhã"],
        [20, "Ontem"],
        [23, "Sex, 23/10"],
        [16, "Sex, 16/10"],
        [30, "30/10"],
    ])("dia %i → %s", (day, expected) => {
        expect(formatDay(new Date(2026, 9, day, 12), NOW)).toBe(expected);
    });

    it("mostra o ano quando não é o ano atual", () => {
        expect(formatDay(new Date(2027, 0, 5), NOW)).toBe("05/01/2027");
    });
});

describe("formatDueLabel", () => {
    it("prazo com horário", () => {
        expect(formatDueLabel(goal({ dueDate: at(21, 19, 0) }), NOW)).toBe("Hoje, 19h");
        expect(formatDueLabel(goal({ dueDate: at(23, 18, 30) }), NOW)).toBe("Sex, 23/10, 18h30");
    });

    it("prazo só com o dia (23h59) não mostra o horário", () => {
        expect(formatDueLabel(goal({ dueDate: at(22) }), NOW)).toBe("Amanhã");
    });

    it("pendente com prazo vencido fica como atrasada", () => {
        const late = goal({ dueDate: at(20, 18, 30) });
        expect(isOverdue(late, NOW)).toBe(true);
        expect(formatDueLabel(late, NOW)).toBe("Atrasada · Ontem, 18h30");
    });

    it("hoje mais cedo também já está atrasada", () => {
        expect(isOverdue(goal({ dueDate: at(21, 9, 0) }), NOW)).toBe(true);
    });

    it("concluída mostra quando foi concluída, não o prazo", () => {
        const done = { status: "COMPLETED" as const, dueDate: at(10) };
        expect(formatDueLabel(goal({ ...done, completedAt: at(21, 8, 0) }), NOW)).toBe("Concluída hoje");
        expect(formatDueLabel(goal({ ...done, completedAt: at(20, 8, 0) }), NOW)).toBe("Concluída ontem");
        expect(formatDueLabel(goal({ ...done, completedAt: at(15, 8, 0) }), NOW)).toBe("Concluída em 15/10");
        expect(isOverdue(goal({ ...done, completedAt: at(15) }), NOW)).toBe(false);
    });

    it("sem prazo", () => {
        expect(formatDueLabel(goal({}), NOW)).toBe("Sem prazo");
    });
});

describe("weekRange", () => {
    it("vai de segunda a segunda seguinte", () => {
        const { start, end } = weekRange(NOW);
        expect(start).toEqual(new Date(2026, 9, 19));
        expect(end).toEqual(new Date(2026, 9, 26));
    });

    it("domingo ainda é da semana que começou na segunda anterior", () => {
        expect(weekRange(new Date(2026, 9, 25, 22)).start).toEqual(new Date(2026, 9, 19));
    });
});

describe("sortGoals", () => {
    it("pendentes por prazo (sem prazo no fim), depois concluídas da mais recente", () => {
        const sorted = sortGoals([
            goal({ id: "done-old", status: "COMPLETED", completedAt: at(10) }),
            goal({ id: "no-due" }),
            goal({ id: "friday", dueDate: at(23) }),
            goal({ id: "done-new", status: "COMPLETED", completedAt: at(20) }),
            goal({ id: "today", dueDate: at(21, 19, 0) }),
        ]);
        expect(sorted.map((g) => g.id)).toEqual(["today", "friday", "no-due", "done-new", "done-old"]);
    });
});

describe("weekGoals", () => {
    it("pendentes até domingo (com as atrasadas) e concluídas desde segunda", () => {
        const goals = [
            goal({ id: "late", dueDate: at(14) }),
            goal({ id: "sunday", dueDate: at(25) }),
            goal({ id: "next-week", dueDate: at(27) }),
            goal({ id: "no-due" }),
            goal({ id: "done-this-week", status: "COMPLETED", completedAt: at(19, 9, 0) }),
            goal({ id: "done-last-week", status: "COMPLETED", completedAt: at(18, 9, 0) }),
        ];
        expect(weekGoals(goals, NOW).map((g) => g.id)).toEqual(["late", "sunday", "done-this-week"]);
    });
});

describe("campos de data e hora", () => {
    it("dia + horário viram o instante certo (19h no Brasil = 22h UTC)", () => {
        expect(combineDueDate("2026-10-24", "19:00")).toBe("2026-10-24T22:00:00.000Z");
    });

    it("sem horário, o prazo é o fim do dia", () => {
        expect(combineDueDate("2026-10-24", "")).toBe("2026-10-25T02:59:00.000Z");
    });

    it("sem dia, sem prazo", () => {
        expect(combineDueDate("", "19:00")).toBeNull();
    });

    it("preenche o formulário de volta a partir do prazo salvo", () => {
        expect(toDateInputValue("2026-10-24T22:00:00.000Z")).toBe("2026-10-24");
        expect(toTimeInputValue("2026-10-24T22:00:00.000Z")).toBe("19:00");
        // Fim do dia aparece como "sem horário".
        expect(toTimeInputValue("2026-10-25T02:59:00.000Z")).toBe("");
        expect(toDateInputValue(null)).toBe("");
    });
});

describe("página /metas", () => {
    const goals = [
        goal({ id: "late", dueDate: at(20, 18, 0) }),
        goal({ id: "today-late", dueDate: at(21, 9, 0) }),
        goal({ id: "today", dueDate: at(21, 19, 0) }),
        goal({ id: "today-done", dueDate: at(21, 8, 0), status: "COMPLETED", completedAt: at(21, 7, 0) }),
        goal({ id: "friday", dueDate: at(23, 19, 0) }),
        goal({ id: "last-week", dueDate: at(16, 19, 0) }),
        goal({ id: "next-week", dueDate: at(27, 19, 0) }),
        goal({ id: "undated" }),
        goal({ id: "done-monday", dueDate: at(30), status: "COMPLETED", completedAt: at(19, 10, 0) }),
    ];
    const ids = (list: Goal[]) => list.map((g) => g.id);

    it("Esta semana: prazo de segunda a domingo, por ordem de prazo", () => {
        expect(ids(goalViews.week(goals, NOW))).toEqual(["late", "today-done", "today-late", "today", "friday"]);
    });

    it("Hoje: prazo hoje, pendente ou concluída", () => {
        expect(ids(goalViews.today(goals, NOW))).toEqual(["today-done", "today-late", "today"]);
    });

    it("Atrasadas: pendentes com prazo vencido, de qualquer semana", () => {
        expect(ids(goalViews.overdue(goals, NOW))).toEqual(["last-week", "late", "today-late"]);
    });

    it("Concluídas: a mais recente primeiro", () => {
        expect(ids(goalViews.completed(goals))).toEqual(["today-done", "done-monday"]);
    });

    it("sem prazo fica à parte", () => {
        expect(ids(undatedGoals(goals))).toEqual(["undated"]);
    });

    it("agrupa por dia do prazo", () => {
        const days = groupByDueDay(goalViews.week(goals, NOW));
        expect(days.map((d) => [formatDayHeading(d.day, NOW), ids(d.goals)])).toEqual([
            ["Ontem · ter, 20/10", ["late"]],
            ["Hoje · qua, 21/10", ["today-done", "today-late", "today"]],
            ["Sexta · 23/10", ["friday"]],
        ]);
    });

    it("ritmo da semana: feitas/total das metas da semana e conclusões por dia (seg a dom)", () => {
        expect(weekRhythm(goals, NOW)).toEqual({ done: 1, total: 5, perDay: [1, 0, 1, 0, 0, 0, 0] });
    });
});
