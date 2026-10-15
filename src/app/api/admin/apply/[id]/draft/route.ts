import { draftAnswer } from "@/lib/admin/apply/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST { key } → { text }: a drafted answer for one field, for the queue's edit box. Nothing is set until you say so. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { key } = (await req.json()) as { key: string };
  try {
    return Response.json({ text: await draftAnswer((await params).id, key) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
