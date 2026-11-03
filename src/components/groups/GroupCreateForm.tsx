
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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
        setFormError("O grupo foi criado, mas não foi possível identificá-lo.");
        return;
      }

      router.push(`/grupos/${result.data.id}`);
    } catch {
      setFormError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-default bg-bg-surface p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6">
        <h2 className="text-h3 text-text-primary">
          Informações do grupo
        </h2>

        <p className="mt-2 text-body-sm text-text-secondary">
          Preencha os dados para criar seu grupo de estudos.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-border-danger bg-bg-danger-subtle p-4 text-body-sm text-text-danger"
        >
          {formError}
        </div>
      )}

      <div className="mb-5">
        <label
          htmlFor="name"
          className="mb-2 block text-label-md text-text-primary"
        >
          Nome do grupo *
        </label>

        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          placeholder="Ex.: Grupo de estudos de programação"
          maxLength={80}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className="w-full rounded-xl border border-border-default bg-bg-canvas px-4 py-3 text-body-md text-text-primary outline-none transition focus:border-border-brand focus:ring-2 focus:ring-border-brand/20"
        />

        <div className="mt-2 flex justify-between gap-3">
          {errors.name ? (
            <p id="name-error" role="alert" className="text-body-sm text-text-danger">
              {errors.name}
            </p>
          ) : (
            <p className="text-body-sm text-text-secondary">
              Mínimo de 3 e máximo de 80 caracteres.
            </p>
          )}

          <span className="shrink-0 text-body-sm text-text-secondary">
            {name.length}/80
          </span>
        </div>
      </div>

      <div className="mb-5">
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
          placeholder="Conte um pouco sobre os objetivos do grupo..."
          rows={4}
          maxLength={500}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description ? "description-error" : undefined
          }
          className="w-full resize-none rounded-xl border border-border-default bg-bg-canvas px-4 py-3 text-body-md text-text-primary outline-none transition focus:border-border-brand focus:ring-2 focus:ring-border-brand/20"
        />

        <div className="mt-2 flex justify-between gap-3">
          {errors.description ? (
            <p
              id="description-error"
              role="alert"
              className="text-body-sm text-text-danger"
            >
              {errors.description}
            </p>
          ) : (
            <p className="text-body-sm text-text-secondary">
              Campo opcional.
            </p>
          )}

          <span className="shrink-0 text-body-sm text-text-secondary">
            {description.length}/500
          </span>
        </div>
      </div>

      <div className="mb-8">
        <label
          htmlFor="visibility"
          className="mb-2 block text-label-md text-text-primary"
        >
          Visibilidade
        </label>

        <select
          id="visibility"
          name="visibility"
          value={visibility}
          onChange={(event) => {
            setVisibility(event.target.value);
            setErrors((current) => ({
              ...current,
              visibility: undefined,
            }));
          }}
          className="w-full rounded-xl border border-border-default bg-bg-canvas px-4 py-3 text-body-md text-text-primary outline-none transition focus:border-border-brand focus:ring-2 focus:ring-border-brand/20"
        >
          <option value="PUBLIC">Público</option>
          <option value="PRIVATE">Privado</option>
        </select>

        {errors.visibility && (
          <p role="alert" className="mt-2 text-body-sm text-text-danger">
            {errors.visibility}
          </p>
        )}

        <p className="mt-2 text-body-sm text-text-secondary">
          Grupos públicos podem ser encontrados por outros usuários.
          Grupos privados ficam restritos aos participantes.
        </p>
      </div>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
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
    </form>
  );
}
