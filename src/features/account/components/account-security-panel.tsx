import type { ActiveSession } from "../sessions";
import { ActiveSessions } from "./active-sessions";
import { ChangeEmailForm } from "./change-email-form";
import { ChangePasswordForm } from "./change-password-form";
import { TwoFactorSettings } from "./two-factor-settings";
import { SettingsPanel } from "./settings-panel";

// "Conta e segurança" aparece no menu do Figma, mas a seção não tem tela desenhada:
// segue o mesmo padrão dos outros painéis (Input, Button Secondary, SettingRow).
export function AccountSecurityPanel({
    email,
    twoFactorEnabled,
    sessions,
}: {
    email: string;
    twoFactorEnabled: boolean;
    sessions: ActiveSession[];
}) {
    return (
        <SettingsPanel id="conta" title="Conta e segurança">
            <div className="flex flex-col divide-y divide-border-subtle *:first:pt-0 *:last:pb-0">
                <ChangeEmailForm email={email} />
                <ChangePasswordForm />
                <TwoFactorSettings enabled={twoFactorEnabled} />
                <ActiveSessions sessions={sessions} />
            </div>
        </SettingsPanel>
    );
}
