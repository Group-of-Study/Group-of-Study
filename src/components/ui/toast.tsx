"use client";

import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { ApiResult } from "@/lib/api-client";
import { addToast, removeToast, TOAST_DURATION_MS, type ToastItem, type ToastTone } from "./toast-queue";

type ToastApi = {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    // Para o retorno do fetchApi: erro mostra a mensagem da API; sucesso só mostra
    // algo se `success` for passado (nem toda ação precisa de aviso).
    fromResult: (result: ApiResult<unknown>, messages?: { success?: string }) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

type Action = { type: "add"; toast: ToastItem } | { type: "remove"; id: number };

function reducer(list: ToastItem[], action: Action): ToastItem[] {
    return action.type === "add" ? addToast(list, action.toast) : removeToast(list, action.id);
}

// Fica no layout raiz; qualquer Client Component usa com useToast().
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, dispatch] = useReducer(reducer, []);
    const nextId = useRef(1);

    const show = useCallback((tone: ToastTone, title: string, description?: string) => {
        dispatch({ type: "add", toast: { id: nextId.current++, tone, title, description } });
    }, []);
    const dismiss = useCallback((id: number) => dispatch({ type: "remove", id }), []);

    const api = useMemo<ToastApi>(
        () => ({
            success: (title, description) => show("success", title, description),
            error: (title, description) => show("error", title, description),
            fromResult: (result, messages) => {
                if (!result.ok) {
                    show("error", result.error);
                } else if (messages?.success) {
                    show("success", messages.success);
                }
            },
        }),
        [show],
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            {/* Sempre na página, para leitores de tela anunciarem os toasts que chegam. */}
            <div
                aria-live="polite"
                aria-label="Notificações"
                role="region"
                className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
            >
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastApi {
    const api = useContext(ToastContext);
    if (!api) {
        throw new Error("useToast precisa estar dentro do <ToastProvider> (src/app/layout.tsx).");
    }
    return api;
}

// Figma: Components › Toast (fundo escuro, ícone num círculo, título e descrição).
function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS[toast.tone]);
        return () => clearTimeout(timer);
    }, [toast.id, toast.tone, onDismiss]);

    const isError = toast.tone === "error";

    return (
        <div
            role={isError ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg bg-bg-inverse px-4 py-3 shadow-lg"
        >
            <span
                aria-hidden
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-label-md text-text-on-brand ${
                    isError ? "bg-bg-danger" : "bg-bg-brand"
                }`}
            >
                {/* Provisório no erro: o Figma ainda não tem ícone de alerta. */}
                {isError ? "!" : <Image src="/icons/check.svg" width={14} height={14} alt="" />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-label-md text-text-inverse">{toast.title}</p>
                {toast.description && <p className="text-caption text-text-disabled">{toast.description}</p>}
            </div>
            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Fechar notificação"
                className="-mr-1 flex size-6 shrink-0 items-center justify-center rounded-sm text-body-md text-text-disabled hover:text-text-inverse focus-visible:outline-2 focus-visible:outline-border-focus"
            >
                ×
            </button>
        </div>
    );
}
