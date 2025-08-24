import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/profile", "/settings", "/bot-access", "/subscription"];

// Routes that should redirect authenticated users
const authRoutes = ["/handler/sign-in", "/handler/sign-up"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    const user = await stackServerApp.getUser();
    const isAuthenticated = !!user;

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Protect routes that require authentication
    if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/handler/sign-in", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    
    // If there's an error checking auth and it's a protected route, redirect to sign-in
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/handler/sign-in", request.url));
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
