import Link from "next/link";

type AuthSwitchLinkProps = {
    question: string;
    label: string;
    href: string;
    className?: string;
};

// "Ainda não tem conta? Criar conta" / "Já tem conta? Entrar".
export function AuthSwitchLink({ question, label, href, className = "" }: AuthSwitchLinkProps) {
    return (
        <p className={`flex justify-center gap-1.5 text-body-sm text-text-secondary ${className}`}>
            {question}
            <Link
                href={href}
                className="rounded-sm text-label-md text-text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            >
                {label}
            </Link>
        </p>
    );
}
