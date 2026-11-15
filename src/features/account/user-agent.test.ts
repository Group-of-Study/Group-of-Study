import { describe, expect, it } from "vitest";
import { describeDevice, parseUserAgent } from "./user-agent";

// User agents reais (copiados dos navegadores), um por combinação.
const AGENTS = {
    chromeMac:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    safariMac:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
    edgeWindows:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0",
    firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
    chromeAndroid:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
    safariIphone:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
    chromeIphone:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.0.0 Mobile/15E148 Safari/604.1",
    operaWindows:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 OPR/115.0.0.0",
};

describe("parseUserAgent", () => {
    it.each([
        ["chromeMac", "Chrome", "macOS", false],
        ["safariMac", "Safari", "macOS", false],
        ["edgeWindows", "Edge", "Windows", false],
        ["firefoxLinux", "Firefox", "Linux", false],
        ["chromeAndroid", "Chrome", "Android", true],
        ["safariIphone", "Safari", "iOS", true],
        ["chromeIphone", "Chrome", "iOS", true],
        ["operaWindows", "Opera", "Windows", false],
    ] as const)("%s → %s no %s", (agent, browser, os, mobile) => {
        expect(parseUserAgent(AGENTS[agent])).toEqual({ browser, os, mobile });
    });

    it("sem user agent não quebra", () => {
        expect(parseUserAgent(null)).toEqual({ browser: null, os: null, mobile: false });
        expect(parseUserAgent("")).toEqual({ browser: null, os: null, mobile: false });
    });

    it("texto desconhecido (ex.: curl) não vira navegador", () => {
        expect(parseUserAgent("curl/8.7.1")).toEqual({ browser: null, os: null, mobile: false });
    });
});

describe("describeDevice", () => {
    it("junta navegador e sistema", () => {
        expect(describeDevice({ browser: "Chrome", os: "macOS", mobile: false })).toBe("Chrome no macOS");
    });

    it("usa o que tiver quando falta um dos dois", () => {
        expect(describeDevice({ browser: "Firefox", os: null, mobile: false })).toBe("Firefox");
        expect(describeDevice({ browser: null, os: "Android", mobile: true })).toBe("Android");
    });

    it("sem nada, diz que não reconhece", () => {
        expect(describeDevice({ browser: null, os: null, mobile: false })).toBe("Dispositivo desconhecido");
    });
});
