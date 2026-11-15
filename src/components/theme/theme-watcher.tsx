"use client";

import { useEffect } from "react";
import { applyTheme, readPreference, subscribeToTheme } from "@/lib/theme";

// O script do <head> aplica o tema só no carregamento. Depois, quem mantém o
// data-theme certo é este componente: no modo "Sistema", quando o aparelho troca
// entre claro e escuro, e quando a escolha muda em outra aba.
export function ThemeWatcher() {
    useEffect(() => subscribeToTheme(() => applyTheme(readPreference())), []);
    return null;
}
