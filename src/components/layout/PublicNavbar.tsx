import Link from "next/link";
import Button from "@/components/ui/button";

export default function PublicNavbar() {
  return (
    <header className="w-full bg-white px-6 py-4 border-b border-zinc-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0969DA] text-white">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="12" r="4" />
              <circle cx="15" cy="12" r="4" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight text-zinc-900">
            Group of Study
          </span>
        </Link>

        {/* Links Centrais */}
        <nav className="hidden items-center gap-8 text-xs font-medium text-zinc-500 md:flex">
          <Link
            href="#como-funciona"
            className="transition-colors hover:text-zinc-900"
          >
            Como funciona
          </Link>
          <Link
            href="#recursos"
            className="transition-colors hover:text-zinc-900"
          >
            Recursos
          </Link>
          <Link
            href="#gamificacao"
            className="transition-colors hover:text-zinc-900"
          >
            Gamificação
          </Link>
          <Link
            href="#sobre"
            className="transition-colors hover:text-zinc-900"
          >
            Sobre
          </Link>
        </nav>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-semibold text-zinc-700">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm" className="px-4 font-semibold">
              Criar conta
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}