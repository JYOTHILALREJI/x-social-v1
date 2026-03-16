// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('auth_session')?.value;
  const { pathname } = request.nextUrl;
  
  const protectedPaths = ['/feed', '/reels', '/messages', '/profile', '/settings', '/search', '/dating', '/ai-companion'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // Immediate block if no cookie
  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Prevent logged-in users from seeing the landing page
  if ((pathname === '/' || pathname === '/auth') && session) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};