import type { Metadata } from "next";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LogoMark } from "@/components/ui/logo-mark";

export const metadata: Metadata = {
    title: "Página não encontrada | Group of Study",
};

// Endereço que não existe e chamadas a notFound() nas páginas.
export default function NotFound() {
    return (
        <main className="flex flex-1 items-center justify-center px-4 py-16">
            <EmptyState
                titleAs="h1"
                title="Página não encontrada"
                description="O endereço pode estar errado ou a página não existe mais."
                icon={<LogoMark className="size-8" />}
                className="w-full max-w-xl"
            >
                <Link href="/" className={buttonClassName({ size: "ds-md" })}>
                    Voltar ao início
                </Link>
            </EmptyState>
        </main>
    );
}
