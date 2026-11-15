"use client";

import { CalendarDays, ChevronRight, Clock, History, MapPin, Pencil, Plus, RefreshCw, Trash2, Video } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import type { GroupDetails } from "@/types/group";
import { formatSessionWhen, isOngoing, sessionBadge } from "../dates";
import type { StudySession } from "../types";
import type { GroupSessionsController } from "../use-group-sessions";
import { SessionFormDialog } from "./session-form-dialog";

// Agenda na página do grupo (GOS-042): o card "Próximo encontro" da visão geral
// (Figma: Grupo — Visão geral) e a aba "Agenda". Regras iguais às da API:
// participantes veem; só o líder marca, edita e exclui, com o grupo ativo.

type AgendaProps = {
    controller: GroupSessionsController;
    group: GroupDetails;
    isMember: boolean;
    isLeader: boolean;
};

// "Agora" fixo enquanto a página está aberta.
function useNow(): Date {
    const [now] = useState(() => new Date());
    return now;
}

// "meet.google.com" em vez do link inteiro.
function linkHost(link: string): string {
    try {
        return new URL(link).host.replace(/^www\./, "");
    } catch {
        return link;
    }
}

function DateBadge({ session }: { session: StudySession }) {
    const { month, day } = sessionBadge(session);
    return (
        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-bg-brand-subtle text-text-brand">
            <span className="text-caption font-semibold">{month}</span>
            <span className="text-h3 leading-none">{day}</span>
        </div>
    );
}

function SessionPlace({ session }: { session: StudySession }) {
    return (
        <>
            {session.location && (
                <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} aria-hidden className="shrink-0" />
                    {session.location}
                </span>
            )}
            {session.link && (
                <a
                    href={session.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-text-brand hover:underline"
                >
                    <Video size={14} aria-hidden className="shrink-0" />
                    {linkHost(session.link)}
                    <span className="sr-only">(abre em outra aba)</span>
                </a>
            )}
        </>
    );
}

function SessionCard({
    session,
    now,
    canManage,
    controller,
}: {
    session: StudySession;
    now: Date;
    canManage: boolean;
    controller: GroupSessionsController;
}) {
    const ongoing = isOngoing(session, now);
    const ended = new Date(session.endsAt) <= now;

    return (
        <li className="flex gap-4 rounded-xl border border-border-default bg-bg-surface p-4">
            <DateBadge session={session} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start gap-2">
                    <h3 className="min-w-0 flex-1 text-label-md text-foreground">{session.title}</h3>
                    {canManage && (
                        <div className="-mt-1 flex shrink-0">
                            {/* Encontro que já aconteceu não é editado (a API recusa), só excluído. */}
                            {!ended && (
                                <IconButton label={`Editar o encontro "${session.title}"`} onClick={() => controller.form.openEdit(session)}>
                                    <Pencil size={16} aria-hidden />
                                </IconButton>
                            )}
                            <IconButton label={`Excluir o encontro "${session.title}"`} onClick={() => controller.removal.ask(session)}>
                                <Trash2 size={16} aria-hidden />
                            </IconButton>
                        </div>
                    )}
                </div>
                <p className={`inline-flex items-center gap-1.5 text-body-sm ${ongoing ? "text-text-success" : "text-text-secondary"}`}>
                    <Clock size={14} aria-hidden className="shrink-0" />
                    {formatSessionWhen(session, now)}
                </p>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-text-secondary">
                    <SessionPlace session={session} />
                </p>
                {session.description && <p className="mt-1 whitespace-pre-line text-body-sm text-foreground">{session.description}</p>}
                <p className="text-caption text-text-tertiary">Marcado por {session.createdBy?.name ?? "Conta excluída"}</p>
            </div>
        </li>
    );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className="rounded-sm p-1.5 text-text-tertiary hover:bg-bg-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-border-focus"
        >
            {children}
        </button>
    );
}

function NewSessionButton({ controller, size = "ds-md" }: { controller: GroupSessionsController; size?: "ds-sm" | "ds-md" }) {
    return (
        <Button variant="primary" size={size} onClick={controller.form.openCreate} leadingIcon={<Plus size={16} aria-hidden />}>
            Marcar encontro
        </Button>
    );
}

// Card "Próximo encontro" da visão geral (coluna da direita).
export function NextSessionCard({ controller, group, isMember, isLeader, onSeeAgenda }: AgendaProps & { onSeeAgenda: () => void }) {
    const now = useNow();
    const canManage = isLeader && group.status === "ACTIVE";
    const next = controller.sessions[0];

    let body: React.ReactNode;
    if (!isMember || controller.state === "forbidden") {
        body = <p className="text-body-sm text-text-secondary">Entre no grupo para ver a agenda de encontros.</p>;
    } else if (controller.state === "loading") {
        body = <div aria-hidden className="h-20 rounded-lg bg-bg-subtle motion-safe:animate-pulse" />;
    } else if (controller.state === "error") {
        body = <p className="text-body-sm text-text-secondary">Não foi possível carregar a agenda.</p>;
    } else if (!next) {
        body = (
            <div className="flex flex-col items-start gap-3">
                <p className="text-body-sm text-text-secondary">Nenhum encontro marcado.</p>
                {canManage && <NewSessionButton controller={controller} size="ds-sm" />}
            </div>
        );
    } else {
        body = (
            <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                    <DateBadge session={next} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="text-label-md text-foreground">{next.title}</p>
                        <p className={`text-body-sm ${isOngoing(next, now) ? "text-text-success" : "text-text-secondary"}`}>
                            {formatSessionWhen(next, now)}
                        </p>
                        <p className="flex flex-wrap gap-x-3 gap-y-1 text-caption text-text-secondary">
                            <SessionPlace session={next} />
                        </p>
                    </div>
                </div>
                {next.link && (
                    <a
                        href={next.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border-default bg-bg-surface text-label-md text-foreground hover:bg-bg-subtle"
                    >
                        <Video size={16} aria-hidden />
                        Entrar no link
                    </a>
                )}
            </div>
        );
    }

    return (
        <section aria-labelledby="proximo-encontro-titulo" className="flex flex-col gap-4 rounded-2xl border border-border-default bg-bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 id="proximo-encontro-titulo" className="font-bold text-text-primary">
                    Próximo encontro
                </h2>
                {isMember && controller.state === "ready" && (
                    <button
                        type="button"
                        onClick={onSeeAgenda}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-text-brand hover:underline"
                    >
                        Ver agenda
                        <ChevronRight size={15} aria-hidden />
                    </button>
                )}
            </div>
            {body}
        </section>
    );
}

// Aba "Agenda": próximos encontros e, sob demanda, os anteriores.
export function GroupAgendaTab({ controller, group, isMember, isLeader }: AgendaProps) {
    const now = useNow();
    const active = group.status === "ACTIVE";
    const canManage = isLeader && active;
    const ready = isMember && controller.state === "ready";

    return (
        <section aria-labelledby="agenda-titulo" className="flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 id="agenda-titulo" className="text-h3 text-foreground">
                        Agenda do grupo
                    </h2>
                    <p className="mt-1 text-body-sm text-text-secondary">
                        {!active
                            ? "O grupo não está ativo: a agenda fica só para consulta."
                            : isLeader
                              ? "Marque os encontros do grupo: plantões, revisões, leituras em dupla."
                              : "Encontros marcados pelo líder do grupo."}
                    </p>
                </div>
                {ready && canManage && <NewSessionButton controller={controller} />}
            </header>

            {!isMember || controller.state === "forbidden" ? (
                <EmptyState
                    icon={<CalendarDays size={28} className="text-text-brand" aria-hidden />}
                    title="A agenda é só para participantes"
                    description="Entre no grupo para ver os encontros marcados."
                />
            ) : controller.state === "loading" ? (
                <div aria-hidden className="flex flex-col gap-2">
                    {[0, 1].map((item) => (
                        <div key={item} className="h-24 rounded-xl bg-bg-subtle motion-safe:animate-pulse" />
                    ))}
                </div>
            ) : controller.state === "error" ? (
                <EmptyState
                    icon={<CalendarDays size={28} className="text-text-brand" aria-hidden />}
                    title="Não foi possível carregar a agenda"
                    description={controller.error ?? "Tente novamente."}
                >
                    <Button variant="ds-secondary" size="ds-md" onClick={controller.reload} leadingIcon={<RefreshCw size={16} aria-hidden />}>
                        Tentar novamente
                    </Button>
                </EmptyState>
            ) : controller.sessions.length === 0 ? (
                <EmptyState
                    icon={<CalendarDays size={28} className="text-text-brand" aria-hidden />}
                    title="Nenhum encontro marcado"
                    description={
                        canManage
                            ? "Marque o primeiro encontro: um plantão de dúvidas ou uma revisão para a prova."
                            : "Quando o líder marcar um encontro, ele aparece aqui."
                    }
                >
                    {canManage && <NewSessionButton controller={controller} />}
                </EmptyState>
            ) : (
                <ul className="flex flex-col gap-3">
                    {controller.sessions.map((session) => (
                        <SessionCard key={session.id} session={session} now={now} canManage={canManage} controller={controller} />
                    ))}
                </ul>
            )}

            {ready && (
                <div className="flex flex-col gap-3">
                    {controller.past === null ? (
                        <Button
                            variant="ds-secondary"
                            size="ds-md"
                            className="self-start"
                            onClick={controller.loadPast}
                            disabled={controller.pastLoading}
                            leadingIcon={<History size={16} aria-hidden />}
                        >
                            {controller.pastLoading ? "Carregando..." : "Ver encontros anteriores"}
                        </Button>
                    ) : (
                        <>
                            <h3 className="text-label-md text-foreground">Encontros anteriores</h3>
                            {controller.past.length === 0 ? (
                                <p className="text-body-sm text-text-secondary">Nenhum encontro anterior.</p>
                            ) : (
                                <ul className="flex flex-col gap-3 opacity-80">
                                    {controller.past.map((session) => (
                                        <SessionCard key={session.id} session={session} now={now} canManage={canManage} controller={controller} />
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            )}
        </section>
    );
}

// Modais de marcar/editar e de confirmar a exclusão (uma vez por página).
export function GroupSessionDialogs({ controller }: { controller: GroupSessionsController }) {
    const { form, removal } = controller;

    return (
        <>
            <SessionFormDialog open={form.open} session={form.editing} onClose={form.close} onSubmit={form.submit} />
            <Dialog
                open={removal.session !== null}
                busy={removal.busy}
                onClose={removal.cancel}
                title="Excluir encontro?"
                description={
                    removal.session ? `"${removal.session.title}" some da agenda de todo o grupo.` : undefined
                }
            >
                <div className="flex justify-end gap-2">
                    <Button variant="ds-secondary" size="ds-md" onClick={removal.cancel} disabled={removal.busy}>
                        Cancelar
                    </Button>
                    <Button variant="danger" size="ds-md" onClick={removal.confirm} disabled={removal.busy}>
                        {removal.busy ? "Excluindo..." : "Excluir encontro"}
                    </Button>
                </div>
            </Dialog>
        </>
    );
}
