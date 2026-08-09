import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, User, Phone, Calendar, Clock, Columns3, Megaphone, Moon, UserPlus, FileText, Settings, Star, StarOff, Command } from 'lucide-react'
import { useAppNavigate } from '@/lib/routes'
import { Input } from '@/components/ui/input'
import { analytics } from '@/lib/analytics'
import { useSearchIndex } from '../hooks/useSearchIndex'
import { useRecentSearches } from '../hooks/useRecentSearches'
import { useFavorites } from '../hooks/useFavorites'
import { searchEngine } from '@/engine/search'
import type { SearchResult } from '@/engine/search/types'
import { cn } from '@/lib/utils'

interface GlobalCommandPaletteProps {
  open: boolean
  onClose: () => void
}

const ICONS: Record<string, any> = {
  User, Phone, Calendar, Clock, Columns3, Megaphone, Moon, UserPlus, FileText, Settings, Command
}

export function GlobalCommandPalette({ open, onClose }: GlobalCommandPaletteProps) {
  const [query, setQuery] = useState('')
  const navigate = useAppNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  
  const index = useSearchIndex()
  const { recentSearches, addRecentSearch } = useRecentSearches()
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Use search engine locally
  const results = searchEngine(query, index, 15)

  // If query is empty, show favorites then recent searches
  const displayResults = query.trim() ? results : [...favorites, ...recentSearches.filter(r => !isFavorite(r.id))].slice(0, 15)

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
    }
  }, [open])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!open) return
      
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, displayResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (displayResults[selectedIndex]) {
          handleSelect(displayResults[selectedIndex])
        }
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onClose, displayResults, selectedIndex])

  const handleSelect = (result: SearchResult) => {
    analytics.trackEvent('search', `select_result_${result.type}`)
    addRecentSearch(result)
    onClose()
    
    // Handle URL parameters (e.g., ?endDay=true)
    if (result.route.includes('?')) {
       // simple navigate doesn't support search params well if using path string with router sometimes, 
       // but useAppNavigate should handle full URLs in our mock setup.
       navigate(result.route as any)
    } else {
       navigate(result.route as any)
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
        >
          {/* Search Header */}
          <div className="relative flex items-center p-3 border-b border-border/50 bg-background/50">
            <Search className="absolute left-6 h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidates, phone, campaigns, or actions..."
              className="pl-10 border-0 bg-transparent h-14 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg shadow-none"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-14 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <div className="absolute right-6 px-2 py-1 bg-muted rounded text-[10px] font-bold text-muted-foreground">
              ESC
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
            {displayResults.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Command className="h-10 w-10 text-muted-foreground/30" />
                  <p className="font-semibold text-foreground">No results found.</p>
                  <div className="text-xs space-y-1">
                    <p>Try searching by:</p>
                    <p>• Candidate name or phone</p>
                    <p>• Campaign or creative name</p>
                    <p>• Quick actions (e.g., "Add Candidate")</p>
                  </div>
                </div>
              </div>
            )}

            {displayResults.length > 0 && (
              <div className="space-y-1">
                {displayResults.map((result, idx) => {
                  const IconComponent = ICONS[result.icon || 'Command'] || Command
                  const isFav = isFavorite(result.id)

                  return (
                    <div
                      key={result.id}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors group",
                        selectedIndex === idx ? "bg-primary/10" : "hover:bg-muted"
                      )}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                          result.type === 'action' ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900" :
                          result.type === 'candidate' ? "bg-blue-500/10 text-blue-500" :
                          result.type === 'campaign' ? "bg-purple-500/10 text-purple-500" :
                          result.type === 'report' ? "bg-orange-500/10 text-orange-500" :
                          "bg-primary/10 text-primary"
                        )}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-semibold text-sm text-foreground truncate flex items-center gap-2">
                            {result.title}
                            {result.type === 'action' && (
                              <span className="px-1.5 py-0.5 rounded border border-border text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                                Command
                              </span>
                            )}
                          </div>
                          {result.subtitle && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(result)
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-colors shrink-0 ml-2",
                          isFav ? "text-yellow-500" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-background"
                        )}
                      >
                        {isFav ? <Star className="h-4 w-4 fill-yellow-500" /> : <StarOff className="h-4 w-4" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Footer Shortcuts */}
          <div className="p-3 border-t border-border/50 bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border shadow-sm">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-background border shadow-sm">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border shadow-sm">↵</kbd>
                to select
              </span>
            </div>
            <div>Powered by React Query Cache</div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
