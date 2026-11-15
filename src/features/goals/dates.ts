import type { Goal } from "./types";

// Regras de data das metas. Rodam no navegador, então "hoje" e "esta semana" usam o
// fuso de quem está vendo. As funções recebem `now` para os testes não dependerem do relógio.

const DAY_MS = 24 * 60 * 60 * 1000;

// Prazo só com o dia (sem horário) vale até o fim do dia: 23h59.
export const END_OF_DAY = "23:59";

export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// Semana de segunda a domingo, como no Figma (S T Q Q S S D).
export function weekRange(now: Date): { start: Date; end: Date } {
    const today = startOfDay(now);
    const daysSinceMonday = (today.getDay() + 6) % 7;
    const start = addDays(today, -daysSinceMonday);
    return { start, end: addDays(start, 7) };
}

function dayDiff(date: Date, now: Date): number {
    return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

function pad(value: number): string {
    return String(value).padStart(2, "0");
}

// "Sex", "Seg" (o Intl devolve "sex." em minúsculas).
function shortWeekday(date: Date): string {
    const name = weekday.format(date).replace(".", "");
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function dayMonth(date: Date, now: Date): string {
    const base = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
    return date.getFullYear() === now.getFullYear() ? base : `${base}/${date.getFullYear()}`;
}

// "19h", "19h30".
export function formatTime(date: Date): string {
    const minutes = date.getMinutes();
    return minutes === 0 ? `${date.getHours()}h` : `${date.getHours()}h${pad(minutes)}`;
}

// "Hoje", "Amanhã", "Ontem", "Sex, 24/10" (até 6 dias de distância) ou "24/10".
export function formatDay(date: Date, now: Date): string {
    const diff = dayDiff(date, now);
    if (diff === 0) return "Hoje";
    if (diff === 1) return "Amanhã";
    if (diff === -1) return "Ontem";
    if (Math.abs(diff) <= 6) return `${shortWeekday(date)}, ${dayMonth(date, now)}`;
    return dayMonth(date, now);
}

function isEndOfDay(date: Date): boolean {
    return date.getHours() === 23 && date.getMinutes() === 59;
}

export function isOverdue(goal: Goal, now: Date): boolean {
    return goal.status === "PENDING" && goal.dueDate !== null && new Date(goal.dueDate) < now;
}

// Texto do prazo na linha da meta: "Hoje, 19h", "Sex, 24/10", "Concluída ontem", "Sem prazo".
export function formatDueLabel(goal: Goal, now: Date): string {
    if (goal.status === "COMPLETED") {
        if (!goal.completedAt) return "Concluída";
        const completed = new Date(goal.completedAt);
        const day = formatDay(completed, now);
        return day === "Hoje" || day === "Ontem" ? `Concluída ${day.toLowerCase()}` : `Concluída em ${dayMonth(completed, now)}`;
    }
    if (!goal.dueDate) return "Sem prazo";
    const due = new Date(goal.dueDate);
    const label = isEndOfDay(due) ? formatDay(due, now) : `${formatDay(due, now)}, ${formatTime(due)}`;
    return isOverdue(goal, now) ? `Atrasada · ${label}` : label;
}

// Pendentes primeiro (prazo mais próximo antes; sem prazo no fim), depois as concluídas
// (a mais recente antes).
export function sortGoals(goals: Goal[]): Goal[] {
    const time = (value: string | null, fallback: number) => (value ? new Date(value).getTime() : fallback);
    return [...goals].sort((a, b) => {
        if (a.status !== b.status) return a.status === "PENDING" ? -1 : 1;
        if (a.status === "PENDING") {
            return (
                time(a.dueDate, Infinity) - time(b.dueDate, Infinity) ||
                time(b.createdAt, 0) - time(a.createdAt, 0)
            );
        }
        return time(b.completedAt, 0) - time(a.completedAt, 0);
    });
}

// "Metas da semana" da visão geral do grupo: pendentes com prazo até o fim da semana
// (inclui as atrasadas) e as concluídas desde segunda.
export function weekGoals(goals: Goal[], now: Date): Goal[] {
    const { start, end } = weekRange(now);
    return sortGoals(
        goals.filter((goal) =>
            goal.status === "PENDING"
                ? goal.dueDate !== null && new Date(goal.dueDate) < end
                : goal.completedAt !== null && new Date(goal.completedAt) >= start,
        ),
    );
}

// ---- Campos de data e hora do formulário (<input type="date"> e type="time") ----

export function toDateInputValue(iso: string | null): string {
    if (!iso) return "";
    const date = new Date(iso);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeInputValue(iso: string | null): string {
    if (!iso) return "";
    const date = new Date(iso);
    return isEndOfDay(date) ? "" : `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Dia + horário (no fuso de quem preenche) → ISO para a API. Sem dia, sem prazo.
export function combineDueDate(day: string, time: string): string | null {
    if (!day) return null;
    const [year, month, date] = day.split("-").map(Number);
    const [hours, minutes] = (time || END_OF_DAY).split(":").map(Number);
    return new Date(year, month - 1, date, hours, minutes).toISOString();
}
