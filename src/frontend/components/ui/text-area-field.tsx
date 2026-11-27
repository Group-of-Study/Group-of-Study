import { useId, type ComponentProps } from "react";

// Campo de texto longo com o mesmo visual do TextField (rótulo, borda, foco, erro).
// Usado em "Detalhes" das metas e da agenda.
type TextAreaFieldProps = Omit<ComponentProps<"textarea">, "id"> & {
    label: string;
    error?: string;
    helper?: string;
};

export function TextAreaField({ label, error, helper, className = "", rows = 4, ...props }: TextAreaFieldProps) {
    const id = useId();
    const messageId = `${id}-message`;
    const message = error ?? helper;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={id} className="text-label-sm text-foreground">
                {label}
            </label>
            <textarea
                id={id}
                rows={rows}
                aria-invalid={error ? true : undefined}
                aria-describedby={message ? messageId : undefined}
                className={`w-full resize-y rounded-md border bg-bg-surface px-3 py-2.5 text-body-sm text-foreground outline-none placeholder:text-text-tertiary disabled:bg-bg-subtle disabled:text-text-disabled ${
                    error
                        ? "border-border-danger"
                        : "border-border-default focus:border-[1.5px] focus:border-border-brand focus:shadow-focus"
                }`}
                {...props}
            />
            {message && (
                <p id={messageId} className={`text-caption ${error ? "text-text-danger" : "text-text-tertiary"}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
