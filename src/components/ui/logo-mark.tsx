import Image from "next/image";

// Figma: Components › Logo/Mark.
export function LogoMark({ className = "" }: { className?: string }) {
    return <Image src="/brand/logo-mark.svg" width={32} height={32} alt="" className={className} loading="eager" />;
}
