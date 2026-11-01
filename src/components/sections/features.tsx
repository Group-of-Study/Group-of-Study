import SectionHeader from "@/components/landing/SectionHeader";
import FeatureCard from "@/components/landing/FeatureCard";

export default function Features() {
  return (
    <section id="recursos" className="mt-20 pt-6 text-left">
      <SectionHeader
        badge="RECURSOS"
        title="Tudo que o seu grupo precisa"
        className="items-start text-left"
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title="Grupos de estudo"
          description="Públicos ou privados, com convites."
          icon={
            <svg className="h-5 w-5 text-[#0969DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        <FeatureCard
          title="Metas e atividades"
          description="Com prazo, responsável e XP."
          icon={
            <svg className="h-5 w-5 text-[#0969DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
            </svg>
          }
        />

        <FeatureCard
          title="XP e níveis"
          description="Veja sua evolução semana a semana."
          icon={
            <svg className="h-5 w-5 text-[#0969DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <FeatureCard
          title="Desafios"
          description="Um gás extra antes da prova."
          icon={
            <svg className="h-5 w-5 text-[#0969DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          }
        />

        <FeatureCard
          title="Conquistas"
          description="Constância, colaboração e marcos."
          icon={
            <svg className="h-5 w-5 text-[#0969DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
        />

        <FeatureCard
          title="Progresso coletivo"
          description="Metas do grupo e ranking opcional."
          icon={
            <svg className="h-5 w-5 text-[#0969DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>
    </section>
  );
}