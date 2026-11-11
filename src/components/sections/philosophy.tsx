export default function Philosophy() {
  return (
    <section id="gamificacao" className="w-full bg-[#0b0f17] py-16 text-white sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-6 md:px-12 lg:grid-cols-2">
       
        <div className="flex flex-col items-start gap-6 text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#60A5FA]">
            NOSSA FILOSOFIA
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
            A gamificação deve motivar, não pressionar.
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-lg">
            Cada pessoa tem seu ritmo, e todo progresso importa. Por isso o Group of Study tem:
          </p>

          <div className="mt-2 flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-blue-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                Dias de descanso que não quebram sua sequência
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-blue-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                Ranking opcional — você decide se aparece
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-blue-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                Modo foco para esconder XP quando precisar de calma
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-blue-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                Metas coletivas: o grupo inteiro ganha junto
              </span>
            </div>
          </div>
        </div>

    
        <div className="flex flex-col gap-4 text-zinc-900">
          <div className="rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h4 className="text-sm font-bold text-zinc-900">Constância</h4>
                <p className="text-[10px] text-zinc-600">88 dias com estudo nas últimas 19 semanas</p>
              </div>
              <span className="rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-500">
                Últimos meses
              </span>
            </div>

            <div className="mt-4 flex justify-between gap-1 overflow-x-auto pb-1">
              {Array.from({ length: 19 }).map((_, col) => (
                <div key={col} className="flex flex-col gap-1">
                  {Array.from({ length: 5 }).map((_, row) => {
                    const active = (col + row) % 3 === 0 || (col * row) % 5 === 0;
                    const level = (col + row) % 4;
                    return (
                      <div
                        key={row}
                        className={`h-3 w-3 rounded-sm ${
                          !active
                            ? "bg-zinc-100"
                            : level === 3
                            ? "bg-[#0969DA]"
                            : level === 2
                            ? "bg-blue-400"
                            : "bg-blue-200"
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-600">
              <span>Sequência atual: 12 dias · Recorde: 21 dias</span>
              <div className="flex items-center gap-1">
                <span>Menos</span>
                <span className="h-2 w-2 rounded-sm bg-zinc-100"></span>
                <span className="h-2 w-2 rounded-sm bg-blue-200"></span>
                <span className="h-2 w-2 rounded-sm bg-blue-400"></span>
                <span className="h-2 w-2 rounded-sm bg-[#0969DA]"></span>
                <span>Mais</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-5 text-center shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#0969DA] text-[#03499E]">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h5 className="mt-3 text-sm font-bold text-zinc-900">Sequência de 7</h5>
              <p className="text-[10px] text-zinc-600">7 dias seguidos de estudo.</p>
              <span className="mt-3 text-[10px] font-bold text-[#03499E]">Desbloqueada em 28/09</span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-5 text-center shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h5 className="mt-3 text-sm font-bold text-zinc-900">Mentor</h5>
              <p className="text-[10px] text-zinc-600">Ajude 10 colegas no mural.</p>
              <div className="mt-3 w-full px-2">
                <div className="h-1.5 w-full rounded-full bg-zinc-100">
                  <div className="h-1.5 w-[30%] rounded-full bg-[#0969DA]"></div>
                </div>
                <span className="mt-1 block text-[9px] text-zinc-600">3 de 10</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}