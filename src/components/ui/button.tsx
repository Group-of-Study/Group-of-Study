import React from "react";
import type { ComponentProps } from "react";

// "ds-*" e "danger" seguem o Figma (Components › Button). secondary, ghost, sm e md
// são os da landing page, que ainda não usa o Design System.
const VARIANTS = {
  primary: "bg-bg-brand text-text-on-brand hover:bg-bg-brand-hover disabled:bg-bg-subtle disabled:text-text-disabled",
  "ds-secondary":
    "border border-border-default bg-bg-surface text-foreground hover:bg-bg-subtle disabled:text-text-disabled",
  danger: "bg-bg-danger text-text-on-brand hover:opacity-90 disabled:bg-bg-subtle disabled:text-text-disabled",
  secondary: "bg-zinc-100 text-zinc-800 border border-zinc-200/80 hover:bg-zinc-200/70 disabled:opacity-50",
  ghost: "bg-transparent text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/80 disabled:opacity-50",
} as const;

const SIZES = {
  "ds-sm": "h-8 px-3 text-label-sm rounded-sm",
  "ds-md": "h-10 px-4 text-label-md rounded-md",
  "ds-lg": "h-12 px-6 text-h4 rounded-md",
  sm: "px-3.5 py-1.5 text-xs min-h-[32px] rounded-xl",
  md: "px-4 py-2 text-sm min-h-[38px] rounded-xl",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  // Ícone antes do texto (ex.: "Sair") ou depois (ex.: seta do "Criar conta grátis").
  leadingIcon?: React.ReactNode;
  icon?: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  leadingIcon,
  icon,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:pointer-events-none disabled:cursor-not-allowed shrink-0";
  return (
    <button type={type} className={`${base} ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...props}>
      {leadingIcon && <span className="inline-flex shrink-0 items-center">{leadingIcon}</span>}
      <span>{children}</span>
      {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
    </button>
  );
}

export default Button;
