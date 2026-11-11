import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "success" | "info" | "dark" | "outline";
  className?: string;
};

export default function Badge({
  children,
  variant = "info",
  className = "",
}: BadgeProps) {
  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full";

  const variants = {
    success: "bg-emerald-100/80 text-emerald-700",
    info: "bg-blue-50 text-[#03499E] border border-blue-100",
    dark: "bg-zinc-900 text-white",
    outline: "bg-white text-zinc-600 border border-zinc-200",
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}