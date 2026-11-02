import Image from "next/image";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { SettingsPanel } from "./settings-panel";

// Figma: Panel/Zona de perigo. Excluir conta entra na GOS-036 (soft delete / LGPD).
export function DangerZonePanel() {
    return (
        <SettingsPanel id="zona-de-perigo" title="Zona de perigo">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="flex-1 text-body-sm text-text-secondary">
                    Sair encerra a sessão neste dispositivo. Excluir a conta remove seus dados de forma permanente
                    (em breve).
                </p>
                <div className="flex gap-3">
                    <form action={signOutAction}>
                        <Button
                            type="submit"
                            variant="ds-secondary"
                            size="ds-md"
                            leadingIcon={<Image src="/icons/log-out.svg" width={16} height={16} alt="" />}
                        >
                            Sair
                        </Button>
                    </form>
                    <Button variant="danger" size="ds-md" disabled title="Em breve">
                        Excluir conta
                    </Button>
                </div>
            </div>
        </SettingsPanel>
    );
}
