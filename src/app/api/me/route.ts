import { getSession, unauthorized } from "@/lib/session";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return unauthorized();
    }
    return Response.json({ user: session.user });
}
