import { type NextRequest, NextResponse } from "next/server"

// Force Node.js runtime for middleware to avoid Edge Runtime limitations
export const runtime = "nodejs"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard"]

  // Auth routes that should redirect if already authenticated
  const authRoutes = ["/auth/login", "/auth/register"]

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Check for session cookie (Better Auth uses a session token cookie)
  const sessionCookie =
    request.cookies.get("comet-auth.session_token") ||
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("session_token")
  const hasSession = !!sessionCookie?.value

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If accessing auth route with active session, redirect to dashboard
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
