import { createContext, useContext, useEffect, useState } from 'react'
import { syncOfflineMutations, getMutationQueue } from '@/lib/offlineSync'
import { WifiOff, CloudUpload, CloudLightning } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NetworkContextType {
  isOnline: boolean
  pendingMutations: number
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  pendingMutations: 0,
})

export function useNetwork() {
  return useContext(NetworkContext)
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingMutations, setPendingMutations] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Poller to check queue size
  useEffect(() => {
    const checkQueue = async () => {
      const queue = await getMutationQueue()
      setPendingMutations(queue.length)
    }
    
    checkQueue()
    const interval = setInterval(checkQueue, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      setIsSyncing(true)
      await syncOfflineMutations()
      setIsSyncing(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <NetworkContext.Provider value={{ isOnline, pendingMutations }}>
      {children}
      
      {/* Global Sync Indicator */}
      <AnimatePresence>
        {(!isOnline || pendingMutations > 0 || isSyncing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-safe pt-2 left-0 right-0 z-50 flex justify-center pointer-events-none"
            )}
          >
            <div className={cn(
              "glass px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold tracking-wider shadow-lg border",
              !isOnline ? "text-red-500 border-red-500/20 bg-red-500/10" :
              isSyncing ? "text-amber-500 border-amber-500/20 bg-amber-500/10" :
              "text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
            )}>
              {!isOnline ? (
                <>
                  <WifiOff className="h-3 w-3" /> OFFLINE ({pendingMutations} queued)
                </>
              ) : isSyncing ? (
                <>
                  <CloudUpload className="h-3 w-3 animate-bounce" /> SYNCING...
                </>
              ) : pendingMutations > 0 ? (
                <>
                  <CloudLightning className="h-3 w-3" /> PENDING ({pendingMutations})
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NetworkContext.Provider>
  )
}
