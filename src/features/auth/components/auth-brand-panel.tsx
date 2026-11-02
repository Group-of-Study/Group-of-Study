import Image from "next/image";
import Link from "next/link";
import { LogoMark } from "@/components/ui/logo-mark";

const HIGHLIGHTS = [
    { icon: "/icons/users.svg", text: "Grupos de estudo com metas semanais" },
    { icon: "/icons/zap.svg", text: "XP, níveis e conquistas a cada passo" },
    { icon: "/icons/heart.svg", text: "No seu ritmo — sem pressão" },
];

// Figma: BrandPanel (desktop) e Brand (mobile) das telas de Login e Cadastro.
export function AuthBrandPanel() {
    return (
        <aside className="flex flex-col gap-3.5 px-6 pt-6 pb-7 text-text-inverse lg:sticky lg:top-0 lg:h-dvh lg:w-150 lg:shrink-0 lg:gap-6 lg:p-16">
            <Link
                href="/"
                aria-label="Group of Study, ir para a página inicial"
                className="flex w-fit items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-focus"
            >
                <LogoMark className="size-10 lg:size-8" />
                <span className="hidden text-h4 lg:inline">Group of Study</span>
            </Link>

            <p className="text-h1 lg:mt-auto lg:text-display-lg">
                Aprender juntos.
                <br />
                <span className="text-bg-accent">Evoluir juntos.</span>
            </p>

            <ul className="hidden flex-col gap-6 lg:flex">
                {HIGHLIGHTS.map((item) => (
                    <li key={item.text} className="flex items-center gap-3">
                        <Image src={item.icon} width={20} height={20} alt="" />
                        <span className="text-body-md opacity-85">{item.text}</span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
