import { describe, expect, it } from "vitest";
import { getInitials } from "./avatar";

describe("getInitials", () => {
    it.each([
        ["Miguel Andrade", "MA"],
        ["miguel de andrade", "MA"],
        ["  Miguel   Andrade  ", "MA"],
        ["Miguel", "M"],
        ["Ícaro Ávila", "ÍÁ"],
        ["", "?"],
        ["   ", "?"],
    ])("%j → %s", (name, initials) => {
        expect(getInitials(name)).toBe(initials);
    });
});
