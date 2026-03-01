import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 1. Identify if the user is trying to enter a restricted area
  const isProtectedRoute = 
    path.startsWith('/admin') || 
    path.startsWith('/kitchen') || 
    path.startsWith('/waiter') || 
    path.startsWith('/developer');

  if (isProtectedRoute) {
    // 2. Check their pockets for the "Staff Badge" (a secure cookie)
    // We will name our cookie 'citygrub_staff_token'
    const staffToken = request.cookies.get('citygrub_staff_token')?.value;

    // 3. If they don't have the badge, bounce them to the login page
    if (!staffToken) {
      const loginUrl = new URL('/login', request.url);
      
      // Optional: Remember where they were trying to go, so we can send them there AFTER they log in
      loginUrl.searchParams.set('callbackUrl', path); 
      
      return NextResponse.redirect(loginUrl);
    }

    // (Later, we can add logic here to ensure a Waiter can't access the Admin page)
  }

  // 4. If it's a public page (like the Menu) or they have a badge, open the door
  return NextResponse.next();
}

// 5. This config tells Next.js to ONLY run this bouncer on these specific routes, keeping your site blazingly fast.
export const config = {
  matcher: [
    '/admin/:path*',
    '/kitchen/:path*',
    '/waiter/:path*',
    '/developer/:path*'
  ]
};