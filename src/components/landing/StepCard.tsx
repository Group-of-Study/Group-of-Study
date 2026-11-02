interface StepCardProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function StepCard({ number, title, description, icon }: StepCardProps) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-zinc-100 p-6 shadow-sm sm:border-0 sm:p-0 sm:shadow-none">
      <div className="flex w-full items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0969DA] text-xs font-bold text-white">
          {number}
        </div>
        {icon}
      </div>
      <h3 className="text-base font-bold text-zinc-900">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}