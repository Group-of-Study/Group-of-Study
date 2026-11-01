import type { Metadata } from "next";
import { Suspense } from "react";
import { getCallbackUrl, type AuthSearchParams } from "@/features/auth/auth-page";
import { LoginForm } from "@/features/auth/components/login-form";
import { RedirectIfAuthenticated } from "@/features/auth/components/redirect-if-authenticated";

export const metadata: Metadata = {
    title: "Entrar | Group of Study",
};

// Sessão e ?callbackUrl= só existem na hora do request, então ficam em
// <Suspense> (exigência do cacheComponents). O formulário aparece na hora.
export default function LoginPage({ searchParams }: PageProps<"/login">) {
    return (
        <>
            <Suspense fallback={null}>
                <RedirectIfAuthenticated searchParams={searchParams} />
            </Suspense>
            <Suspense fallback={<LoginForm />}>
                <LoginContent searchParams={searchParams} />
            </Suspense>
        </>
    );
}

async function LoginContent({ searchParams }: { searchParams: AuthSearchParams }) {
    return <LoginForm callbackUrl={await getCallbackUrl(searchParams)} />;
}
