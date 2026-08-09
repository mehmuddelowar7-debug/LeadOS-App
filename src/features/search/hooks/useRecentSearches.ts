import { useState, useEffect, useCallback } from 'react'
import type { SearchResult } from '@/engine/search/types'

const STORAGE_KEY = 'recruitos_recent_searches'
const MAX_RECENT = 10

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load recent searches', e)
    }
  }, [])

  const addRecentSearch = useCallback((result: SearchResult) => {
    setRecentSearches(prev => {
      // Remove if already exists to move it to the top
      const filtered = prev.filter(r => r.id !== result.id)
      const updated = [result, ...filtered].slice(0, MAX_RECENT)
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save recent searches', e)
      }
      
      return updated
    })
  }, [])

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { recentSearches, addRecentSearch, clearRecentSearches }
}
