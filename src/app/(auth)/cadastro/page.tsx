import type { Metadata } from "next";
import { Suspense } from "react";
import { getCallbackUrl, type AuthSearchParams } from "@/features/auth/auth-page";
import { RedirectIfAuthenticated } from "@/features/auth/components/redirect-if-authenticated";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = {
    title: "Criar conta | Group of Study",
};

// Mesma estrutura do /login: sessão e ?callbackUrl= dentro de <Suspense>.
export default function SignUpPage({ searchParams }: PageProps<"/cadastro">) {
    return (
        <>
            <Suspense fallback={null}>
                <RedirectIfAuthenticated searchParams={searchParams} />
            </Suspense>
            <Suspense fallback={<SignUpForm />}>
                <SignUpContent searchParams={searchParams} />
            </Suspense>
        </>
    );
}

async function SignUpContent({ searchParams }: { searchParams: AuthSearchParams }) {
    return <SignUpForm callbackUrl={await getCallbackUrl(searchParams)} />;
}
