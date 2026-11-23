

import { UserRound } from "lucide-react";

export default function ProfileHeader() {
  return (
    <header className="mb-8">
      <p className="mb-2 flex items-center gap-2 text-overline uppercase text-text-brand">
        <UserRound size={15} />
        Minha conta
      </p>

      <h1 className="text-h1 text-text-primary">
        Meu perfil
      </h1>

      <p className="mt-2 text-body-md text-text-secondary">
        Visualize suas informações e sua participação na comunidade.
      </p>
    </header>
  );
}
