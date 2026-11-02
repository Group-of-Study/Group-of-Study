import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";

// Moldura das telas de login e cadastro: painel da marca + área do formulário.
// No mobile a marca fica em cima e o formulário vira uma "folha" branca.
// Sem checagem de sessão aqui (layouts não rodam de novo ao navegar).
export default function AuthLayout({ children }: LayoutProps<"/">) {
    return (
        <div className="flex min-h-dvh flex-1 flex-col bg-bg-brand-strong lg:flex-row">
            <AuthBrandPanel />
            <main className="flex flex-1 flex-col rounded-t-[28px] bg-background px-6 pt-7 pb-6 lg:items-center lg:justify-center lg:rounded-none lg:p-16">
                <div className="flex w-full flex-1 flex-col lg:max-w-100 lg:flex-none">{children}</div>
            </main>
        </div>
    );
}
