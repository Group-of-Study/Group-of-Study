
import Image from "next/image";

type ProfileAvatarProps = {
  name: string;
  image: string | null;
};

export default function ProfileAvatar({
  name,
  image,
}: ProfileAvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-brand-subtle text-2xl font-bold text-text-brand">
      {image ? (
        <Image
          src={image}
          alt={`Avatar de ${name}`}
          width={96}
          height={96}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
