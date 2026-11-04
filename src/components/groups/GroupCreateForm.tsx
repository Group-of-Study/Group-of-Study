
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  BookOpen,
  Globe,
  Info,
  LockKeyhole,
  Users,
} from "lucide-react";

import Button from "@/components/ui/button";

type FieldErrors = {
  name?: string;
  description?: string;
  visibility?: string;
};

type ApiIssue = {
  path: string;
  message: string;
};

type CreateGroupResponse = {
  data?: {
    id: string;
  };
  error?: string;
  issues?: ApiIssue[];
};

export default function GroupCreateForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors({});
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    const newErrors: FieldErrors = {};

    if (trimmedName.length < 3) {
      newErrors.name = "O nome deve ter pelo menos 3 caracteres.";
    } else if (trimmedName.length > 80) {
      newErrors.name = "O nome deve ter no máximo 80 caracteres.";
    }

    if (trimmedDescription.length > 500) {
      newErrors.description =
        "A descrição deve ter no máximo 500 caracteres.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/groups", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription || null,
          visibility,
        }),
      });

      const result = (await response.json()) as CreateGroupResponse;

      if (!response.ok) {
        const apiErrors: FieldErrors = {};

        result.issues?.forEach((issue) => {
          if (
            issue.path === "name" ||
            issue.path === "description" ||
            issue.path === "visibility"
          ) {
            apiErrors[issue.path] = issue.message;
          }
        });

        setErrors(apiErrors);

        if (Object.keys(apiErrors).length === 0) {
          setFormError(
            result.error || "Não foi possível criar o grupo.",
          );
        }

        return;
      }

      if (!result.data?.id) {
        setFormError(
          "O grupo foi criado, mas não foi possível identificá-lo.",
        );
        return;
      }

      router.push(`/grupos/${result.data.id}`);
    } catch {
      setFormError(
        "Não foi possível conectar ao servidor. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/grupos")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-blue-900"
        >
          <ArrowLeft size={17} />
          Voltar para grupos
        </button>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
        >
          {/* Cabeçalho */}
          <div className="relative overflow-hidden bg-[#14294f] px-6 py-8 text-white sm:px-9 sm:py-10">
            <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full border-[35px] border-white/5" />

            <div className="relative z-10">
              <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-white/10 text-blue-100">
                <BookOpen size={28} />
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                Comunidade de aprendizagem
              </span>

              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Crie seu grupo de estudos
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80 sm:text-base">
                Reúna pessoas com os mesmos objetivos, compartilhe
                conhecimentos e evoluam juntos.
              </p>
            </div>
          </div>

          <div className="space-y-8 p-6 sm:p-9">
            {/* Erro geral */}
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <Info className="mt-0.5 shrink-0" size={18} />
                <p>{formError}</p>
              </div>
            )}

            {/* Informações básicas */}
            <section>
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                    <BookOpen size={17} />
                  </div>

                  <h2 className="text-base font-bold text-zinc-900">
                    Informações básicas
                  </h2>
                </div>

                <p className="mt-2 text-sm text-zinc-500">
                  Comece definindo a identidade do seu grupo.
                </p>
              </div>

              {/* Nome */}
              <div className="mb-6">
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-zinc-800"
                >
                  Nome do grupo <span className="text-red-500">*</span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      name: undefined,
                    }));
                  }}
                  placeholder="Ex.: Grupo de estudos de programação"
                  maxLength={80}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "name-error" : "name-help"
                  }
                  className={`w-full rounded-xl border bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:bg-white focus:ring-4 focus:ring-blue-900/5 ${
                    errors.name
                      ? "border-red-400 focus:border-red-400"
                      : "border-zinc-200 focus:border-blue-800"
                  }`}
                />

                <div className="mt-2 flex justify-between gap-3">
                  {errors.name ? (
                    <p
                      id="name-error"
                      role="alert"
                      className="text-xs text-red-600"
                    >
                      {errors.name}
                    </p>
                  ) : (
                    <p
                      id="name-help"
                      className="text-xs text-zinc-400"
                    >
                      Escolha um nome que represente seu grupo.
                    </p>
                  )}

                  <span className="shrink-0 text-xs text-zinc-400">
                    {name.length}/80
                  </span>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-zinc-800"
                >
                  Descrição
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      description: undefined,
                    }));
                  }}
                  placeholder="Conte um pouco sobre os objetivos, assuntos e atividades do grupo..."
                  rows={5}
                  maxLength={500}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description
                      ? "description-error"
                      : "description-help"
                  }
                  className={`w-full resize-none rounded-xl border bg-zinc-50 px-4 py-3.5 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:bg-white focus:ring-4 focus:ring-blue-900/5 ${
                    errors.description
                      ? "border-red-400 focus:border-red-400"
                      : "border-zinc-200 focus:border-blue-800"
                  }`}
                />

                <div className="mt-2 flex justify-between gap-3">
                  {errors.description ? (
                    <p
                      id="description-error"
                      role="alert"
                      className="text-xs text-red-600"
                    >
                      {errors.description}
                    </p>
                  ) : (
                    <p
                      id="description-help"
                      className="text-xs text-zinc-400"
                    >
                      Explique o propósito do grupo. Campo opcional.
                    </p>
                  )}

                  <span className="shrink-0 text-xs text-zinc-400">
                    {description.length}/500
                  </span>
                </div>
              </div>
            </section>

            <div className="border-t border-zinc-100" />

            {/* Visibilidade */}
            <section>
              <div className="mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                    <Users size={17} />
                  </div>

                  <h2 className="text-base font-bold text-zinc-900">
                    Privacidade do grupo
                  </h2>
                </div>

                <p className="mt-2 text-sm text-zinc-500">
                  Escolha quem poderá encontrar e participar do seu grupo.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Público */}
                <label
                  className={`relative flex cursor-pointer flex-col rounded-2xl border p-5 transition ${
                    visibility === "PUBLIC"
                      ? "border-blue-800 bg-blue-50/60 ring-2 ring-blue-800/10"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="PUBLIC"
                    checked={visibility === "PUBLIC"}
                    onChange={() => {
                      setVisibility("PUBLIC");
                      setErrors((current) => ({
                        ...current,
                        visibility: undefined,
                      }));
                    }}
                    className="sr-only"
                  />

                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                      <Globe size={22} />
                    </div>

                    <span
                      className={`size-5 rounded-full border-2 ${
                        visibility === "PUBLIC"
                          ? "border-blue-800 bg-blue-800 shadow-[inset_0_0_0_4px_white]"
                          : "border-zinc-300"
                      }`}
                    />
                  </div>

                  <span className="font-semibold text-zinc-900">
                    Público
                  </span>

                  <span className="mt-2 text-sm leading-6 text-zinc-500">
                    Qualquer usuário pode encontrar o grupo e solicitar
                    participação.
                  </span>
                </label>

                {/* Privado */}
                <label
                  className={`relative flex cursor-pointer flex-col rounded-2xl border p-5 transition ${
                    visibility === "PRIVATE"
                      ? "border-blue-800 bg-blue-50/60 ring-2 ring-blue-800/10"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="PRIVATE"
                    checked={visibility === "PRIVATE"}
                    onChange={() => {
                      setVisibility("PRIVATE");
                      setErrors((current) => ({
                        ...current,
                        visibility: undefined,
                      }));
                    }}
                    className="sr-only"
                  />

                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                      <LockKeyhole size={22} />
                    </div>

                    <span
                      className={`size-5 rounded-full border-2 ${
                        visibility === "PRIVATE"
                          ? "border-blue-800 bg-blue-800 shadow-[inset_0_0_0_4px_white]"
                          : "border-zinc-300"
                      }`}
                    />
                  </div>

                  <span className="font-semibold text-zinc-900">
                    Privado
                  </span>

                  <span className="mt-2 text-sm leading-6 text-zinc-500">
                    O grupo fica restrito aos participantes autorizados.
                  </span>
                </label>
              </div>

              {errors.visibility && (
                <p role="alert" className="mt-2 text-xs text-red-600">
                  {errors.visibility}
                </p>
              )}

              <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50 p-4">
                <Info
                  className="mt-0.5 shrink-0 text-blue-800"
                  size={18}
                />

                <p className="text-xs leading-5 text-blue-900">
                  Você poderá escolher a visibilidade do grupo durante
                  a criação. Grupos privados não ficam disponíveis na
                  listagem pública.
                </p>
              </div>
            </section>

            {/* Botões */}
            <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:justify-end">
              <Button
                variant="ds-secondary"
                type="button"
                disabled={loading}
                onClick={() => router.push("/grupos")}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={loading}>
                {loading ? "Criando grupo..." : "Criar grupo"}
              </Button>
            </div>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-400">
          Ao criar o grupo, você será definido como seu primeiro líder e participante.
        </p>
      </div>
    </main>
  );
}
