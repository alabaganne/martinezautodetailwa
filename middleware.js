import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Admin routes that need protection
const protectedRoutes = ['/admin'];
const publicRoutes = ['/admin/login'];

// Session cookie name (must match API route)
const SESSION_NAME = 'admin_session';

// Store for valid sessions (in production, use database or Redis)
// This is shared with the API route
const validSessions = new Set();

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Check if it's a protected admin route
  const isProtectedRoute = protectedRoutes.some(route => 
    path.startsWith(route)
  );
  
  const isPublicRoute = publicRoutes.some(route => 
    path.startsWith(route)
  );
  
  if (isProtectedRoute && !isPublicRoute) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_NAME);
    
    // Check if user has a valid session
    if (!sessionCookie || !sessionCookie.value) {
      // No session, redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
    
    // In a production app, you'd validate the session token here
    // For now, we just check if it exists
    // You could also make an API call to validate the session
    
    // Optional: Add additional checks here
    // - Validate session token format
    // - Check session expiry
    // - Verify against database
  }
  
  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};