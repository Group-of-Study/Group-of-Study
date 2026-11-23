"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

// Figma: modal "Nova meta" (Metas — Nova meta). Usa o <dialog> nativo com showModal():
// o navegador cuida do foco (fica preso dentro do modal), do Esc e do fundo escuro.
type DialogProps = {
    open: boolean;
    title: string;
    description?: ReactNode;
    // Enquanto algo está sendo salvo, o Esc, o X e o clique fora não fecham.
    busy?: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
};

export function Dialog({ open, title, description, busy = false, onClose, children, className = "" }: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    function requestClose() {
        if (!busy) onClose();
    }

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            // Esc: o navegador fecharia sozinho; quem decide é o onClose (e o busy).
            onCancel={(event) => {
                event.preventDefault();
                requestClose();
            }}
            // Clique no fundo escuro (fora do conteúdo) fecha.
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) requestClose();
            }}
            className={`m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border-default bg-bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/50 ${className}`}
        >
            {open && (
                <div className="flex flex-col gap-5 p-6">
                    <header className="flex items-start gap-4">
                        <div className="flex flex-1 flex-col gap-1">
                            <h2 id={titleId} className="text-h3 text-foreground">
                                {title}
                            </h2>
                            {description && (
                                <p id={descriptionId} className="text-body-sm text-text-secondary">
                                    {description}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={requestClose}
                            disabled={busy}
                            aria-label="Fechar"
                            className="rounded-sm p-1 text-text-secondary hover:bg-bg-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-border-focus disabled:opacity-50"
                        >
                            <X size={20} aria-hidden />
                        </button>
                    </header>
                    {children}
                </div>
            )}
        </dialog>
    );
}
