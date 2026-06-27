import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, User, Phone } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'
import { Input } from '@/components/ui/input'

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: results, isLoading } = useQuery({
    queryKey: ['globalSearch', debouncedQuery, user?.id],
    queryFn: async () => {
      if (!user || !debouncedQuery.trim() || debouncedQuery.length < 2) return []

      const workspaceId = user.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'

      // Search contacts by name or phone
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, phone, roles')
        .eq('workspace_id', workspaceId)
        .or(`name.ilike.%${debouncedQuery}%,phone.ilike.%${debouncedQuery}%`)
        .limit(10)

      if (error) {
        console.error('Search error:', error)
        throw error
      }
      return data || []
    },
    enabled: open && debouncedQuery.length >= 2 && !!user
  })

  // Keyboard shortcut listener handled in useKeyboardShortcuts, 
  // but we can add Escape to close here.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onClose])

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
        >
          {/* Search Header */}
          <div className="relative flex items-center p-3 border-b border-border/50 bg-background/50">
            <Search className="absolute left-6 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts by name or phone..."
              className="pl-10 border-0 bg-transparent h-12 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              autoFocus
            />
            <button 
              onClick={onClose}
              className="absolute right-4 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {query.length < 2 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search...
              </div>
            )}
            
            {isLoading && query.length >= 2 && (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
              </div>
            )}

            {!isLoading && results?.length === 0 && query.length >= 2 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No results found for "{query}".
              </div>
            )}

            {!isLoading && results && results.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contacts
                </div>
                {results.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      onClose()
                      navigate(`/contacts/${contact.id}`)
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-left transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{contact.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {contact.phone}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer Shortcuts */}
          <div className="p-3 border-t border-border/50 bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground">Cmd+K</span> to open
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground">Esc</span> to close
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
