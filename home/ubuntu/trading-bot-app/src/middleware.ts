import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

// In a production environment, this would be stored securely
const JWT_SECRET = 'trading-bot-secret-key';

export function middleware(request: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = ['/auth/login', '/auth/register'];
  
  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Get the token from cookies
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  // If no token is found, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  try {
    // Verify the token
    verify(token, JWT_SECRET);
    
    // If token is valid, allow access
    return NextResponse.next();
  } catch (error) {
    // If token is invalid, redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

// Configure which paths this middleware applies to
export const config = {
  matcher: [
    // Apply to all paths except API routes and static files
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
