import { NextResponse } from 'next/server'

const PROTECTED = [
  '/practice', '/signs', '/mock', '/report', '/drive',
  '/api/progress', '/api/score', '/api/transcribe',
  '/api/mock', '/api/device', '/api/conversation', '/api/pronunciation',
]

function isProtected(pathname) {
  return PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))
}

// Lightweight cookie-presence check — no Clerk backend imports (avoids Vercel Edge ban on #crypto / #safe-node-apis).
// Full JWT verification happens per-request in each API route via auth() from @clerk/nextjs/server.
export function middleware(req) {
  if (isProtected(req.nextUrl.pathname)) {
    if (!req.cookies.has('__session')) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return new Response('Unauthorized', { status: 401 })
      }
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
