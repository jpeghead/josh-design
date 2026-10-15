import { getSettings, saveSettings, type Settings } from "@/lib/admin/settings";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(getSettings());
}
export async function PATCH(req: Request) {
  const body = (await req.json()) as Partial<Settings>;
  return Response.json(saveSettings(body));
}
