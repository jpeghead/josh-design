import { NextResponse, type NextRequest } from "next/server";

/**
 * The admin panel is Josh's own tool. It exists only where ADMIN_SECRET is
 * set (his machine); everywhere else /admin is a 404. With the secret set,
 * a matching httpOnly cookie is required; pages go to the login form, API
 * calls get 401.
 */
export function middleware(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const { pathname } = req.nextUrl;
  if (!secret) return new NextResponse(null, { status: 404 });
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return NextResponse.next();
  const ok = req.cookies.get("admin")?.value === secret;
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
