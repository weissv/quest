import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('admin_token');
  const isAuthorized = token && token.value === 'authorized';

  // Protect /api routes
  if (pathname.startsWith('/api')) {
    // Allow public access to evaluate (POST) and questions (GET)
    if (pathname === '/api/evaluate' || (request.method === 'GET' && pathname === '/api/questions')) {
      return NextResponse.next();
    }

    // Block all other API access without token
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    // Allow access to login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // If no token exists, redirect to login
    if (!isAuthorized) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
