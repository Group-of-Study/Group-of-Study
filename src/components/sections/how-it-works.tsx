import SectionHeader from "@/components/landing/SectionHeader";
import StepCard from "@/components/landing/StepCard";

export default function HowItWorks() {
    return (
        <section id="como-funciona" className="mt-24 pt-10 text-center">
            <SectionHeader
                badge="COMO FUNCIONA"
                title="Três passos para estudar melhor em grupo"
                description="Sem planilha, sem grupo de mensagens perdido. Tudo o que o grupo precisa para manter o ritmo."
            />

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 text-left">
                <StepCard
                    number="1"
                    title="Crie ou entre em um grupo"
                    description="Grupos públicos ou privados por matéria, turma ou objetivo — como o ENEM ou a AV2."
                    icon={
                        <svg className="h-5 w-5 text-[#0969DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                />

                <StepCard
                    number="2"
                    title="Definam metas e desafios"
                    description="Metas semanais pequenas e desafios com prazo. Cada um sabe o que fazer e quando."
                    icon={
                        <svg className="h-5 w-5 text-[#0969DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />

                <StepCard
                    number="3"
                    title="Evoluam juntos"
                    description="Ganhe XP, suba de nível e desbloqueie conquistas. O progresso do grupo é de todo mundo."
                    icon={
                        <svg className="h-5 w-5 text-[#0969DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    }
                />
            </div>
        </section>
    );
}