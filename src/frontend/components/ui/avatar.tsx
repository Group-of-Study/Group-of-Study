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

// Figma: Components › Avatar. lg é o padrão; sm é o das linhas de meta (Metas). Por
// enquanto só as iniciais; a foto entra na página de perfil (GOS-039).
const SIZES = {
    sm: "size-7 text-caption font-semibold",
    lg: "size-12 text-h4",
} as const;

export function Avatar({
    name,
    size = "lg",
    className = "",
}: {
    name: string;
    size?: keyof typeof SIZES;
    className?: string;
}) {
    return (
        <span
            aria-hidden
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-bg-brand-subtle text-text-brand ${SIZES[size]} ${className}`}
        >
            {getInitials(name)}
        </span>
    );
}
