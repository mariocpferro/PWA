import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { nextUrl } = request;

  const sessionCookie =
    request.cookies.get("__Secure-authjs.session-token") ??
    request.cookies.get("authjs.session-token");

  const isLoggedIn = !!sessionCookie;
  const isOnAuthPage = nextUrl.pathname.startsWith("/login");
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isOfflinePage = nextUrl.pathname === "/offline";
  const isPublicAsset =
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/icons") ||
    nextUrl.pathname === "/manifest.json" ||
    nextUrl.pathname === "/favicon.ico";

  if (isPublicAsset || isApiAuth || isOfflinePage) return NextResponse.next();

  if (isOnAuthPage) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/receipts", nextUrl));
    return NextResponse.next();
  }

  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*|offline).*)",
  ],
};
