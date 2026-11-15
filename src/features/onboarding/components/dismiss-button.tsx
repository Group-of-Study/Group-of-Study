"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { dismissOnboardingAction } from "../actions";

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="ds-secondary" size="ds-sm" disabled={pending}>
            {pending ? "Salvando..." : label}
        </Button>
    );
}

// "Pular" (antes de completar) ou "Fechar" (depois): os dois salvam na conta.
export function DismissOnboardingButton({ label }: { label: string }) {
    return (
        <form action={dismissOnboardingAction}>
            <SubmitButton label={label} />
        </form>
    );
}
