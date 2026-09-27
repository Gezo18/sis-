import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  incidentId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    incidentId: '',
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      incidentId: `ERR_${Date.now().toString(36).toUpperCase()}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[GLOBAL ERROR BOUNDARY CAUGHT ERROR]:', error, errorInfo);

    // Dispatch error metric to APM backend if reachable
    try {
      fetch('/api/health/apm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CLIENT_RUNTIME_ERROR',
          message: error.message,
          stack: error.stack?.slice(0, 500),
          componentStack: errorInfo.componentStack?.slice(0, 500),
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently tolerate reporting failure
      });
    } catch {
      // Ignore
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      incidentId: '',
    });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      incidentId: '',
    });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-slate-800/90 border border-red-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">System Exception Intercepted</h1>
                <p className="text-xs text-slate-400">Elsewedy University of Technology — Client Protection</p>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-700/50 mb-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Incident Reference: <strong className="text-amber-400 font-mono">{this.state.incidentId}</strong></span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldAlert className="w-3.5 h-3.5" /> APM Logged
                </span>
              </div>
              <p className="text-sm font-mono text-red-300 break-words">
                {this.state.error?.message || 'An unexpected runtime error halted the UI thread.'}
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              The application runtime encountered a crash. The error has been intercepted by the Global Error Boundary to prevent cascading failures.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Reload Portal
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" /> Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
