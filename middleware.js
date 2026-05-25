import { NextResponse } from 'next/server'

const PROTECTED = [
  '/practice', '/signs', '/mock', '/report', '/drive',
  '/api/progress', '/api/score', '/api/transcribe',
  '/api/mock', '/api/device', '/api/conversation', '/api/pronunciation',
]

export default function middleware(req) {
  const { pathname } = req.nextUrl
  if (PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    if (!req.cookies.has('__session')) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
