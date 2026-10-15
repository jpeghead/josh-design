import { getProfile, saveProfile, seedProfile, type Profile } from "@/lib/admin/resume/profile";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(getProfile());
}
/** PUT replaces the profile; POST reseeds it from the site's content. */
export async function PUT(req: Request) {
  const p = (await req.json()) as Profile;
  if (!p?.name || !Array.isArray(p.experience)) return new Response("That is not a profile", { status: 400 });
  saveProfile(p);
  return Response.json(p);
}
export async function POST() {
  const p = seedProfile();
  const prev = getProfile();
  p.answers = { ...p.answers, ...prev.answers }; // phone, salary, start date: Josh's, not the seed's
  if (prev.phone) p.phone = prev.phone;
  saveProfile(p);
  return Response.json(p);
}

/** PATCH { phone?, location?, answers? } updates the answers forms ask for, without touching the record. */
export async function PATCH(req: Request) {
  const body = (await req.json()) as { phone?: string; location?: string; answers?: Partial<Profile["answers"]> };
  const p = getProfile();
  if (typeof body.phone === "string") p.phone = body.phone.trim() || undefined;
  if (typeof body.location === "string" && body.location.trim()) p.location = body.location.trim();
  if (body.answers) p.answers = { ...p.answers, ...body.answers };
  saveProfile(p);
  return Response.json(p);
}
