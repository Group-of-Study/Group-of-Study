"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Goal } from "../types";
import type { GoalsController } from "../use-goals";

// Confirmação de "Excluir meta" (página do grupo e página /metas).
export function GoalDeleteDialog<T extends Goal>({ removal }: { removal: GoalsController<T>["removal"] }) {
    return (
        <Dialog
            open={removal.goal !== null}
            busy={removal.busy}
            onClose={removal.cancel}
            title="Excluir meta?"
            description={removal.goal ? `"${removal.goal.title}" some para todo o grupo. Isso não pode ser desfeito.` : undefined}
        >
            <div className="flex justify-end gap-2">
                <Button variant="ds-secondary" size="ds-md" onClick={removal.cancel} disabled={removal.busy}>
                    Cancelar
                </Button>
                <Button variant="danger" size="ds-md" onClick={removal.confirm} disabled={removal.busy}>
                    {removal.busy ? "Excluindo..." : "Excluir meta"}
                </Button>
            </div>
        </Dialog>
    );
}
