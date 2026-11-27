import Image from "next/image";
import { useId, type ComponentProps, type ReactNode } from "react";

// Figma: Components › Checkbox (Checked=false / Checked=true).
type CheckboxProps = Omit<ComponentProps<"input">, "id" | "type"> & {
    label: ReactNode;
    error?: string;
};

export function Checkbox({ label, error, className = "", ...props }: CheckboxProps) {
    const id = useId();
    const errorId = `${id}-error`;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={id} className="inline-flex w-fit cursor-pointer items-center gap-2 text-body-sm text-foreground">
                <span className="relative inline-flex size-5 shrink-0">
                    <input
                        id={id}
                        type="checkbox"
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        className={`peer size-5 cursor-pointer appearance-none rounded-sm border-[1.5px] bg-bg-surface checked:border-bg-brand checked:bg-bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus ${
                            error ? "border-border-danger" : "border-border-strong"
                        }`}
                        {...props}
                    />
                    <Image
                        src="/icons/check.svg"
                        width={14}
                        height={14}
                        alt=""
                        className="pointer-events-none absolute inset-0 m-auto hidden peer-checked:block"
                    />
                </span>
                {label}
            </label>
            {error && (
                <p id={errorId} className="text-caption text-text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
