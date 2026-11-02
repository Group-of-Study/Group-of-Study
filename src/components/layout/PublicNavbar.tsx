"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";

export default function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full  bg-white px-4 py-3.5 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
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

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 text-xs font-medium text-zinc-500 md:flex">
          <Link href="#como-funciona" className="transition-colors hover:text-zinc-900">
            Como funciona
          </Link>
          <Link href="#recursos" className="transition-colors hover:text-zinc-900">
            Recursos
          </Link>
          <Link href="#gamificacao" className="transition-colors hover:text-zinc-900">
            Gamificação
          </Link>
          <Link href="#sobre" className="transition-colors hover:text-zinc-900">
            Sobre
          </Link>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden items-center gap-2 md:flex">
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

        {/* Mobile Header Right */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/login">
            <Button variant="primary" size="sm" className="px-3.5 py-1.5 text-xs font-semibold">
              Entrar
            </Button>
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 focus:outline-none"
            aria-label="Menu"
          >
            {isOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Dropdown Mobile Links */}
      {isOpen && (
        <nav className="mt-3 flex flex-col gap-3 border-t border-zinc-100 pt-3 md:hidden">
          <Link
            href="#como-funciona"
            className="px-2 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            onClick={() => setIsOpen(false)}
          >
            Como funciona
          </Link>
          <Link
            href="#recursos"
            className="px-2 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            onClick={() => setIsOpen(false)}
          >
            Recursos
          </Link>
          <Link
            href="#gamificacao"
            className="px-2 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            onClick={() => setIsOpen(false)}
          >
            Gamificação
          </Link>
          <Link
            href="#sobre"
            className="px-2 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            onClick={() => setIsOpen(false)}
          >
            Sobre
          </Link>
        </nav>
      )}
    </header>
  );
}