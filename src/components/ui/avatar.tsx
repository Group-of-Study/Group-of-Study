// Primeira letra do primeiro e do último nome: "Miguel Andrade" → "MA".
export function getInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        return "?";
    }
    const first = Array.from(words[0])[0];
    const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : "";
    return `${first}${last}`.toLocaleUpperCase("pt-BR");
}

// Figma: Components › Avatar (Size=lg). Por enquanto só as iniciais; a foto
// entra na página de perfil (GOS-039).
export function Avatar({ name, className = "" }: { name: string; className?: string }) {
    return (
        <span
            aria-hidden
            className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-bg-brand-subtle text-h4 text-text-brand ${className}`}
        >
            {getInitials(name)}
        </span>
    );
}
