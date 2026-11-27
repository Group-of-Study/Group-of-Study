"use client";

import { useSyncExternalStore } from "react";
import { readPreference, savePreference, subscribeToTheme, type ThemePreference } from "@/frontend/lib/theme";
import { SettingsPanel } from "./settings-panel";

const OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
    { value: "light", label: "Claro", description: "Fundo branco" },
    { value: "dark", label: "Escuro", description: "Fundo preto, menos brilho à noite" },
    { value: "system", label: "Sistema", description: "Segue o tema do seu aparelho" },
];

// Servidor não sabe a escolha (fica no localStorage): renderiza "Sistema" e, na
// hidratação, o useSyncExternalStore troca para o valor salvo sem erro de hidratação.
const getServerPreference = (): ThemePreference => "system";

// GOS-016. "Aparência" não existe no Figma: segue o padrão dos painéis (SettingsPanel)
// com um card por opção. A escolha vale para este navegador, não para a conta.
export function AppearancePanel() {
    const preference = useSyncExternalStore(subscribeToTheme, readPreference, getServerPreference);

    return (
        <SettingsPanel id="aparencia" title="Aparência" description="Vale só para este navegador.">
            <fieldset className="grid gap-3 sm:grid-cols-3">
                <legend className="sr-only">Tema</legend>
                {OPTIONS.map((option) => (
                    <label
                        key={option.value}
                        className="flex cursor-pointer flex-col gap-0.5 rounded-md border border-border-default bg-bg-surface p-3 hover:bg-bg-subtle has-checked:border-border-brand has-checked:bg-bg-brand-subtle has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border-focus"
                    >
                        {/* O radio fica escondido, mas o foco do teclado aparece no card (has-focus-visible). */}
                        <input
                            type="radio"
                            name="tema"
                            value={option.value}
                            checked={preference === option.value}
                            onChange={() => savePreference(option.value)}
                            className="sr-only"
                        />
                        <span className="text-label-md text-foreground">{option.label}</span>
                        <span className="text-body-sm text-text-secondary">{option.description}</span>
                    </label>
                ))}
            </fieldset>
        </SettingsPanel>
    );
}
