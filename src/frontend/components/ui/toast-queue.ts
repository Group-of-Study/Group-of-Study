export type ToastTone = "success" | "error";

export type ToastItem = {
    id: number;
    tone: ToastTone;
    title: string;
    description?: string;
};

// No máximo 3 na tela: o mais antigo sai quando chega um novo.
export const MAX_TOASTS = 3;

// Erro fica mais tempo, para dar tempo de ler (e tem botão de fechar).
export const TOAST_DURATION_MS: Record<ToastTone, number> = {
    success: 5000,
    error: 8000,
};

export function addToast(list: ToastItem[], toast: ToastItem): ToastItem[] {
    return [...list, toast].slice(-MAX_TOASTS);
}

export function removeToast(list: ToastItem[], id: number): ToastItem[] {
    return list.filter((toast) => toast.id !== id);
}
