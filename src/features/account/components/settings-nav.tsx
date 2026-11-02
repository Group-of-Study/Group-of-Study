"use client";

import { useSyncExternalStore } from "react";

// Figma: SubNav (App / 10 · Configurações). Só as seções que já existem; Gamificação,
// Notificações e Privacidade entram junto com as funcionalidades.
const ITEMS = [
    { href: "#perfil", label: "Perfil", icon: "/icons/nav-user.svg" },
    { href: "#conta", label: "Conta e segurança", icon: "/icons/nav-lock.svg" },
] as const;

function subscribe(onChange: () => void) {
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
}

// Sem # na URL, a primeira seção fica ativa (também no HTML do servidor).
const getHash = () => window.location.hash || ITEMS[0].href;
const getServerHash = () => ITEMS[0].href;

export function SettingsNav() {
    const hash = useSyncExternalStore(subscribe, getHash, getServerHash);

    return (
        <nav aria-label="Seções das configurações" className="hidden w-55 shrink-0 lg:sticky lg:top-8 lg:block">
            <ul className="flex flex-col gap-1">
                {ITEMS.map((item) => {
                    const active = item.href === hash;
                    return (
                        <li key={item.href}>
                            <a
                                href={item.href}
                                aria-current={active ? "location" : undefined}
                                className={`flex h-10 items-center gap-3 rounded-md px-3 text-label-md focus-visible:outline-2 focus-visible:outline-border-focus ${
                                    active ? "bg-bg-brand-subtle text-text-brand" : "text-text-secondary hover:bg-bg-subtle"
                                }`}
                            >
                                {/* O SVG do Figma vira máscara: a cor vem do texto (ativo ou não). */}
                                <span
                                    aria-hidden
                                    className={`size-5 shrink-0 bg-current ${active ? "" : "text-text-tertiary"}`}
                                    style={{
                                        maskImage: `url(${item.icon})`,
                                        maskSize: "contain",
                                        maskRepeat: "no-repeat",
                                        maskPosition: "center",
                                    }}
                                />
                                {item.label}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
