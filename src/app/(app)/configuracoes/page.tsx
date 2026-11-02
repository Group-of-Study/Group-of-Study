import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountSecurityPanel } from "@/features/account/components/account-security-panel";
import { DangerZonePanel } from "@/features/account/components/danger-zone-panel";
import { ProfileForm } from "@/features/account/components/profile-form";
import { SettingsNav } from "@/features/account/components/settings-nav";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
    title: "Configurações | Group of Study",
};

// Figma: App / 10 · Configurações e Mobile / 13 · Configurações (só a área de conteúdo;
// sidebar e topbar do app ainda não existem).
export default function SettingsPage() {
    return (
        <main className="mx-auto flex w-full max-w-278 flex-1 flex-col gap-6 px-4 py-6 lg:gap-8 lg:px-8 lg:py-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-h2 text-foreground">Configurações</h1>
                <p className="text-body-sm text-text-secondary">Seu perfil, seu e-mail, sua senha e a segurança da conta.</p>
            </header>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                <SettingsNav />
                {/* A sessão só existe na hora do request: fica dentro do <Suspense>. */}
                <Suspense fallback={<PanelsSkeleton />}>
                    <SettingsPanels />
                </Suspense>
            </div>
        </main>
    );
}

async function SettingsPanels() {
    const { user } = await requireSession();

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-190">
            <ProfileForm name={user.name} email={user.email} />
            <AccountSecurityPanel email={user.email} />
            <DangerZonePanel />
        </div>
    );
}

function PanelsSkeleton() {
    return (
        <div aria-hidden className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-190">
            <div className="h-64 animate-pulse rounded-xl bg-bg-subtle" />
            <div className="h-96 animate-pulse rounded-xl bg-bg-subtle" />
        </div>
    );
}
