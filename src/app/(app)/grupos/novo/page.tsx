
import GroupCreateForm from "@/components/groups/GroupCreateForm";

export default function NewGroupPage() {
  return (
    <main className="min-h-screen bg-bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <header className="mb-8">
          <p className="mb-2 text-overline uppercase text-text-brand">
            Comunidade
          </p>

          <h1 className="text-h1 text-text-primary">
            Criar grupo
          </h1>

          <p className="mt-2 text-body-md text-text-secondary">
            Crie um espaço para compartilhar conhecimento e estudar
            com outras pessoas.
          </p>
        </header>

        <GroupCreateForm />
      </div>
    </main>
  );
}
