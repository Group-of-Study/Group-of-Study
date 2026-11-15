// Tema claro/escuro (GOS-016). A escolha fica no localStorage do navegador: é uma
// preferência do aparelho, não da conta (cada dispositivo pode ter a sua).
// O <html> recebe data-theme="light" | "dark", e o globals.css troca os tokens.

export type ThemePreference = "light" | "dark" | "system";
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "gos-theme";
// Disparado na própria aba quando a escolha muda (o evento "storage" só chega nas outras abas).
export const THEME_CHANGE_EVENT = "gos-theme-change";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function parsePreference(value: string | null | undefined): ThemePreference {
    return value === "light" || value === "dark" ? value : "system";
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
    if (preference === "system") {
        return systemPrefersDark ? "dark" : "light";
    }
    return preference;
}

// Roda no <head>, antes da página aparecer, para não piscar o tema claro (ver
// "Preventing Flash" na documentação do Next). Precisa ser JavaScript puro em
// texto; o try/catch cobre navegador sem localStorage (ex.: modo privado bloqueado).
export const themeScript = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
)});var d=p==="dark"||(p!=="light"&&matchMedia(${JSON.stringify(
    DARK_QUERY,
)}).matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`;

// ---- Só no navegador (usado pelos componentes cliente) ----

export function readPreference(): ThemePreference {
    try {
        return parsePreference(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
        return "system";
    }
}

export function systemPrefersDark(): boolean {
    return window.matchMedia(DARK_QUERY).matches;
}

export function applyTheme(preference: ThemePreference): void {
    document.documentElement.setAttribute("data-theme", resolveTheme(preference, systemPrefersDark()));
}

export function savePreference(preference: ThemePreference): void {
    try {
        if (preference === "system") {
            localStorage.removeItem(THEME_STORAGE_KEY);
        } else {
            localStorage.setItem(THEME_STORAGE_KEY, preference);
        }
    } catch {
        // Sem localStorage o tema ainda muda nesta página; só não fica salvo.
    }
    applyTheme(preference);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

// Avisa quando a preferência muda nesta aba, em outra aba ou, no modo "Sistema",
// quando o aparelho troca entre claro e escuro.
export function subscribeToTheme(onChange: () => void): () => void {
    const media = window.matchMedia(DARK_QUERY);
    const onStorage = (event: StorageEvent) => {
        if (event.key === THEME_STORAGE_KEY) {
            onChange();
        }
    };
    window.addEventListener(THEME_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    media.addEventListener("change", onChange);
    return () => {
        window.removeEventListener(THEME_CHANGE_EVENT, onChange);
        window.removeEventListener("storage", onStorage);
        media.removeEventListener("change", onChange);
    };
}
