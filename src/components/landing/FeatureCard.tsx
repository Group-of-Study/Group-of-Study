interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#03499E]">
        {icon}
      </div>
      <h3 className="text-base font-bold text-zinc-900 pt-1">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}