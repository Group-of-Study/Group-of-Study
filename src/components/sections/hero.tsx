import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";

export default function Hero() {
    return (
        <section className="grid grid-cols-1 items-center gap-10 pt-2 lg:grid-cols-2 lg:gap-12">

            <div className="flex flex-col items-center text-center lg:items-start lg:text-left gap-4 sm:gap-5">
                <Badge variant="info" className="text-[11px] sm:text-xs">
                    ✦ Em desenvolvimento - entre na lista do beta
                </Badge>

                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl leading-[1.15]">
                    Aprender juntos. <br />
                    <span className="text-[#03499E]">Evoluir juntos.</span>
                </h1>

                <p className="max-w-lg text-sm sm:text-base leading-relaxed text-zinc-500">
                    O Group of Study junta grupos de estudo, metas e gamificação num lugar
                    só. Organize o que estudar com seus colegas, acompanhe o progresso de
                    todo mundo e ganhe XP a cada passo — no seu ritmo.
                </p>

                <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-1">
                    <Button
                        variant="primary"
                        size="md"
                        className="w-full sm:w-auto justify-center px-5 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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

                    <Button
                        variant="secondary"
                        size="md"
                        className="w-full sm:w-auto justify-center px-5 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    >
                        Já tenho conta
                    </Button>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-2">
                    <div className="flex -space-x-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-[#03499E] ring-2 ring-white">
                            AN
                        </span>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-600 ring-2 ring-white">
                            GB
                        </span>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-800 ring-2 ring-white">
                            TS
                        </span>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-800 ring-2 ring-white">
                            ED
                        </span>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-zinc-600 ring-2 ring-white">
                            +4
                        </span>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-600">
                        Feito por estudantes, para estudantes.
                    </span>
                </div>
            </div>


            <div className="relative w-full rounded-3xl bg-blue-50/50 p-6 sm:p-8">


                <div className="rounded-2xl bg-[#0e1217] p-5 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0969DA] text-lg font-bold">
                            7
                        </div>
                        <div className="text-left">
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-300">
                                SEU NÍVEL
                            </span>
                            <h3 className="text-lg font-bold">Nível 7 · Explorador</h3>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="mb-1.5 flex justify-between text-xs font-medium text-zinc-300">
                            <span>1.240 / 1.500 XP</span>
                            <span>83%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800">
                            <div className="h-2 w-[83%] rounded-full bg-[#0969DA]"></div>
                        </div>
                    </div>

                    <p className="mt-3 text-[11px] text-zinc-300 text-left">
                        Faltam 260 XP para o nível 8 · Mentor. Conclua 2 metas para chegar lá!
                    </p>
                </div>

                <div className="mt-4 flex flex-col gap-3">

                    <div className="flex items-center justify-between gap-2 rounded-xl bg-white/90 p-3 shadow-sm border border-zinc-100/60">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked
                                readOnly
                                className="h-4 w-4 shrink-0 rounded bg-[#0969DA] accent-[#0969DA]"
                                aria-label="Item concluído" 
                            />
                            <div className="text-left">
                                <p className="text-xs font-medium text-zinc-500 line-through">
                                    Assistir aula 6 — Present Perfect
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-600 mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                        Inglês para TI
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Concluída às 10h
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                                ✓ +15 XP
                            </span>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-[#03499E]">
                                MA
                            </span>
                        </div>
                    </div>

                    <div className="ml-6 flex items-center justify-between gap-2 rounded-xl bg-white p-3.5 shadow-sm border border-zinc-100">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                readOnly
                                className="h-4 w-4 shrink-0 rounded border-zinc-300"
                                aria-label="Item concluído"
                            />
                            <div className="text-left">
                                <p className="text-xs font-bold text-zinc-800">
                                    Resolver a lista 4 de derivadas
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-600 mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                        Cálculo I — Turma B
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Hoje, 19h
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#03499E]">
                                ⚡ +30 XP
                            </span>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-[#03499E]">
                                MA
                            </span>
                        </div>
                    </div>

                    {/* Item 3: Ranking (Mais Indentada) */}
                    <div className="ml-12 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm border border-zinc-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded border border-zinc-200 text-xs font-bold text-zinc-600">
                                3
                            </span>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-[#03499E]">
                                MA
                            </span>
                            <div className="text-left">
                                <p className="text-xs font-bold text-zinc-800">Você</p>
                                <p className="text-[9px] text-zinc-600">Nível 7</p>
                            </div>
                        </div>

                        <span className="text-xs font-bold text-zinc-800">340 XP</span>
                    </div>

                </div>


                <div className="absolute -bottom-4 right-4 flex items-center gap-3 rounded-xl bg-[#0e1217] px-4 py-2.5 text-white shadow-2xl">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0969DA] text-xs font-bold text-white">
                        ✦
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold">+15 XP!</p>
                        <p className="text-[9px] text-zinc-300">Sequência de 12 dias mantida</p>
                    </div>
                </div>

            </div>

        </section>
    );
}