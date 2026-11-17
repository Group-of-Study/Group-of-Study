"use client";

import { Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextAreaField } from "@/components/ui/text-area-field";
import { TextField } from "@/components/ui/text-field";
import type { ApiResult } from "@/lib/api-client";
import { combineDueDate, toDateInputValue, toTimeInputValue } from "../dates";
import type { Goal, GoalInput } from "../types";

// Mesmos limites do zod das rotas de metas.
export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 1000;

export type GoalGroupOption = { id: string; name: string };

type FieldErrors = Partial<Record<"title" | "description" | "dueDate" | "groupId", string>>;

type GoalFormDialogProps = {
    open: boolean;
    // Sem meta: criar. Com meta: editar.
    goal?: Goal | null;
    // Na página /metas a pessoa escolhe o grupo; dentro do grupo, o grupo já é o da página.
    groups?: GoalGroupOption[];
    defaultGroupId?: string;
    onClose: () => void;
    onSubmit: (input: GoalInput, groupId: string | undefined) => Promise<ApiResult<Goal>>;
};

// Figma: Metas — Nova meta (modal). "Recompensa" (XP) e "Meta coletiva" ficam de fora
// até a gamificação existir (GOS-044).
export function GoalFormDialog({ open, goal, groups, defaultGroupId, onClose, onSubmit }: GoalFormDialogProps) {
    const editing = Boolean(goal);
    // A key remonta o formulário a cada abertura: os campos começam do zero (ou da meta).
    const formKey = `${open}-${goal?.id ?? "nova"}`;
    const [busy, setBusy] = useState(false);

    return (
        <Dialog
            open={open}
            busy={busy}
            onClose={onClose}
            title={editing ? "Editar meta" : "Nova meta"}
            description="Defina um passo concreto. Metas do grupo aparecem para todos os membros."
        >
            <GoalForm
                key={formKey}
                goal={goal ?? null}
                groups={groups}
                defaultGroupId={defaultGroupId}
                onBusyChange={setBusy}
                onCancel={onClose}
                onSubmit={onSubmit}
            />
        </Dialog>
    );
}

function GoalForm({
    goal,
    groups,
    defaultGroupId,
    onBusyChange,
    onCancel,
    onSubmit,
}: {
    goal: Goal | null;
    groups?: GoalGroupOption[];
    defaultGroupId?: string;
    onBusyChange: (busy: boolean) => void;
    onCancel: () => void;
    onSubmit: GoalFormDialogProps["onSubmit"];
}) {
    const [title, setTitle] = useState(goal?.title ?? "");
    const [groupId, setGroupId] = useState(defaultGroupId ?? groups?.[0]?.id ?? "");
    const [day, setDay] = useState(toDateInputValue(goal?.dueDate ?? null));
    const [time, setTime] = useState(toTimeInputValue(goal?.dueDate ?? null));
    const [description, setDescription] = useState(goal?.description ?? "");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    function validate(): FieldErrors {
        const found: FieldErrors = {};
        const trimmed = title.trim();
        if (!trimmed) found.title = "Escreva o que vocês vão fazer";
        else if (trimmed.length > TITLE_MAX) found.title = `Use no máximo ${TITLE_MAX} caracteres`;
        if (description.trim().length > DESCRIPTION_MAX) {
            found.description = `Use no máximo ${DESCRIPTION_MAX} caracteres`;
        }
        if (time && !day) found.dueDate = "Escolha o dia do prazo";
        if (groups && !groupId) found.groupId = "Escolha o grupo";
        return found;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);
        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setSaving(true);
        onBusyChange(true);
        const result = await onSubmit(
            {
                title: title.trim(),
                description: description.trim() || null,
                dueDate: combineDueDate(day, time),
            },
            groups ? groupId : undefined,
        );
        setSaving(false);
        onBusyChange(false);

        if (result.ok) return; // quem abriu fecha o modal e atualiza a lista
        // Erros de campo da API (zod) vão para o campo; o resto, para o aviso do formulário.
        const fromApi: FieldErrors = {};
        for (const issue of result.issues ?? []) {
            if (issue.field === "title" || issue.field === "description" || issue.field === "dueDate") {
                fromApi[issue.field] = issue.message;
            }
        }
        setErrors(fromApi);
        if (Object.keys(fromApi).length === 0) setFormError(result.error);
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <TextField
                label="O que vocês vão fazer?"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={TITLE_MAX}
                placeholder="Resolver a lista 5 — integrais"
                autoFocus
                required
                error={errors.title}
            />

            {groups && (
                <SelectField
                    label="Grupo"
                    value={groupId}
                    onChange={setGroupId}
                    options={groups}
                    error={errors.groupId}
                    // Editar não muda a meta de grupo (a API não permite).
                    disabled={Boolean(goal)}
                />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                    label="Prazo (dia)"
                    name="dueDay"
                    type="date"
                    value={day}
                    onChange={(event) => setDay(event.target.value)}
                    error={errors.dueDate}
                    helper="Opcional"
                />
                <TextField
                    label="Horário"
                    name="dueTime"
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    helper="Sem horário, vale até o fim do dia"
                />
            </div>

            <TextAreaField
                label="Detalhes (opcional)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={DESCRIPTION_MAX}
                placeholder="Questões 1 a 12. Quem terminar posta a resolução no mural."
                error={errors.description}
            />

            <p className="flex items-start gap-2 rounded-md bg-bg-info-subtle p-3 text-caption text-text-info">
                <Sparkles size={16} aria-hidden className="mt-px shrink-0" />
                Metas menores e frequentes funcionam melhor que metas gigantes. Cada passo conta!
            </p>

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
                    {saving ? "Salvando..." : goal ? "Salvar meta" : "Criar meta"}
                </Button>
            </div>
        </form>
    );
}

// Mesmo visual do TextField (rótulo, borda, foco, erro), para o <select>.
const FIELD_BOX =
    "w-full rounded-md border bg-bg-surface px-3 text-body-sm text-foreground outline-none placeholder:text-text-tertiary disabled:bg-bg-subtle disabled:text-text-disabled";

function fieldBorder(error?: string): string {
    return error
        ? "border-border-danger"
        : "border-border-default focus:border-[1.5px] focus:border-border-brand focus:shadow-focus";
}

function SelectField({
    label,
    value,
    onChange,
    options,
    error,
    disabled,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: GoalGroupOption[];
    error?: string;
    disabled?: boolean;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-label-sm text-foreground">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                className={`h-11 ${FIELD_BOX} ${fieldBorder(error)}`}
            >
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>
            {error && <span className="text-caption text-text-danger">{error}</span>}
        </label>
    );
}
