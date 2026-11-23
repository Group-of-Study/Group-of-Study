import { getSession, unauthorized } from "@/backend/lib/session";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return unauthorized();
    }
    return Response.json({ data: session.user });
}
