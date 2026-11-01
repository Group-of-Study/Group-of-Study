import React from "react";
import type { ComponentProps } from "react";

const VARIANTS = {
  primary: "bg-bg-brand text-text-on-brand hover:bg-bg-brand-hover disabled:bg-bg-subtle disabled:text-text-disabled",
  secondary: "bg-zinc-100 text-zinc-800 border border-zinc-200/80 hover:bg-zinc-200/70",
  ghost: "bg-transparent text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/80",
} as const;

const SIZES = {
  sm: "px-3.5 py-1.5 text-xs min-h-[32px]",
  md: "px-4 py-2 text-sm min-h-[38px]",
  lg: "px-6 py-2.5 text-sm min-h-[44px] font-semibold",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  icon?: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed shrink-0";
  return (
    <button type={type} className={`${base} ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...props}>
      <span>{children}</span>
      {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
    </button>
  );
}

export default Button;
