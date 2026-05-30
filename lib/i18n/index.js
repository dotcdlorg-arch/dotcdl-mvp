import en from './messages.en'
import zh from './messages.zh'
import es from './messages.es'
import hi from './messages.hi'
import pa from './messages.pa'
import vi from './messages.vi'

const dict = { en, zh, es, hi, pa, vi }

const warned = new Set()

export function t(lang, key) {
  const hit = dict[lang]?.[key] ?? dict.en[key]
  if (hit === undefined && process.env.NODE_ENV !== 'production' && !warned.has(key)) {
    warned.add(key)
    console.warn(`[i18n] missing key: "${key}"`)
  }
  return hit ?? key
}

if (process.env.NODE_ENV !== 'production') {
  const enKeys = Object.keys(en)
  for (const [name, m] of Object.entries({ zh, es, hi, pa, vi })) {
    const missing = enKeys.filter(k => !(k in m))
    if (missing.length) {
      console.warn(`[i18n] ${name} is missing ${missing.length} key(s):`, missing.slice(0, 5))
    }
  }
}
