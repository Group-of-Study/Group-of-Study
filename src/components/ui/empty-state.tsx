import type { ReactNode } from "react";

// Figma: Components › EmptyState (usado em "Início — novo usuário"). Também serve de
// base para as telas de "não encontrado" e de erro, que não têm desenho próprio.
type EmptyStateProps = {
    title: string;
    description: ReactNode;
    // Ícone já no tamanho do Figma (28px); fica dentro do quadrado azul-claro.
    icon?: ReactNode;
    // Botões e links de ação (Figma: Secondary + Primary, nessa ordem).
    children?: ReactNode;
    // O título vira h1 quando o EmptyState é a página inteira (404, erro).
    titleAs?: "h1" | "h2";
    className?: string;
};

export function EmptyState({ title, description, icon, children, titleAs: Title = "h2", className = "" }: EmptyStateProps) {
    return (
        <div
            className={`flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-default bg-bg-surface p-6 text-center sm:p-10 ${className}`}
        >
            {icon && (
                <div className="flex size-14 items-center justify-center rounded-xl bg-bg-brand-subtle">{icon}</div>
            )}
            <Title className="text-h4 text-foreground">{title}</Title>
            <p className="max-w-md text-body-sm text-text-secondary">{description}</p>
            {children && <div className="flex flex-wrap justify-center gap-2 pt-2">{children}</div>}
        </div>
    );
}
