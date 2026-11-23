import type { Metadata } from "next";
import { Suspense } from "react";
import { getCallbackUrl, type AuthSearchParams } from "@/backend/features/auth/auth-page";
import { RedirectIfAuthenticated } from "@/frontend/features/auth/components/redirect-if-authenticated";
import { TwoFactorForm } from "@/frontend/features/auth/components/two-factor-form";

export const metadata: Metadata = {
    title: "Verificação em duas etapas | Group of Study",
};

// Segunda etapa do login de quem ativou o 2FA (GOS-034). O signInAction manda
// para cá; sem o cookie temporário do Better Auth, o código é recusado com
// "A verificação expirou", e a pessoa volta para o login.
export default function TwoFactorPage({ searchParams }: PageProps<"/login/verificacao">) {
    return (
        <>
            <Suspense fallback={null}>
                <RedirectIfAuthenticated searchParams={searchParams} />
            </Suspense>
            <Suspense fallback={<TwoFactorForm />}>
                <TwoFactorContent searchParams={searchParams} />
            </Suspense>
        </>
    );
}

async function TwoFactorContent({ searchParams }: { searchParams: AuthSearchParams }) {
    return <TwoFactorForm callbackUrl={await getCallbackUrl(searchParams)} />;
}
