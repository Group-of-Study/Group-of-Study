import { describe, expect, it } from "vitest";
import { buildOnboarding } from "./steps";

describe("buildOnboarding", () => {
    it("conta nova: só a conta está feita, e o checklist não está completo", () => {
        const onboarding = buildOnboarding({ groupsCount: 0 });

        expect(onboarding.steps.map((step) => [step.id, step.status])).toEqual([
            ["account", "done"],
            ["group", "pending"],
            ["goal", "soon"],
        ]);
        expect(onboarding).toMatchObject({ doneCount: 1, availableCount: 2, complete: false });
    });

    it("entrou num grupo: completa (o passo da meta ainda é 'Em breve' e não conta)", () => {
        const onboarding = buildOnboarding({ groupsCount: 1 });

        expect(onboarding.steps[1]).toMatchObject({ status: "done", description: "Você está em 1 grupo." });
        expect(onboarding).toMatchObject({ doneCount: 2, availableCount: 2, complete: true });
    });

    it("plural na descrição do grupo", () => {
        expect(buildOnboarding({ groupsCount: 3 }).steps[1].description).toBe("Você está em 3 grupos.");
    });
});
