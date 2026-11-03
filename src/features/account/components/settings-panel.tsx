import type { ReactNode } from "react";

// Figma: Panel (App / 10 · Configurações). O id serve de âncora para o menu da página.
export function SettingsPanel({
    id,
    title,
    description,
    children,
}: {
    id: string;
    title: string;
    description?: ReactNode;
    children: ReactNode;
}) {
    const titleId = `${id}-titulo`;

    return (
        <section
            id={id}
            aria-labelledby={titleId}
            className="flex scroll-mt-6 flex-col gap-4 rounded-xl border border-border-default bg-bg-surface p-4 lg:p-6"
        >
            <div className="flex flex-col gap-1">
                <h2 id={titleId} className="text-h4 text-foreground">
                    {title}
                </h2>
                {description && <p className="text-body-sm text-text-secondary">{description}</p>}
            </div>
            {children}
        </section>
    );
}

// Figma: SettingRow. Título e descrição à esquerda, controle à direita.
export function SettingRow({
    title,
    description,
    children,
}: {
    title: string;
    description: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div className="flex items-center gap-4 py-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-label-md text-foreground">{title}</p>
                <p className="text-body-sm text-text-secondary">{description}</p>
            </div>
            {children}
        </div>
    );
}

// Marca o que ainda não existe, no lugar do controle de uma SettingRow.
export function ComingSoon() {
    return (
        <span className="shrink-0 rounded-full bg-bg-muted px-2 py-0.5 text-caption text-text-secondary">Em breve</span>
    );
}
