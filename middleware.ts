import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Redirect /join?ref=CODE to /signup?ref=CODE
  if (pathname === "/join") {
    const ref = searchParams.get("ref");
    const signupUrl = new URL("/signup", req.url);
    if (ref) {
      signupUrl.searchParams.set("ref", ref);
    }
    return NextResponse.redirect(signupUrl);
  }

  // Role-based access control
  const session = await getSessionUser();

  // Owner routes - ONLY owner can access
  if (pathname.startsWith("/owner")) {
    if (!session || session.role !== "owner") {
      return NextResponse.redirect(new URL("/404", req.url));
    }
  }

  // Admin routes - admin and owner can access
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/404", req.url));
    }
    if (session.role !== "admin" && session.role !== "owner") {
      return NextResponse.redirect(new URL("/404", req.url));
    }
  }

  // User routes - authenticated users only (user, admin, owner)
  if (pathname.startsWith("/dashboard") || 
      pathname.startsWith("/investment") || 
      pathname.startsWith("/trading") || 
      pathname.startsWith("/wallet") ||
      pathname.startsWith("/referral") ||
      pathname.startsWith("/profile")) {
    if (!session) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
    // Users cannot access admin/owner pages
    if (session.role === "user") {
      if (pathname.startsWith("/admin") || pathname.startsWith("/owner")) {
        return NextResponse.redirect(new URL("/404", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/join",
    "/owner/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/investment/:path*",
    "/trading/:path*",
    "/wallet/:path*",
    "/referral/:path*",
    "/profile/:path*",
  ],
};
