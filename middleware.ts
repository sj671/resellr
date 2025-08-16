import { NextResponse, type NextRequest } from "next/server";

const isProd = process.env.NODE_ENV === "production";

// Allowed dev origins (add tunnels here)
const allowedDevOrigins = new Set<string>([
  "https://rochester-tablet-constitute-bears.trycloudflare.com",
]);

// Common CORS headers (methods/headers can be adjusted as needed)
const commonCorsHeaders: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
  Vary: "Origin",
};

function getAllowOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (isProd) {
    // In production, default to not allowing arbitrary cross-origin.
    // If you have a known prod web origin, return it here.
    return null;
  }
  return allowedDevOrigins.has(origin) ? origin : null;
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowOrigin = getAllowOrigin(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (allowOrigin) {
      res.headers.set("Access-Control-Allow-Origin", allowOrigin);
    }
    for (const [k, v] of Object.entries(commonCorsHeaders)) res.headers.set(k, v);
    return res;
  }

  // Handle authentication protection for protected routes
  const { pathname } = req.nextUrl;
  const protectedRoutes = ['/research', '/settings', '/dashboard', '/profile'];
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Check for authentication cookie/token
    const authCookie = req.cookies.get('sb-access-token') || req.cookies.get('sb-refresh-token');
    
    if (!authCookie) {
      // Redirect to login with the intended destination
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const res = NextResponse.next();
  if (allowOrigin) {
    res.headers.set("Access-Control-Allow-Origin", allowOrigin);
    for (const [k, v] of Object.entries(commonCorsHeaders)) res.headers.set(k, v);
  }
  return res;
}

// Apply middleware to API routes and protected pages
export const config = {
  matcher: [
    "/api/:path*",
    "/research/:path*",
    "/settings/:path*", 
    "/dashboard/:path*",
    "/profile/:path*",
    "/research",
    "/settings",
    "/dashboard", 
    "/profile"
  ],
};


