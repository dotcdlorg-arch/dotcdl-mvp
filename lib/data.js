import questionsRaw from '../data/questions.json'
import signsRaw from '../data/signs.json'

export const QUESTIONS = questionsRaw
export const SIGNS = signsRaw
export const Q_CATEGORIES = [...new Set(QUESTIONS.map(q => q.category))]
export const Q_DIFFICULTIES = ['Beginner', 'Intermediate', 'Mock Test']
export const S_CATEGORIES = [...new Set(SIGNS.map(s => s.category))]

export function getExplanation(item, lang) {
  if (lang === 'en') return ''
  return item[`explanation_${lang}`] || item.explanation_zh || ''
}

export function scoreKeywords(text, keywords) {
  if (!text || !keywords?.length) return 0
  const lower = text.toLowerCase()
  const hits = keywords.filter(k => lower.includes(k.toLowerCase())).length
  const hasWords = /[a-zA-Z]{3,}/.test(text)
  return Math.min(100, (hasWords ? 20 : 0) + Math.round((hits / keywords.length) * 80))
}

// Build conversation scenarios from questions grouped by category
export function buildScenario(category) {
  return QUESTIONS.filter(q => q.category === category).slice(0, 6)
}

// All conversation scenario types for Drive Mode
export const SCENARIOS = [
  {
    id: 'full_stop',
    name: 'Full Roadside Stop',
    description: 'Complete DOT inspection simulation — all topics',
    icon: '🚔',
    categories: ['Basic Identity / Documents', 'Route / Cargo', 'HOS / ELD', 'Vehicle Condition'],
    difficulty: 'Hard',
  },
  {
    id: 'documents',
    name: 'Document Check',
    description: 'CDL, registration, medical card, insurance',
    icon: '📋',
    categories: ['Basic Identity / Documents'],
    difficulty: 'Easy',
  },
  {
    id: 'cargo',
    name: 'Cargo & Route',
    description: 'What you are hauling, where you are going',
    icon: '📦',
    categories: ['Route / Cargo'],
    difficulty: 'Easy',
  },
  {
    id: 'hos',
    name: 'Hours of Service / ELD',
    description: 'Logbook, ELD, hours driven, rest periods',
    icon: '⏱',
    categories: ['HOS / ELD'],
    difficulty: 'Medium',
  },
  {
    id: 'vehicle',
    name: 'Vehicle Condition',
    description: 'Pre-trip inspection, brakes, lights, tires',
    icon: '🔧',
    categories: ['Vehicle Condition'],
    difficulty: 'Medium',
  },
  {
    id: 'emergency',
    name: 'Accident & Emergency',
    description: 'Accident reporting, emergency procedures',
    icon: '🚨',
    categories: ['Accident / Emergency'],
    difficulty: 'Hard',
  },
]
