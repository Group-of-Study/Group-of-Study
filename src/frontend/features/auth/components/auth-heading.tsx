import type { ReactNode } from "react";

// Título e subtítulo das telas de auth: H1 no desktop, H2 no mobile.
export function AuthHeading({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1 lg:gap-1.5">
            <h1 className="text-h2 text-foreground lg:text-h1">{title}</h1>
            <p className="text-body-sm text-text-secondary lg:text-body-md">{children}</p>
        </div>
    );
}
