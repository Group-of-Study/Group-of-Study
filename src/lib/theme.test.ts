import { afterEach, describe, expect, it } from "vitest";
import { parsePreference, resolveTheme, THEME_STORAGE_KEY, themeScript } from "./theme";

describe("parsePreference", () => {
    it("aceita claro e escuro; qualquer outra coisa vira sistema", () => {
        expect(parsePreference("light")).toBe("light");
        expect(parsePreference("dark")).toBe("dark");
        expect(parsePreference(null)).toBe("system");
        expect(parsePreference("roxo")).toBe("system");
    });
});

describe("resolveTheme", () => {
    it("claro e escuro ignoram o aparelho", () => {
        expect(resolveTheme("light", true)).toBe("light");
        expect(resolveTheme("dark", false)).toBe("dark");
    });

    it("sistema segue o aparelho", () => {
        expect(resolveTheme("system", true)).toBe("dark");
        expect(resolveTheme("system", false)).toBe("light");
    });
});

// O script roda como texto no <head>. Aqui ele é executado de verdade, com
// localStorage, matchMedia e document de mentira.
describe("themeScript", () => {
    const original = { ...globalThis };

    function run({ saved, systemDark }: { saved: string | null; systemDark: boolean }) {
        const attributes: Record<string, string> = {};
        Object.assign(globalThis, {
            localStorage: { getItem: (key: string) => (key === THEME_STORAGE_KEY ? saved : null) },
            matchMedia: () => ({ matches: systemDark }),
            document: { documentElement: { setAttribute: (name: string, value: string) => (attributes[name] = value) } },
        });
        new Function(themeScript)();
        return attributes["data-theme"];
    }

    afterEach(() => {
        for (const key of ["localStorage", "matchMedia", "document"] as const) {
            if (key in original) {
                Object.assign(globalThis, { [key]: original[key as keyof typeof original] });
            } else {
                delete (globalThis as Record<string, unknown>)[key];
            }
        }
    });

    it.each([
        [null, false, "light"],
        [null, true, "dark"],
        ["dark", false, "dark"],
        ["light", true, "light"],
        ["valor-estranho", true, "dark"],
    ])("salvo=%s, aparelho escuro=%s → %s", (saved, systemDark, expected) => {
        expect(run({ saved, systemDark })).toBe(expected);
    });

    it("sem localStorage (bloqueado) não quebra a página", () => {
        Object.assign(globalThis, {
            localStorage: {
                getItem: () => {
                    throw new Error("SecurityError");
                },
            },
        });
        expect(() => new Function(themeScript)()).not.toThrow();
    });
});
