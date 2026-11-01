import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-[#0969DA] text-white hover:bg-[#085ec3] active:scale-[0.98]",
    secondary:
      "bg-zinc-100/80 text-zinc-800 border border-zinc-200/60 hover:bg-zinc-200/70 active:scale-[0.98]",
    ghost:
      "bg-transparent text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/60",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs h-8",
    md: "px-4 py-2 text-sm h-9",
    lg: "px-6 py-3 text-sm h-11 font-semibold",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {icon && <span className="shrink-0">{icon}</span>}
    </button>
  );
}