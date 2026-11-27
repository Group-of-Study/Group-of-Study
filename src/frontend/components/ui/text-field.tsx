import { useId, type ComponentProps, type ReactNode } from "react";

// Figma: Components › Input (Default, Focus, Filled, Error, Disabled).
type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
    label: string;
    icon?: ReactNode;
    error?: string;
    helper?: string;
};

export function TextField({ label, icon, error, helper, className = "", ...props }: TextFieldProps) {
    const id = useId();
    const messageId = `${id}-message`;
    const message = error ?? helper;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={id} className="text-label-sm text-foreground">
                {label}
            </label>
            <div
                className={`flex h-11 items-center gap-2 rounded-md border bg-bg-surface px-3 has-disabled:bg-bg-subtle ${
                    error
                        ? "border-border-danger"
                        : "border-border-default focus-within:border-[1.5px] focus-within:border-border-brand focus-within:shadow-focus"
                }`}
            >
                {icon}
                <input
                    id={id}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={message ? messageId : undefined}
                    className="min-w-0 flex-1 bg-transparent text-body-sm text-foreground outline-none placeholder:text-text-tertiary disabled:text-text-disabled"
                    {...props}
                />
            </div>
            {message && (
                <p id={messageId} className={`text-caption ${error ? "text-text-danger" : "text-text-tertiary"}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
