// Carregamento das páginas do app (as que exigem login). Aparece enquanto a página
// espera dados fora de um <Suspense> próprio. O Figma não tem tela de carregamento:
// blocos cinza no lugar do título e do conteúdo.
export default function Loading() {
    return (
        <main aria-busy className="mx-auto flex w-full max-w-278 flex-1 flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
            <p role="status" className="sr-only">
                Carregando…
            </p>
            <div aria-hidden className="flex flex-col gap-2">
                <div className="h-8 w-48 rounded-md bg-bg-subtle motion-safe:animate-pulse" />
                <div className="h-5 w-72 max-w-full rounded-md bg-bg-subtle motion-safe:animate-pulse" />
            </div>
            <div aria-hidden className="flex flex-col gap-6 lg:max-w-190">
                <div className="h-64 rounded-xl bg-bg-subtle motion-safe:animate-pulse" />
                <div className="h-40 rounded-xl bg-bg-subtle motion-safe:animate-pulse" />
            </div>
        </main>
    );
}
