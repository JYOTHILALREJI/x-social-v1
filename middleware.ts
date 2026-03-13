import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Using 'export default' ensures Next.js finds the function immediately
export default function middleware(request: NextRequest) {
  // 1. Check for the session cookie
  const session = request.cookies.get('auth_session')?.value;

  // 2. Define path categories
  const { pathname } = request.nextUrl;
  
  // Protected: User MUST be logged in
  const protectedPaths = ['/feed', '/reels', '/messages', '/profile', '/settings', '/search'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // Auth: User MUST NOT be logged in (Landing/Login)
  const isAuthPath = pathname === '/' || pathname === '/auth';

  // 3. Logic: Redirect unauthorized users to Landing
  if (isProtectedPath && !session) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Logic: Redirect logged-in users away from Login/Landing to Feed
  if (isAuthPath && session) {
    const feedUrl = new URL('/feed', request.url);
    return NextResponse.redirect(feedUrl);
  }

  return NextResponse.next();
}

// The matcher remains the same - it excludes static files for performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};