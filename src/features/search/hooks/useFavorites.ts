import { useState, useEffect, useCallback } from 'react'
import type { SearchResult } from '@/engine/search/types'

const STORAGE_KEY = 'recruitos_favorite_searches'

export function useFavorites() {
  const [favorites, setFavorites] = useState<SearchResult[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setFavorites(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load favorite searches', e)
    }
  }, [])

  const toggleFavorite = useCallback((result: SearchResult) => {
    setFavorites(prev => {
      const isFav = prev.some(r => r.id === result.id)
      let updated
      if (isFav) {
        updated = prev.filter(r => r.id !== result.id)
      } else {
        updated = [...prev, result]
      }
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save favorite searches', e)
      }
      
      return updated
    })
  }, [])

  const isFavorite = useCallback((id: string) => {
    return favorites.some(r => r.id === id)
  }, [favorites])

  return { favorites, toggleFavorite, isFavorite }
}
