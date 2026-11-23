import Image from "next/image";

// Ícones dos campos (Leading icon do Input no Figma), 18px.
function FieldIcon({ src }: { src: string }) {
    return <Image src={src} width={18} height={18} alt="" className="shrink-0" />;
}

export function UserIcon() {
    return <FieldIcon src="/icons/user.svg" />;
}

export function MailIcon() {
    return <FieldIcon src="/icons/mail.svg" />;
}

export function LockIcon() {
    return <FieldIcon src="/icons/lock.svg" />;
}
