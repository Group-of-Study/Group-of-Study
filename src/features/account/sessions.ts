import "server-only";
import { prisma } from "@/lib/prisma";
import { describeDevice, parseUserAgent } from "./user-agent";

// O que a tela de configurações mostra de cada sessão. O token fica de fora de
// propósito: ele é a "chave" da sessão e nunca vai para o navegador. Para encerrar
// uma sessão, o formulário manda só o id, e a action busca o token no servidor.
export type ActiveSession = {
    id: string;
    device: string;
    mobile: boolean;
    ipAddress: string | null;
    // Já formatado aqui no servidor, no fuso do Brasil (o servidor roda em UTC).
    connectedAt: string;
    current: boolean;
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "medium",
    timeStyle: "short",
});

// Sem proxy na frente (ex.: rodando local), o Better Auth não descobre o IP e grava
// o endereço "vazio" ("::", "0000:0000:...", "0.0.0.0"). Mostrar isso só confunde.
function knownIp(ip: string | null): string | null {
    return ip && !/^[0:.]+$/.test(ip) ? ip : null;
}

// Lê direto do banco em vez de usar o listSessions do Better Auth: o listSessions
// exige uma sessão "fresca" (login há menos de 24 h, o freshAge padrão) e daria erro
// para quem está logado há mais tempo. Aqui a regra de acesso é a mesma: só as
// sessões do próprio usuário, e só as que ainda não expiraram.
export async function listActiveSessions(userId: string, currentSessionId: string): Promise<ActiveSession[]> {
    const sessions = await prisma.session.findMany({
        where: { userId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: { id: true, userAgent: true, ipAddress: true, createdAt: true },
    });

    return sessions
        .map((session) => {
            const device = parseUserAgent(session.userAgent);
            return {
                id: session.id,
                device: describeDevice(device),
                mobile: device.mobile,
                ipAddress: knownIp(session.ipAddress),
                connectedAt: dateFormat.format(session.createdAt),
                current: session.id === currentSessionId,
            };
        })
        // A sessão atual vem primeiro; as outras, da mais nova para a mais antiga.
        .sort((a, b) => Number(b.current) - Number(a.current));
}
