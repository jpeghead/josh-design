import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const secret = String(form.get("secret") ?? "");
  const next = String(form.get("next") ?? "/admin");
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.redirect(new URL("/admin/login?bad=1", req.url), 303);
  }
  const res = NextResponse.redirect(new URL(next.startsWith("/admin") ? next : "/admin", req.url), 303);
  res.cookies.set("admin", secret, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
