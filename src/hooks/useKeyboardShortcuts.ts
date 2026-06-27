import { ROUTES } from '@/lib/routes'
import { useEffect } from 'react'
import { useAppNavigate } from '@/lib/routes'
import { useSearchStore } from './useSearchStore'

export function useKeyboardShortcuts() {
  const navigate = useAppNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement

      // Meta/Ctrl shortcuts
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k') {
          e.preventDefault()
          useSearchStore.getState().openSearch()
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          const form = target.closest('form')
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
          }
        }
        return
      }

      // Don't trigger single-key shortcuts if user is typing in an input or textarea
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Single key shortcuts
      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault()
          navigate(ROUTES.CONTACTS_NEW)
          break
        case 'f':
          e.preventDefault()
          navigate('/queue')
          break
        case 'd':
          e.preventDefault()
          navigate(ROUTES.HOME)
          break
        case 'i':
          e.preventDefault()
          navigate(ROUTES.INSIGHTS)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}
