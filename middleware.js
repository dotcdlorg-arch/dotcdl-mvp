// No imports — importing next/server causes Vercel's separate source compilation to bundle
// unoptimized Next.js server code that references __dirname, crashing in Edge Runtime.
// req is a NextRequest at runtime (next/server not needed to use its properties).
// Response and URL are Web standard globals available in Edge Runtime.

const PROTECTED = [
  '/practice', '/signs', '/mock', '/report', '/drive',
  '/api/progress', '/api/score', '/api/transcribe',
  '/api/mock', '/api/device', '/api/conversation', '/api/pronunciation',
]

export default function middleware(req) {
  const { pathname } = new URL(req.url)
  if (PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const cookie = req.headers.get('cookie') || ''
    if (!cookie.includes('__session=')) {
      if (pathname.startsWith('/api/')) return new Response('Unauthorized', { status: 401 })
      return Response.redirect(new URL('/sign-in', req.url))
    }
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
