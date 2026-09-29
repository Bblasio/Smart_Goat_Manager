import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Database } from 'lucide-react';
import { cleanStorageQuota, clearAllFarmCaches } from '../utils/safeStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isQuotaError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isQuotaError: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const isQuota =
      error &&
      (error.name === 'QuotaExceededError' ||
        (typeof error.message === 'string' && error.message.toLowerCase().includes('quota')));
    return { hasError: true, error, errorInfo: null, isQuotaError: Boolean(isQuota) };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    const isQuota =
      error &&
      (error.name === 'QuotaExceededError' ||
        (typeof error.message === 'string' && error.message.toLowerCase().includes('quota')));

    if (isQuota) {
      console.warn('Storage quota error detected by ErrorBoundary. Running automatic storage cleanup.');
      cleanStorageQuota();
    }

    this.setState({ errorInfo, isQuotaError: Boolean(isQuota) });
  }

  private handleReload = () => {
    if (this.state.isQuotaError) {
      cleanStorageQuota();
    }
    window.location.reload();
  };

  private handleReset = () => {
    clearAllFarmCaches();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isQuota = this.state.isQuotaError;

      return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl text-center space-y-5">
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${
              isQuota
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              {isQuota ? <Database className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isQuota ? 'Storage Cache Cleaned' : 'Something went wrong'}
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                {isQuota
                  ? 'Your browser reached its local cache storage limit. Unnecessary local cached items have been cleared. Your live farm records in the database remain safe.'
                  : 'An unexpected view error occurred while rendering the farm management interface. Your farm data is stored safely.'}
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80 text-left overflow-auto max-h-32 text-[11px] font-mono text-rose-300">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isQuota ? 'Reload Farm App' : 'Reload Application'}</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs border border-stone-700 transition-colors cursor-pointer"
                title="Purge local temporary storage and reload"
              >
                Clear Storage Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
