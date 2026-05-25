# Vercel Deployment Errors & Solutions

> Reference guide extracted from `doc/4claudelog.md` Sessions 4–13.
> Project: CDL English Pro · Next.js 15.5.18 · Clerk v6 · Vercel
> Date span: 2026-05-24

---

## TL;DR

All Vercel deploy failures (5 distinct error symptoms over 10 fix attempts) traced to **one root cause**: middleware was running on Vercel's **Edge Runtime**. The Edge Runtime cannot bundle Clerk's backend internals and strips Node.js globals.

**The fix that actually worked:** Switch middleware to Node.js runtime via Next.js 15.5's stable `experimental.nodeMiddleware` flag. Everything before that was symptom-chasing workarounds.

**Files involved in the final fix:** `next.config.mjs`, `middleware.js`, `vercel.json`, `package.json`.

---

## Final Working Configuration

### `next.config.mjs`

```js
const nextConfig = {
  experimental: {
    nodeMiddleware: true,
  },
  images: { /* ... */ }
}
```

### `middleware.js`

```js
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
  runtime: 'nodejs',
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

### `vercel.json`

```json
{
  "framework": "nextjs"
}
```

### `package.json` — Clerk pin

```json
"@clerk/nextjs": "6.12.4"
```

(No `overrides` block. The Session 4 overrides were removed in Session 5 — they were incorrect, forcing Core 2 packages into a Core 3 tree.)

---

## Error Catalog

Each row shows one error symptom Vercel reported, what attempt addressed it, and whether
that attempt was a real fix or a workaround that introduced a new error.

| # | Error symptom | Attempt | Outcome |
|---|---|---|---|
| 1 | `Edge Function "middleware" referencing unsupported modules: @clerk/shared/buildAccountsBaseUrl, #crypto, #safe-node-apis` | Pin `@clerk/nextjs` and add `overrides` for Clerk transitive packages | ❌ Same error returned on next deploy |
| 2 | Same as #1 | Replace `clerkMiddleware` with custom cookie-check middleware (remove all Clerk imports from `middleware.js`) | ⚠️ Edge rejection gone; new error: `MIDDLEWARE_INVOCATION_FAILED` |
| 3 | `MIDDLEWARE_INVOCATION_FAILED` (HTTP 500) | Change `export function middleware` → `export default function middleware` | ⚠️ Invocation works; new error: `ReferenceError: __dirname is not defined` |
| 4 | `__dirname is not defined` at middleware runtime | Add `"type": "module"` to `package.json` | ❌ Error persisted (Vercel's bundler still followed `next/server` import) |
| 5 | Same as #4 | Remove `import { NextResponse } from 'next/server'` — use raw `Response.redirect()` and `new Response()` only | ⚠️ `__dirname` gone; new error: `TypeError: Cannot destructure property 'pathname' of 'i.nextUrl' as it is undefined` |
| 6 | `req.nextUrl` and `req.cookies` are undefined | Use Web standard APIs: `new URL(req.url)` and `req.headers.get('cookie')` | ⚠️ TypeError gone; new error: `Cache 404 Not Found Key /404.html` |
| 7 | `Cache 404 Not Found Key /404.html` | Return explicit `new Response(null, { headers: { 'x-middleware-next': '1' } })` instead of implicit `undefined` | ❌ Cache 404 still appeared |
| **8** | **All of the above** | **Add `experimental.nodeMiddleware: true` in `next.config.mjs` + `runtime: 'nodejs'` in middleware config** | ✅ **Fixed everything** |
| 9 | Hypothetical `NOT_FOUND` from framework misconfiguration | Add `vercel.json` with `"framework": "nextjs"` | ✅ Preventive (no error was occurring, but locks dashboard preset against future drift) |
| 10 | `Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()` (only after #8 — caused by the Session 5 cookie-only middleware lingering after Edge fix removed need for workaround) | Restore `clerkMiddleware()` (Node.js runtime now allows Clerk backend imports) | ✅ Final working state |

Legend: ✅ real fix · ⚠️ partial (fixed surface, introduced new) · ❌ no effect

---

## Why Each Edge Workaround Failed in Sequence

Vercel runs **two** compilations of middleware:

1. **Next.js webpack build** — produces `.next/server/middleware.js`. Properly tree-shaken; gets a real `NextRequest` at runtime.
2. **Vercel post-build source compilation** — Vercel re-bundles the source `middleware.js` independently for the Edge Function deploy. This bundler:
   - Follows every `import` statement, pulling in unoptimized code
   - Converts ESM to CommonJS (injecting `__dirname` into a CJS wrapper)
   - Passes a plain `Request` (not `NextRequest`) at runtime in the compiled output

Each workaround addressed only one of these without solving the underlying constraint:

- **Removing `clerkMiddleware`** stopped Clerk's `@clerk/backend` from being bundled — but `next/server` still got pulled in.
- **Removing `next/server`** stopped `__dirname` references — but `req.nextUrl` / `req.cookies` are `NextRequest`-only, undefined on plain `Request`.
- **Using Web APIs** worked at runtime — but returning `undefined` was treated as "no response" by Vercel's edge layer, triggering Cache 404.
- **`new Response(null, { 'x-middleware-next': '1' })`** mimics `NextResponse.next()` but Vercel's source-compiled middleware path didn't honor it.

Each fix was correct for the *symptom* but never resolved that Vercel's Edge Runtime is a separate, stricter environment from the local Next.js build.

---

## Why Node.js Runtime Solved Everything

Setting `runtime: 'nodejs'` in middleware config:

- **Skips Vercel's source-level Edge compilation** entirely. The middleware deploys as a regular Lambda using Next.js's webpack output directly.
- **No Edge Function analyzer.** `@clerk/backend` can import `#crypto`, `#safe-node-apis`, and `@clerk/shared/buildAccountsBaseUrl` freely — they all exist in Node.
- **No ESM→CJS transform.** Node natively executes the ESM Next.js produces. `__dirname` never gets injected.
- **Real `NextRequest`.** `req.nextUrl` and `req.cookies` work as documented.
- **`NextResponse.next()` works.** No need for raw `Response` workarounds.

Requirement: Next.js ≥ 15.5.0 (this project is 15.5.18) and `experimental.nodeMiddleware: true` in `next.config.mjs`.

References:
- [Next.js 15.2 blog — Node.js Middleware (experimental)](https://nextjs.org/blog/next-15-2#nodejs-middleware-experimental)
- Next.js v15.5.0 changelog: middleware Node.js runtime marked stable.

---

## Quick Diagnostic Cheat Sheet

If a similar Vercel error appears in the future, match the symptom to the root cause:

| Error message in Vercel logs | Most likely cause |
|---|---|
| `Edge Function "middleware" referencing unsupported modules` | Middleware is on Edge Runtime + imports a package with Node-only internals. → Switch middleware to Node.js runtime |
| `MIDDLEWARE_INVOCATION_FAILED` | Middleware isn't a callable default export. → Check `export default function middleware()` |
| `ReferenceError: __dirname is not defined` | Vercel compiled ESM→CJS and middleware runs on Edge. → `runtime: 'nodejs'` or `"type": "module"` + no Node-only imports |
| `TypeError: Cannot destructure ... 'nextUrl'` | Code uses NextRequest properties on plain Request (Edge source-compiled path). → Use `runtime: 'nodejs'` to get real `NextRequest` |
| `Cache 404 Not Found Key /404.html` | Middleware returned no valid Response to Vercel's edge. → Return `NextResponse.next()` explicitly (Node runtime) or `new Response(null, { headers: { 'x-middleware-next': '1' } })` (Edge) |
| `Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()` | API route uses `await auth()` but middleware doesn't call `clerkMiddleware()`. → Add `clerkMiddleware()` to middleware (requires Node runtime if it was removed to satisfy Edge) |
| `NOT_FOUND` despite successful build | Framework preset mismatch. → Add `vercel.json` with `"framework": "nextjs"` |

---

## Verification Commands

After applying any middleware change, verify locally before pushing:

```bash
# Build must compile cleanly with all pages generated
npm run build

# Check the produced middleware bundle for banned Edge identifiers
# (only relevant if you're staying on Edge runtime)
grep -E '#crypto|#safe-node-apis|buildAccountsBaseUrl|__dirname' \
  .next/server/middleware.js && echo "FOUND — Edge will reject" || echo "Clean"
```

After deploying, watch Vercel's runtime logs (not just the build log) — most middleware errors appear at request time, not at build time.

---

## Reversal — Restore Edge Runtime

Not recommended. If forced to revert to Edge Runtime (e.g. for cold-start performance):

1. Remove `experimental.nodeMiddleware: true` from `next.config.mjs`.
2. Remove `runtime: 'nodejs'` from `middleware.js` config export.
3. Replace `clerkMiddleware()` with the Session 5 cookie-only middleware:
   ```js
   const cookie = req.headers.get('cookie') || ''
   if (!cookie.includes('__session=')) { ... }
   ```
4. Stop calling `await auth()` in API routes — middleware no longer provides Clerk context. Replace with manual JWT verification using `@clerk/backend`'s `authenticateRequest()` (which itself requires Node runtime on the API route).
5. Accept that any route protection becomes presence-of-cookie only, not real JWT verification at the edge.

All ten previous workarounds will need to be reapplied. The Node runtime path is strictly simpler.

---

## Cost Accounting — Lines of Code & Disk Footprint

Measured from git over commits `d06b765` (Session 4) through `83436b0` (Session 13).

### Lines of code added

Hand-written code only (excluding `package-lock.json` auto-generation and the
`doc/4claudelog.md` documentation entries):

| File | Lines added | Lines removed |
|---|---|---|
| `middleware.js` | 1 | 0 |
| `next.config.mjs` | 3 | 0 |
| `package.json` | 4 | 3 |
| `vercel.json` | 3 | 0 |
| **Net total** | **11** | **3** |

**Net = 8 hand-written lines** of code permanently added across the entire Vercel saga.

The 8 net lines are:

```js
// next.config.mjs (+3)
experimental: {
  nodeMiddleware: true,
},
```
```js
// middleware.js — added inside the config export (+1)
runtime: 'nodejs',
```
```json
// vercel.json — entire new file (+3)
{
  "framework": "nextjs"
}
```
```json
// package.json — Clerk pin (+1 net; removed caret)
"@clerk/nextjs": "6.12.4"
```

### Gross churn across all 10 commits

- **74 lines added, 66 lines removed** (hand-written, excluding `package-lock.json` and docs)
- Sessions 5–10 wrote ~66 lines of Edge-workaround code that Session 11 removed when the
  Node.js runtime fix landed. Most of that churn was the same `middleware.js` file being
  rewritten seven times.

### Per-commit hand-written churn

| Commit | +lines | -lines | Description |
|---|---|---|---|
| d06b765 | +220 | -52 | Clerk dep pin + overrides (incl. package-lock churn) |
| 2243611 | +23 | -16 | Replace clerkMiddleware with cookie check |
| 57398b1 | +1 | -1 | Default export fix |
| 74d14bc | +1 | 0 | Add `"type": "module"` |
| 9d9e303 | +9 | -13 | Remove `next/server` import |
| d299afc | +3 | -3 | Web standard APIs |
| dec7761 | +3 | 0 | Explicit `x-middleware-next` header |
| caf01e4 | +3 | 0 | Add `vercel.json` |
| 8687e43 | +12 | -12 | Switch to Node.js runtime ✅ real fix |
| 83436b0 | +11 | -18 | Restore `clerkMiddleware` |

---

### Disk footprint — `node_modules` growth

Net change to installed dependencies from pinning `@clerk/nextjs` to exact `6.12.4`:

| | Count | Size |
|---|---|---|
| Packages added | 17 entries (incl. 9 nested duplicates) | ~9.2 MB gross |
| Top-level packages removed | 4 (older versions de-duplicated) | ~4 MB estimated |
| **Net** | **+13 packages** | **~5 MB** |

### Detailed sizes of added packages

| Package | Size |
|---|---|
| `@clerk/backend/node_modules/@clerk/shared` | 2.7 MB |
| `@clerk/nextjs/node_modules/@clerk/shared` (duplicate, different version) | 2.7 MB |
| `type-fest` | 0.9 MB |
| `@clerk/nextjs/node_modules/@clerk/clerk-react` | 0.7 MB |
| `crypto-js` | 0.6 MB |
| `@clerk/backend/node_modules/@clerk/types` + `@clerk/nextjs/.../@clerk/types` | 1.2 MB |
| 11 small utility packages (cookie, js-cookie, dot-case, snake-case, tslib, etc.) | <0.5 MB combined |
| **Total** | **~9.2 MB gross / ~5 MB net** |

### Why the duplicates exist

Pinning `@clerk/nextjs` from `^6.12.4` (caret allowed `6.39.4`) down to exactly `6.12.4`
forced npm to use older Clerk transitive packages. But other branches of the dependency
graph (notably `@clerk/backend`) had already locked in newer transitive requirements,
so npm could not deduplicate. Both versions had to live side by side in nested
`node_modules/` folders — that nesting is where ~5.4 MB of the added size comes from
(same packages, two versions each).

### Context numbers

- Current `node_modules`: **418 MB**
- Net added by the Vercel fix: **~5 MB** (≈ 1.2% growth)
- Current `@clerk` footprint: **12 MB** (was ~7 MB before the pin)
- Build output (`.next`): **295 MB**
- Middleware bundle on disk: **293 KB** (independent of the fix)

### Bottom line

- **8 net lines of hand-written code** permanently shipped.
- **~5 MB net `node_modules` growth**, ~80% of which is duplicate Clerk packages from
  the version pin.
- If `@clerk/nextjs` is ever loosened back to `^6.12.4` (or upgraded to a newer release
  that solves the Edge issue natively), most of those duplicates dedupe away and the
  ~5 MB largely disappears.

Measurement commands used:

```bash
# Net line change
git diff --stat d06b765^..83436b0 -- ':!doc/*.md' ':!package-lock.json'

# Net package count change
diff <(git show d06b765^:package-lock.json | grep -oE '"node_modules/[^"]+"' | sort -u) \
     <(git show 83436b0:package-lock.json   | grep -oE '"node_modules/[^"]+"' | sort -u)

# Per-package disk size
du -sk node_modules/<package>
```
