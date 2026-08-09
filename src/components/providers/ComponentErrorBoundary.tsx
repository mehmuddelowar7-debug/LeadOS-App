import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-card border rounded-xl border-destructive/20 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
          <h3 className="text-sm font-semibold mb-2 text-foreground">Failed to load component</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm">
            {this.props.fallbackMessage || this.state.error?.message || 'An unexpected error occurred while rendering this module.'}
          </p>
          <Button variant="outline" size="sm" onClick={this.resetError} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
