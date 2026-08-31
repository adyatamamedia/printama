import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error in component tree:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-background text-foreground text-center select-none">
          <div className="max-w-md w-full bg-card border border-border p-6 rounded-xl shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-foreground">Terjadi Kendala Tampilan</h2>
              <p className="text-xs text-muted-foreground">
                {this.state.error?.message || 'Terjadi kesalahan tidak terduga pada modul.'}
              </p>
            </div>
            {this.state.errorInfo?.componentStack && (
              <pre className="text-[10px] text-left p-3 rounded bg-muted/50 border border-border overflow-x-auto max-h-32 text-muted-foreground font-mono">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-primary hover:bg-primary-hover text-slate-950 text-xs font-extrabold transition-colors shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Muat Ulang Tampilan</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
