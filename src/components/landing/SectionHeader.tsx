interface SectionHeaderProps {
  badge: string;
  title: string;
  description?: string;
  className?: string;
}

export default function SectionHeader({
  badge,
  title,
  description,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#03499E]">
        {badge}
      </span>
      <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
        {title}
      </h2>
      {description && (
        <p className="mt-1 max-w-2xl text-xs sm:text-sm text-zinc-500">
          {description}
        </p>
      )}
    </div>
  );
}