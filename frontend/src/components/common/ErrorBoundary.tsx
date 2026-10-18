import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  lastGoodRender: ReactNode | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    lastGoodRender: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="relative">
          {/* Keep last good render visible behind alert banner */}
          {this.props.children && (
            <div className="opacity-40 pointer-events-none filter grayscale">
              {this.props.children}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-none z-30">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 rounded-lg border border-red-300 dark:border-red-800 shadow-lg text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {this.props.fallbackTitle || 'Module Render Interrupted'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 font-mono">
                {this.state.error?.message || 'An unexpected runtime error occurred.'}
              </p>
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Module</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
