import { formatDay, formatTime, toDateInputValue } from "@/features/goals/dates";
import type { StudySession } from "./types";

// Datas dos encontros na tela. Como nas metas, rodam no navegador (fuso de quem vê)
// e recebem `now` para os testes não dependerem do relógio. Reaproveitam os rótulos
// das metas ("Hoje", "Sex, 24/10", "19h30").

const month = new Intl.DateTimeFormat("pt-BR", { month: "short" });

function pad(value: number): string {
    return String(value).padStart(2, "0");
}

export function isOngoing(session: StudySession, now: Date): boolean {
    return new Date(session.startsAt) <= now && now < new Date(session.endsAt);
}

// "Hoje · 19h–20h30", "Qui, 20/11 · 19h–20h30", "Acontecendo agora · até 20h30".
export function formatSessionWhen(session: StudySession, now: Date): string {
    const start = new Date(session.startsAt);
    const end = new Date(session.endsAt);
    if (isOngoing(session, now)) return `Acontecendo agora · até ${formatTime(end)}`;
    const sameDay = toDateInputValue(session.startsAt) === toDateInputValue(session.endsAt);
    const range = sameDay
        ? `${formatTime(start)}–${formatTime(end)}`
        : `${formatTime(start)} até ${formatDay(end, now).toLowerCase()}, ${formatTime(end)}`;
    return `${formatDay(start, now)} · ${range}`;
}

// Selo do calendário: { month: "NOV", day: "20" }.
export function sessionBadge(session: StudySession): { month: string; day: string } {
    const start = new Date(session.startsAt);
    return { month: month.format(start).replace(".", "").toUpperCase(), day: String(start.getDate()) };
}

// ---- Formulário: dia + horário de início + horário de fim (no fuso de quem preenche) ----

export function toTimeValue(iso: string): string {
    const date = new Date(iso);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Campos vazios viram texto vazio: o schema responde "Informe o início/o fim".
export function combineDayAndTime(day: string, time: string): string {
    if (!day || !time) return "";
    const [year, monthIndex, date] = day.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    return new Date(year, monthIndex - 1, date, hours, minutes).toISOString();
}
