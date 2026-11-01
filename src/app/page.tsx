import PublicNavbar from "@/components/layout/PublicNavbar";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* 1. Navbar */}
      <PublicNavbar />

      {/* 2. Hero Section */}
      <main className="mx-auto max-w-7xl px-6 py-12 md:px-12 lg:py-16">
        <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          
          {/* Lado Esquerdo: Conteúdo */}
          <div className="flex flex-col items-start gap-5">
            <Badge variant="info">
              ✦ Em desenvolvimento - entre na lista do beta
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Aprender juntos. <br />
              <span className="text-[#0969DA]">Evoluir juntos.</span>
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-zinc-600 sm:text-lg">
              O Group of Study junta grupos de estudo, metas e gamificação num
              lugar só. Organize o que estudar com seus colegas, acompanhe o
              progresso de todo mundo e ganhe XP a cada passo — no seu ritmo.
            </p>

            {/* Botões CTA */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                className="px-5 py-2.5 font-semibold"
                icon={
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                }
              >
                Criar conta grátis
              </Button>

              <Button variant="secondary" size="md" className="px-5 py-2.5 font-semibold">
                Já tenho conta
              </Button>
            </div>

            {/* Prova social (Avatares) */}
            <div className="flex items-center gap-3 pt-3">
              <div className="flex -space-x-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-[#0969DA] ring-2 ring-white">
                  AN
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600 ring-2 ring-white">
                  GB
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600 ring-2 ring-white">
                  TS
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-600 ring-2 ring-white">
                  ED
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 ring-2 ring-white">
                  +4
                </span>
              </div>
              <span className="text-xs font-medium text-zinc-500">
                Feito por estudantes, para estudantes.
              </span>
            </div>
          </div>

          {/* Lado Direito: Preview de Gamificação */}
          <div className="relative w-full max-w-lg justify-self-center rounded-2xl bg-blue-50/50 p-6 sm:p-8">
            
            {/* Card Nível */}
            <div className="rounded-xl bg-zinc-900 p-5 text-white shadow-xl">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0969DA] text-lg font-bold">
                  7
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Seu Nível
                  </span>
                  <h3 className="text-lg font-bold">Nível 7 · Explorador</h3>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs font-medium text-zinc-400">
                  <span>1.240 / 1.500 XP</span>
                  <span>83%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800">
                  <div className="h-2 w-[83%] rounded-full bg-[#0969DA]"></div>
                </div>
              </div>

              <p className="mt-3 text-xs text-zinc-400">
                Faltam 260 XP para o nível 8 · Mentor. Conclua 2 metas para chegar lá!
              </p>
            </div>

            {/* Metas / Tarefas */}
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    className="h-4 w-4 rounded accent-[#0969DA]"
                  />
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 line-through">
                      Assistir aula 6 — Present Perfect
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Inglês para TI · Concluída às 10h
                    </p>
                  </div>
                </div>
                <Badge variant="success">+15 XP</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    readOnly
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <div>
                    <p className="text-xs font-semibold text-zinc-800">
                      Resolver a lista 4 de derivadas
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Cálculo I — Turma B · Hoje, 19h
                    </p>
                  </div>
                </div>
                <Badge variant="info">+30 XP</Badge>
              </div>
            </div>

            {/* Popup XP Mantido */}
            <div className="absolute -bottom-3 right-4 flex items-center gap-3 rounded-lg bg-zinc-900 px-4 py-2.5 text-white shadow-2xl">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0969DA]">
                ✦
              </div>
              <div>
                <p className="text-xs font-bold">+15 XP!</p>
                <p className="text-[10px] text-zinc-400">Sequência de 12 dias mantida</p>
              </div>
            </div>

          </div>

        </section>
      </main>
    </div>
  );
}