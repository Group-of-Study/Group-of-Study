import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-28 border-t border-zinc-100 bg-white pt-12 pb-8 text-left">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="flex flex-col items-start gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0969DA] text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="9" cy="12" r="4" />
                  <circle cx="15" cy="12" r="4" />
                </svg>
              </div>
              <span className="text-base font-bold tracking-tight text-zinc-900">
                Group of Study
              </span>
            </Link>
            <p className="text-xs text-zinc-400">
              Aprender juntos. Evoluir juntos.
            </p>
          </div>

          {/* Nav Columns */}
          <div className="grid grid-cols-2 gap-8 text-xs sm:grid-cols-3 md:gap-16">
            <div className="flex flex-col gap-2.5">
              <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                PRODUTO
              </span>
              <Link href="#recursos" className="text-zinc-600 hover:text-zinc-900">Recursos</Link>
              <Link href="#como-funciona" className="text-zinc-600 hover:text-zinc-900">Como funciona</Link>
              <Link href="#gamificacao" className="text-zinc-600 hover:text-zinc-900">Gamificação</Link>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                PROJETO
              </span>
              <Link href="#sobre" className="text-zinc-600 hover:text-zinc-900">Sobre</Link>
              <Link href="#sobre" className="text-zinc-600 hover:text-zinc-900">Valores</Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-zinc-900">GitHub</a>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                CONTA
              </span>
              <Link href="/login" className="text-zinc-600 hover:text-zinc-900">Entrar</Link>
              <Link href="/cadastro" className="text-zinc-600 hover:text-zinc-900">Criar conta</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-100 pt-6 text-[11px] text-zinc-400 sm:flex-row">
          <p>© 2026 Group of Study — Seu progresso, nossa jornada.</p>
          <p>Feito por Matheus, Miguel, Gabriel, Eduardo e Talys</p>
        </div>
      </div>
    </footer>
  );
}