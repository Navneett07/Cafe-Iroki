import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';
import { Home, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md flex flex-col items-center gap-6 glassmorphism p-8 rounded-lg border border-border-subtle shadow-premium-lg">
            {/* Elegant warning indicator */}
            <div className="h-16 w-16 flex items-center justify-center rounded-full bg-accent-warm/10 text-accent-warm animate-bounce">
              <span className="text-2xl">🏮</span>
            </div>
            
            <h1 className="text-3xl font-serif font-bold tracking-tight">Something Went Wrong</h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              We encountered a minor disturbance in the kitchen. Let us refresh your experience or return you to our cozy lobby.
            </p>
            
            {this.state.error && (
              <pre className="w-full p-3 bg-brand-dark/5 dark:bg-white/5 text-[10px] text-left font-mono rounded overflow-x-auto text-rose-500/80 border border-border-subtle/30">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex items-center gap-4 w-full mt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1 gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={16} />
                <span>Retry</span>
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 gap-2 bg-brand-primary text-white"
                onClick={this.handleReset}
              >
                <Home size={16} />
                <span>Home</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
