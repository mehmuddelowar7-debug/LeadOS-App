import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useSearchStore } from './useSearchStore'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

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
          navigate('/contacts/new')
          break
        case 'f':
          e.preventDefault()
          navigate('/queue')
          break
        case 'd':
          e.preventDefault()
          navigate('/')
          break
        case 'i':
          e.preventDefault()
          navigate('/insights')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}
