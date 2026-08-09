import type { SearchResult } from './types'

// Simple sequence match: e.g., "jk" matches "joker"
function isFuzzyMatch(query: string, text: string): boolean {
  if (!query || !text) return false
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  let qIdx = 0
  for (let i = 0; i < t.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++
    }
    if (qIdx === q.length) return true
  }
  return false
}

function calculateRank(result: SearchResult, query: string): number {
  if (!query) return result.priority // Base priority if no query

  const q = query.toLowerCase().trim()
  let maxScore = 0

  const title = result.title.toLowerCase()
  const subtitle = result.subtitle?.toLowerCase() || ''
  const keywords = result.keywords?.map(k => k.toLowerCase()) || []

  // Clean query for phone checks
  const qPhone = q.replace(/\D/g, '')

  // 1. Exact Phone Match
  if (qPhone.length > 5 && result.type === 'candidate' && subtitle.replace(/\D/g, '').includes(qPhone)) {
    maxScore = Math.max(maxScore, 100)
  }

  // 2. Exact Name / Title Match
  if (title === q) {
    maxScore = Math.max(maxScore, 90)
  }

  // 3. Prefix Match on Title
  if (title.startsWith(q)) {
    maxScore = Math.max(maxScore, 80)
  }

  // 4. Exact Keyword Match
  if (keywords.includes(q)) {
    maxScore = Math.max(maxScore, 70)
  }

  // 5. Substring Match on Title
  if (title.includes(q)) {
    maxScore = Math.max(maxScore, 65)
  }

  // 6. Fuzzy Match on Title
  if (isFuzzyMatch(q, title)) {
    maxScore = Math.max(maxScore, 60)
  }

  // 7. Substring Match on Subtitle/Keywords
  if (subtitle.includes(q) || keywords.some(k => k.includes(q))) {
    maxScore = Math.max(maxScore, 50)
  }

  // 8. Fuzzy Match on Subtitle/Keywords
  if (isFuzzyMatch(q, subtitle) || keywords.some(k => isFuzzyMatch(q, k))) {
    maxScore = Math.max(maxScore, 40)
  }

  if (maxScore > 0) {
    // Add base priority as a tiebreaker (e.g., P0 action vs P2 action)
    // Assuming base priority is 0-10, we can add it as a decimal.
    return maxScore + (result.priority / 100)
  }

  return 0
}

export function searchEngine(query: string, index: SearchResult[], limit = 20): SearchResult[] {
  if (!query.trim()) {
    // Return top N items sorted by priority
    return [...index]
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit)
  }

  const results = index
    .map(item => ({
      ...item,
      rankScore: calculateRank(item, query)
    }))
    .filter(item => item.rankScore > 0)
    
  // Sort by rankScore desc, then title asc
  results.sort((a, b) => {
    if (b.rankScore !== a.rankScore) {
      return (b.rankScore || 0) - (a.rankScore || 0)
    }
    return a.title.localeCompare(b.title)
  })

  return results.slice(0, limit)
}
