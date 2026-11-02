import type { ReactNode } from "react";

// Aviso dentro de formulários. "info" segue a nota da tela de Login no Figma;
// "danger" usa os tokens de erro (bg/danger-subtle, text/danger).
const TONES = {
    info: "bg-bg-info-subtle text-text-info",
    danger: "bg-bg-danger-subtle text-text-danger",
} as const;

type AlertProps = {
    tone: keyof typeof TONES;
    icon?: ReactNode;
    children: ReactNode;
};

export function Alert({ tone, icon, children }: AlertProps) {
    return (
        <div
            role={tone === "danger" ? "alert" : "status"}
            className={`flex w-full items-start gap-2 rounded-md p-3 text-caption ${TONES[tone]}`}
        >
            {icon}
            <p className="flex-1">{children}</p>
        </div>
    );
}
