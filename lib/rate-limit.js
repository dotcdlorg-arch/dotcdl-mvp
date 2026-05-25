// In-memory rate limiter. Per-process only — not shared across serverless instances.
// Acceptable as temporary cost protection; replace with Upstash/Vercel KV for full coverage.
const store = new Map()

export function checkRateLimit(userId, key, max, windowMs = 60_000) {
  const bucket = `${userId}:${key}:${Math.floor(Date.now() / windowMs)}`
  const count = (store.get(bucket) || 0) + 1
  store.set(bucket, count)
  // Evict stale buckets to prevent unbounded growth
  if (store.size > 1000) {
    const cutoff = Math.floor(Date.now() / windowMs) - 2
    for (const k of store.keys()) {
      if (parseInt(k.split(':')[2]) < cutoff) store.delete(k)
    }
  }
  return count > max
}
