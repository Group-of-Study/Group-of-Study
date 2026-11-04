
"use client";

import Button from "@/components/ui/button";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function GroupConfirmationDialog({
  open,
  title,
  message,
  confirmLabel,
  loading = false,
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-confirmation-title"
        aria-describedby="group-confirmation-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          id="group-confirmation-title"
          className="text-lg font-semibold text-zinc-900"
        >
          {title}
        </h2>

        <p
          id="group-confirmation-description"
          className="mt-3 text-sm leading-6 text-zinc-600"
        >
          {message}
        </p>

        <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button
            variant="ds-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Aguarde..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
