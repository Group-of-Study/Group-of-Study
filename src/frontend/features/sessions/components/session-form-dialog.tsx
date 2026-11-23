"use client";

import { Link2, MapPin } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/frontend/components/ui/button";
import { Dialog } from "@/frontend/components/ui/dialog";
import { TextAreaField } from "@/frontend/components/ui/text-area-field";
import { TextField } from "@/frontend/components/ui/text-field";
import { toDateInputValue } from "@/shared/features/goals/dates";
import type { ApiResult } from "@/frontend/lib/api-client";
import { combineDayAndTime, toTimeValue } from "@/shared/features/sessions/dates";
import { DESCRIPTION_MAX, LINK_MAX, LOCATION_MAX, sessionInputSchema, TITLE_MAX } from "@/shared/features/sessions/schema";
import type { StudySession, StudySessionInput } from "@/shared/features/sessions/types";

type Field = "title" | "description" | "startsAt" | "endsAt" | "location" | "link";
type FieldErrors = Partial<Record<Field, string>>;

const FIELDS: Field[] = ["title", "description", "startsAt", "endsAt", "location", "link"];

type SessionFormDialogProps = {
    open: boolean;
    // Sem encontro: marcar. Com encontro: editar.
    session?: StudySession | null;
    onClose: () => void;
    onSubmit: (input: StudySessionInput) => Promise<ApiResult<StudySession>>;
};

// Não há modal de agenda no Figma: segue o "Nova meta" (mesmo Dialog e campos).
export function SessionFormDialog({ open, session, onClose, onSubmit }: SessionFormDialogProps) {
    const [busy, setBusy] = useState(false);
    // A key remonta o formulário a cada abertura: os campos começam do zero (ou do encontro).
    const formKey = `${open}-${session?.id ?? "novo"}`;

    return (
        <Dialog
            open={open}
            busy={busy}
            onClose={onClose}
            title={session ? "Editar encontro" : "Marcar encontro"}
            description="Todo o grupo vê os encontros na agenda. Informe o local, o link ou os dois."
        >
            <SessionForm key={formKey} session={session ?? null} onBusyChange={setBusy} onCancel={onClose} onSubmit={onSubmit} />
        </Dialog>
    );
}

function SessionForm({
    session,
    onBusyChange,
    onCancel,
    onSubmit,
}: {
    session: StudySession | null;
    onBusyChange: (busy: boolean) => void;
    onCancel: () => void;
    onSubmit: SessionFormDialogProps["onSubmit"];
}) {
    const [title, setTitle] = useState(session?.title ?? "");
    const [day, setDay] = useState(session ? toDateInputValue(session.startsAt) : "");
    const [start, setStart] = useState(session ? toTimeValue(session.startsAt) : "");
    const [end, setEnd] = useState(session ? toTimeValue(session.endsAt) : "");
    const [location, setLocation] = useState(session?.location ?? "");
    const [link, setLink] = useState(session?.link ?? "");
    const [description, setDescription] = useState(session?.description ?? "");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    function buildInput(): StudySessionInput {
        return {
            title,
            description: description || null,
            startsAt: combineDayAndTime(day, start),
            // O fim é no mesmo dia do início; o schema avisa se ficar antes do início.
            endsAt: combineDayAndTime(day, end),
            location: location || null,
            link: link || null,
        };
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);
        const input = buildInput();

        // As mesmas regras da API (src/features/sessions/schema.ts), antes de enviar.
        const parsed = sessionInputSchema.safeParse(input);
        if (!parsed.success) {
            const found = z.flattenError(parsed.error).fieldErrors as Partial<Record<Field, string[]>>;
            setErrors(Object.fromEntries(FIELDS.flatMap((field) => (found[field] ? [[field, found[field][0]]] : []))));
            return;
        }
        setErrors({});

        setSaving(true);
        onBusyChange(true);
        const result = await onSubmit(input);
        setSaving(false);
        onBusyChange(false);
        if (result.ok) return; // quem abriu fecha o modal e atualiza a lista

        const fromApi: FieldErrors = {};
        for (const issue of result.issues ?? []) {
            if ((FIELDS as string[]).includes(issue.field)) fromApi[issue.field as Field] = issue.message;
        }
        setErrors(fromApi);
        if (Object.keys(fromApi).length === 0) setFormError(result.error);
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <TextField
                label="Encontro"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={TITLE_MAX}
                placeholder="Plantão de dúvidas"
                autoFocus
                required
                error={errors.title}
            />

            <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
                <TextField
                    label="Dia"
                    name="day"
                    type="date"
                    value={day}
                    onChange={(event) => setDay(event.target.value)}
                    required
                    error={errors.startsAt}
                />
                <TextField
                    label="Início"
                    name="start"
                    type="time"
                    value={start}
                    onChange={(event) => setStart(event.target.value)}
                    required
                />
                <TextField
                    label="Fim"
                    name="end"
                    type="time"
                    value={end}
                    onChange={(event) => setEnd(event.target.value)}
                    required
                    error={errors.endsAt}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                    label="Local"
                    name="location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    maxLength={LOCATION_MAX}
                    placeholder="Biblioteca, sala 3"
                    icon={<MapPin size={16} className="text-text-tertiary" aria-hidden />}
                    error={errors.location}
                />
                <TextField
                    label="Link"
                    name="link"
                    type="url"
                    inputMode="url"
                    value={link}
                    onChange={(event) => setLink(event.target.value)}
                    maxLength={LINK_MAX}
                    placeholder="https://meet.google.com/..."
                    icon={<Link2 size={16} className="text-text-tertiary" aria-hidden />}
                    error={errors.link}
                />
            </div>

            <TextAreaField
                label="Detalhes (opcional)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={DESCRIPTION_MAX}
                rows={3}
                placeholder="Lista 4, questões 5 a 9. Traga as dúvidas anotadas."
                error={errors.description}
            />

            {formError && (
                <p role="alert" className="rounded-md bg-bg-danger-subtle p-3 text-caption text-text-danger">
                    {formError}
                </p>
            )}

            <div className="flex justify-end gap-2 border-t border-border-default pt-4">
                <Button type="button" variant="ds-secondary" size="ds-md" onClick={onCancel} disabled={saving}>
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" size="ds-md" disabled={saving}>
                    {saving ? "Salvando..." : session ? "Salvar encontro" : "Marcar encontro"}
                </Button>
            </div>
        </form>
    );
}
