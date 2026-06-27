/// <reference types="vite-plugin-pwa/client" />
import { useEffect } from 'react'
// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'

export function PWAUpdater() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      // Optional: check for updates every hour
      if (r) {
        setInterval(() => {
          r.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error: any) {
      console.error('SW registration error', error)
    },
  })

  useEffect(() => {
    if (offlineReady) {
      toast.success('App ready for offline use')
      setOfflineReady(false)
    }
  }, [offlineReady, setOfflineReady])

  useEffect(() => {
    if (needRefresh) {
      toast('Update Available', {
        description: 'A new version of LeadOS is ready.',
        icon: <Download className="h-4 w-4 text-primary" />,
        duration: 20000, // keep it open longer
        action: {
          label: 'Reload',
          onClick: () => updateServiceWorker(true),
        },
        onDismiss: () => setNeedRefresh(false)
      })
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}
