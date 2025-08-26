import { NextRequest, NextResponse } from "next/server";

// For now, no auth middleware - starting fresh with NeonAuth + NeonDB
export async function middleware(request: NextRequest) {
  // TODO: Implement NeonAuth middleware when ready
  return NextResponse.next();
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