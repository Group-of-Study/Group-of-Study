
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
    <>
      <button
        type="button"
        onClick={() => router.push("/grupos")}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-text-brand"
      >
        <ArrowLeft size={17} />
        Voltar para grupos
      </button>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-border-default bg-bg-surface shadow-sm"
      >
        <div className="space-y-8 p-6 sm:p-9">
          {/* Erro geral */}
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-border-danger bg-bg-danger-subtle p-4 text-sm text-text-danger"
            >
              <Info className="mt-0.5 shrink-0" size={18} />
              <p>{formError}</p>
            </div>
          )}

          {/* Informações básicas */}
          <section>
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-bg-brand-subtle text-text-brand">
                  <BookOpen size={17} />
                </div>

                <h2 className="text-h3 text-text-primary">
                  Informações básicas
                </h2>
              </div>

              <p className="mt-2 text-body-sm text-text-secondary">
                Comece definindo a identidade do seu grupo.
              </p>
            </div>

            {/* Nome */}
            <div className="mb-6">
              <label
                htmlFor="name"
                className="mb-2 block text-label-md text-text-primary"
              >
                Nome do grupo <span className="text-text-danger">*</span>
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
                className={`w-full rounded-xl border bg-bg-subtle px-4 py-3.5 text-body-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:bg-bg-surface focus:ring-4 focus:ring-border-focus/20 ${
                  errors.name
                    ? "border-border-danger focus:border-border-danger"
                    : "border-border-default focus:border-border-focus"
                }`}
              />

              <div className="mt-2 flex justify-between gap-3">
                {errors.name ? (
                  <p
                    id="name-error"
                    role="alert"
                    className="text-caption text-text-danger"
                  >
                    {errors.name}
                  </p>
                ) : (
                  <p
                    id="name-help"
                    className="text-caption text-text-tertiary"
                  >
                    Escolha um nome que represente seu grupo.
                  </p>
                )}

                <span className="shrink-0 text-caption text-text-tertiary">
                  {name.length}/80
                </span>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-label-md text-text-primary"
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
                className={`w-full resize-none rounded-xl border bg-bg-subtle px-4 py-3.5 text-body-sm leading-6 text-text-primary outline-none transition placeholder:text-text-tertiary focus:bg-bg-surface focus:ring-4 focus:ring-border-focus/20 ${
                  errors.description
                    ? "border-border-danger focus:border-border-danger"
                    : "border-border-default focus:border-border-focus"
                }`}
              />

              <div className="mt-2 flex justify-between gap-3">
                {errors.description ? (
                  <p
                    id="description-error"
                    role="alert"
                    className="text-caption text-text-danger"
                  >
                    {errors.description}
                  </p>
                ) : (
                  <p
                    id="description-help"
                    className="text-caption text-text-tertiary"
                  >
                    Explique o propósito do grupo. Campo opcional.
                  </p>
                )}

                <span className="shrink-0 text-caption text-text-tertiary">
                  {description.length}/500
                </span>
              </div>
            </div>
          </section>

          <div className="border-t border-border-subtle" />

          {/* Visibilidade */}
          <section>
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-bg-brand-subtle text-text-brand">
                  <Users size={17} />
                </div>

                <h2 className="text-h3 text-text-primary">
                  Privacidade do grupo
                </h2>
              </div>

              <p className="mt-2 text-body-sm text-text-secondary">
                Escolha quem poderá encontrar e participar do seu grupo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Público */}
              <label
                className={`relative flex cursor-pointer flex-col rounded-2xl border p-5 transition ${
                  visibility === "PUBLIC"
                    ? "border-border-brand bg-bg-brand-subtle ring-2 ring-border-brand/20"
                    : "border-border-default bg-bg-surface hover:border-border-strong"
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
                  <div className="flex size-11 items-center justify-center rounded-xl bg-bg-brand-subtle text-text-brand">
                    <Globe size={22} />
                  </div>

                  <span
                    className={`size-5 rounded-full border-2 ${
                      visibility === "PUBLIC"
                        ? "border-bg-brand bg-bg-brand ring-2 ring-bg-surface ring-inset"
                        : "border-border-strong"
                    }`}
                  />
                </div>

                <span className="font-semibold text-text-primary">
                  Público
                </span>

                <span className="mt-2 text-body-sm leading-6 text-text-secondary">
                  Qualquer usuário pode encontrar o grupo e solicitar
                  participação.
                </span>
              </label>

              {/* Privado */}
              <label
                className={`relative flex cursor-pointer flex-col rounded-2xl border p-5 transition ${
                  visibility === "PRIVATE"
                    ? "border-border-brand bg-bg-brand-subtle ring-2 ring-border-brand/20"
                    : "border-border-default bg-bg-surface hover:border-border-strong"
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
                  <div className="flex size-11 items-center justify-center rounded-xl bg-bg-muted text-text-secondary">
                    <LockKeyhole size={22} />
                  </div>

                  <span
                    className={`size-5 rounded-full border-2 ${
                      visibility === "PRIVATE"
                        ? "border-bg-brand bg-bg-brand ring-2 ring-bg-surface ring-inset"
                        : "border-border-strong"
                    }`}
                  />
                </div>

                <span className="font-semibold text-text-primary">
                  Privado
                </span>

                <span className="mt-2 text-body-sm leading-6 text-text-secondary">
                  O grupo fica restrito aos participantes autorizados.
                </span>
              </label>
            </div>

            {errors.visibility && (
              <p role="alert" className="mt-2 text-caption text-text-danger">
                {errors.visibility}
              </p>
            )}

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-bg-info-subtle p-4">
              <Info
                className="mt-0.5 shrink-0 text-text-info"
                size={18}
              />

              <p className="text-caption leading-5 text-text-info">
                Você poderá escolher a visibilidade do grupo durante
                a criação. Grupos privados não ficam disponíveis na
                listagem pública.
              </p>
            </div>
          </section>

          {/* Botões */}
          <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:justify-end">
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

      <p className="mt-5 text-center text-caption text-text-tertiary">
        Ao criar o grupo, você será definido como seu primeiro líder e participante.
      </p>
    </>
  );
}
