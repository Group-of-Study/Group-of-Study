"use client"; // global-error.tsx precisa ser Client Component

import { RouteError } from "@/frontend/components/feedback/route-error";
import { readPreference, resolveTheme, systemPrefersDark } from "@/frontend/lib/theme";
import "./globals.css";

// Erro no próprio layout raiz. Ele substitui o layout inteiro, então precisa do próprio
// <html>, <body> e estilos. Não aceita `metadata`: o título vai direto no <title>.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
    return (
        // Este <html> substitui o do layout raiz (e o data-theme que o script pôs lá).
        // Roda no navegador, então dá para ler o tema direto; no servidor fica o claro.
        <html
            lang="pt-BR"
            data-theme={typeof window === "undefined" ? "light" : resolveTheme(readPreference(), systemPrefersDark())}
            suppressHydrationWarning
            className="h-full antialiased"
        >
            <body className="flex min-h-full flex-col">
                <title>Algo deu errado | Group of Study</title>
                <RouteError error={error} retry={retry} />
            </body>
        </html>
    );
}
