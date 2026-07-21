import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // Generate a cryptographically secure random UUID for the nonce
  const nonce = crypto.randomUUID();

  // Construct the Content Security Policy
  // We use 'nonce' and 'strict-dynamic' to allow scripts loaded by our nonced scripts,
  // while preventing unauthorized inline scripts (XSS).
  // Note: 'unsafe-eval' is often required for development or certain libraries,
  // but 'unsafe-inline' is the primary XSS vector which is now blocked by the nonce.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, " ").trim();

  // Attach the nonce and CSP to the request headers
  // This allows Server Components (like layout.tsx) to read the nonce via headers().get('x-nonce')
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Attach the CSP to the response headers so the browser enforces it
  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - uploads (local uploads during dev)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|uploads|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
