import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Allow Socket.io requests
  if (request.nextUrl.pathname.startsWith("/api/socket")) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
