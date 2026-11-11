import Button from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="mt-28">
      <div className="flex flex-col items-center rounded-[2rem] bg-[#f0f6ff]/80 border border-[#0969DA]/30 px-6 py-16 text-center sm:py-20 shadow-sm">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-[52px] leading-tight">
          Seu progresso, nossa jornada.
        </h2>
        
        <p className="mt-4 text-sm font-normal text-zinc-500 sm:text-base tracking-wide">
          Junte seu grupo e comece hoje — é grátis.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto justify-center px-5 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"

            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            }
          >
            Criar conta grátis
          </Button>

          <button
            type="button"
            className="w-full sm:w-auto text-sm font-bold text-zinc-900 hover:text-[#03499E] transition-colors py-2 px-3"
          >
            Ver como funciona
          </button>
        </div>
      </div>
    </section>
  );
}