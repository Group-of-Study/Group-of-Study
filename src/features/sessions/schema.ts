import { z } from "zod";

// Validação de um encontro da agenda (GOS-042). Usada pela API (POST e PATCH recebem o
// encontro inteiro) e pelo formulário da tela, para os dois darem as mesmas mensagens.

export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 1000;
export const LOCATION_MAX = 200;
export const LINK_MAX = 500;
export const MAX_DURATION_HOURS = 12;

const HOUR_MS = 60 * 60 * 1000;

// Campo de texto opcional: vazio (ou só espaços) vira null.
function optionalText(max: number, message: string) {
    return z.preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? null : value),
        z.string().trim().max(max, message).nullable().default(null),
    );
}

const linkField = z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z
        .url({ protocol: /^https?$/, error: "Use um link que comece com http:// ou https://" })
        .max(LINK_MAX, `Use no máximo ${LINK_MAX} caracteres`)
        .nullable()
        .default(null),
);

const dateField = (label: string) => z.coerce.date({ error: `Informe ${label}` });

export const sessionInputSchema = z
    .object({
        title: z
            .string({ error: "Dê um nome ao encontro" })
            .trim()
            .min(1, "Dê um nome ao encontro")
            .max(TITLE_MAX, `Use no máximo ${TITLE_MAX} caracteres`),
        description: optionalText(DESCRIPTION_MAX, `Use no máximo ${DESCRIPTION_MAX} caracteres`),
        startsAt: dateField("o início"),
        endsAt: dateField("o fim"),
        location: optionalText(LOCATION_MAX, `Use no máximo ${LOCATION_MAX} caracteres`),
        link: linkField,
    })
    .strict()
    .superRefine((data, ctx) => {
        if (data.endsAt <= data.startsAt) {
            ctx.addIssue({ code: "custom", path: ["endsAt"], message: "O fim precisa ser depois do início" });
        } else if (data.endsAt.getTime() - data.startsAt.getTime() > MAX_DURATION_HOURS * HOUR_MS) {
            ctx.addIssue({
                code: "custom",
                path: ["endsAt"],
                message: `Um encontro dura no máximo ${MAX_DURATION_HOURS} horas`,
            });
        }
        // Não dá para marcar (nem remarcar para) um encontro que já acabou.
        if (data.endsAt <= new Date()) {
            ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Esse horário já passou" });
        }
        if (!data.location && !data.link) {
            ctx.addIssue({ code: "custom", path: ["location"], message: "Informe o local, o link ou os dois" });
        }
    });

export type SessionInput = z.input<typeof sessionInputSchema>;
export type ParsedSessionInput = z.output<typeof sessionInputSchema>;

// Formato de erro de validação da API: [{ field, message }] (docs/auth.md).
export function toIssues(error: z.ZodError): { field: string; message: string }[] {
    return error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
}
