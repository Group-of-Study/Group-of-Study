"use client"; // global-error.tsx precisa ser Client Component

import { RouteError } from "@/components/feedback/route-error";
import "./globals.css";

// Erro no próprio layout raiz. Ele substitui o layout inteiro, então precisa do próprio
// <html>, <body> e estilos. Não aceita `metadata`: o título vai direto no <title>.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
    return (
        <html lang="pt-BR" className="h-full antialiased">
            <body className="flex min-h-full flex-col">
                <title>Algo deu errado | Group of Study</title>
                <RouteError error={error} retry={retry} />
            </body>
        </html>
    );
}
