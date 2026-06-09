import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage = nextUrl.pathname.startsWith("/login");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
      const isOfflinePage = nextUrl.pathname === "/offline";
      const isPublicAsset =
        nextUrl.pathname.startsWith("/_next") ||
        nextUrl.pathname.startsWith("/icons") ||
        nextUrl.pathname === "/manifest.json" ||
        nextUrl.pathname === "/favicon.ico";

      if (isPublicAsset || isApiAuth || isOfflinePage) return true;
      if (isOnAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/receipts", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
  },
  session: { strategy: "jwt" },
};
