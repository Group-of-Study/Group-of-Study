// Depois de uma Server Action o React limpa o formulário. Para a pessoa não
// redigitar tudo após um erro, a action devolve os valores e os campos usam
// como defaultValue. Só passam os campos listados: senha nunca volta.
export function pickFormValues(formData: FormData, fields: readonly string[]): Record<string, string> {
    const values: Record<string, string> = {};
    for (const field of fields) {
        const value = formData.get(field);
        if (typeof value === "string") {
            values[field] = value;
        }
    }
    return values;
}
