import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class RouteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Routing error caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-6" />
          <h1 className="text-2xl font-bold mb-3">Navigation Error</h1>
          <p className="text-muted-foreground text-sm max-w-md mb-8">
            We encountered an unexpected error while routing.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a 
              href={ROUTES.HOME}
              onClick={() => { this.setState({ hasError: false }) }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-primary/90 transition-colors w-full justify-center"
            >
              <Home className="h-5 w-5" />
              Return Home
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-secondary/80 transition-colors w-full justify-center"
            >
              <RefreshCw className="h-5 w-5" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
