import { ChangeEmailForm } from "./change-email-form";
import { ChangePasswordForm } from "./change-password-form";
import { ComingSoon, SettingRow, SettingsPanel } from "./settings-panel";

// "Conta e segurança" aparece no menu do Figma, mas a seção não tem tela desenhada:
// segue o mesmo padrão dos outros painéis (Input, Button Secondary, SettingRow).
export function AccountSecurityPanel({ email }: { email: string }) {
    return (
        <SettingsPanel id="conta" title="Conta e segurança">
            <div className="flex flex-col divide-y divide-border-subtle *:first:pt-0 *:last:pb-0">
                <ChangeEmailForm email={email} />
                <ChangePasswordForm />
                {/* Espaço das próximas tasks: 2FA (GOS-034) e sessões (GOS-035). */}
                <SettingRow
                    title="Verificação em duas etapas"
                    description="Pede um código do app autenticador, além da senha, para entrar."
                >
                    <ComingSoon />
                </SettingRow>
                <SettingRow
                    title="Sessões ativas"
                    description="Veja onde sua conta está conectada e encerre o que não reconhecer."
                >
                    <ComingSoon />
                </SettingRow>
            </div>
        </SettingsPanel>
    );
}
