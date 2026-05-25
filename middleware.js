import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtected = createRouteMatcher([
  '/practice(.*)', '/signs(.*)', '/mock(.*)',
  '/report(.*)', '/drive(.*)',
  '/api/progress(.*)', '/api/score(.*)', '/api/transcribe(.*)',
  '/api/mock(.*)', '/api/device(.*)', '/api/conversation(.*)',
  '/api/pronunciation(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
