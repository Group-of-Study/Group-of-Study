
export default function GroupEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-bg-subtle px-6 py-16 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-bg-brand-subtle text-text-brand">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="size-8"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m16-10a4 4 0 0 1 4 4v2m-8-14a4 4 0 1 1 0 8m-6-8a4 4 0 1 1 0 8"
          />
        </svg>
      </div>

      <h2 className="text-h3 text-text-primary">
        Nenhum grupo encontrado
      </h2>

      <p className="mt-2 max-w-md text-body-sm text-text-secondary">
        Ainda não existem grupos de estudo disponíveis.
        Que tal voltar mais tarde?
      </p>
    </div>
  );
}
