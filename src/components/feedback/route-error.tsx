"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// Em produção a mensagem de erro do servidor não chega ao navegador (para não vazar
// detalhes); o digest é o código que liga a tela ao log do servidor.
function getDigest(error: unknown): string | undefined {
    if (error instanceof Error && "digest" in error && typeof error.digest === "string") {
        return error.digest;
    }
    return undefined;
}

// Tela usada pelo error.tsx e pelo global-error.tsx.
export function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    const digest = getDigest(error);

    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16">
            <EmptyState
                titleAs="h1"
                title="Algo deu errado"
                description="Não conseguimos carregar esta página. Tente de novo; se continuar, avise a equipe."
                // Provisório: o Figma ainda não tem ícone de alerta.
                icon={
                    <span aria-hidden className="text-h2 text-text-brand">
                        !
                    </span>
                }
                className="w-full max-w-xl"
            >
                <Link href="/" className={buttonClassName({ variant: "ds-secondary", size: "ds-md" })}>
                    Voltar ao início
                </Link>
                <Button size="ds-md" onClick={retry}>
                    Tentar de novo
                </Button>
            </EmptyState>
            {digest && <p className="text-caption text-text-tertiary">Código do erro: {digest}</p>}
        </main>
    );
}
