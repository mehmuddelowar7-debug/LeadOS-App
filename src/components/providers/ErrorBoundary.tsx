import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6 text-center space-y-6">
          <div className="h-20 w-20 rounded-3xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <div className="space-y-2 max-w-md">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              We encountered an unexpected error. Please try reloading the application. If the problem persists, contact support.
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            className="h-12 px-8 rounded-xl font-bold text-base shadow-lg shadow-primary/20"
          >
            <RefreshCw className="mr-2 h-5 w-5" /> Reload LeadOS
          </Button>
          
          {import.meta.env.MODE !== 'production' && this.state.error && (
            <div className="mt-8 p-4 bg-muted rounded-xl text-left max-w-2xl overflow-auto text-xs font-mono text-red-500 w-full">
              {this.state.error.toString()}
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
