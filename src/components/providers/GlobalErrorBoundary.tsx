import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Trash2, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  isRecovering: boolean
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isRecovering: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isRecovering: false }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught React Exception', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  }

  private handleSoftReset = () => {
    this.setState({ hasError: false, error: null })
  }

  private handleHardReset = async () => {
    this.setState({ isRecovering: true })
    try {
      // 1. Unregister Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const reg of registrations) {
          await reg.unregister()
        }
      }

      // 2. Clear IndexedDB Caches
      const dbs = ['leados_query_cache', 'leados_mutations']
      for (const db of dbs) {
        indexedDB.deleteDatabase(db)
      }

      // 3. Clear Local Storage
      localStorage.clear()
      sessionStorage.clear()

      // 4. Hard Reload
      window.location.replace(window.location.origin)
    } catch (err) {
      console.error('Failed during hard reset', err)
      window.location.reload() // Fallback
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-200">
          <div className="max-w-md w-full bg-black border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/10 blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <AlertTriangle className="h-8 w-8" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2 text-white">Application Error</h2>
              <p className="text-sm text-zinc-400 mb-8">
                LeadOS encountered an unexpected problem. Your data is safe.
              </p>

              <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8 text-left overflow-x-auto">
                <p className="text-xs font-mono text-red-400 font-bold mb-2 flex items-center gap-2">
                  <Code2 className="h-4 w-4" /> Exception
                </p>
                <p className="text-xs font-mono text-zinc-300 break-words">
                  {this.state.error?.message || 'Unknown Error'}
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <Button 
                  onClick={this.handleSoftReset}
                  variant="outline"
                  className="w-full h-12 rounded-xl bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
                
                <Button 
                  onClick={this.handleHardReset}
                  disabled={this.state.isRecovering}
                  className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-200"
                >
                  {this.state.isRecovering ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Purging...</>
                  ) : (
                    <><Trash2 className="mr-2 h-4 w-4" /> Hard Reset Cache</>
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-zinc-600 mt-6">
                Hard reset will clear local caches and reload the application. Unsaved offline data may be lost.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
