"use client"; // error.tsx precisa ser Client Component

import { RouteError } from "@/components/feedback/route-error";

// Erro inesperado em qualquer página (não cobre o layout raiz: isso é o global-error.tsx).
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
    return <RouteError error={error} retry={retry} />;
}
