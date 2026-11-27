import { Alert } from "@/frontend/components/ui/alert";
import type { AccountFormState } from "@/shared/features/account/form-state";

// Erro geral ou sucesso de um formulário de configurações (erros de campo ficam nos campos).
export function FormFeedback({ state }: { state: AccountFormState }) {
    if (state.error) {
        return <Alert tone="danger">{state.error}</Alert>;
    }
    if (state.success) {
        return <Alert tone="success">{state.success}</Alert>;
    }
    return null;
}
