// Transforma o user agent salvo na sessão em algo legível ("Chrome no macOS").
// É só para a pessoa reconhecer o dispositivo: não serve para segurança, porque
// o navegador pode mandar qualquer texto.

export type Device = {
    browser: string | null;
    os: string | null;
    mobile: boolean;
};

// A ordem importa: o Edge e o Opera também dizem "Chrome", e o Chrome também diz "Safari".
const BROWSERS: [RegExp, string][] = [
    [/Edg(A|iOS)?\//, "Edge"],
    [/OPR\/|Opera/, "Opera"],
    [/SamsungBrowser\//, "Samsung Internet"],
    [/Firefox\/|FxiOS\//, "Firefox"],
    [/Chrome\/|CriOS\//, "Chrome"],
    [/Version\/.*Safari\//, "Safari"],
];

// Android antes de Linux (o Android também diz "Linux"); iPhone e iPad antes de macOS
// (o iOS diz "like Mac OS X").
const SYSTEMS: [RegExp, string][] = [
    [/Windows/, "Windows"],
    [/Android/, "Android"],
    [/iPhone|iPad|iPod/, "iOS"],
    [/CrOS/, "ChromeOS"],
    [/Mac OS X|Macintosh/, "macOS"],
    [/Linux/, "Linux"],
];

function match(userAgent: string, rules: [RegExp, string][]): string | null {
    return rules.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;
}

export function parseUserAgent(userAgent: string | null | undefined): Device {
    if (!userAgent) {
        return { browser: null, os: null, mobile: false };
    }
    return {
        browser: match(userAgent, BROWSERS),
        os: match(userAgent, SYSTEMS),
        mobile: /Mobi|Android|iPhone|iPad|iPod/.test(userAgent),
    };
}

export function describeDevice({ browser, os }: Device): string {
    if (browser && os) {
        return `${browser} no ${os}`;
    }
    return browser ?? os ?? "Dispositivo desconhecido";
}
