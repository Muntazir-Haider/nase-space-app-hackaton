import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface OfflineBannerProps {
  onRetry: () => void;
  retrying: boolean;
}

export function OfflineBanner({ onRetry, retrying }: OfflineBannerProps) {
  return (
    <div className="bg-red-950/90 border-b border-red-500/50 text-red-200 px-6 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-900/60 border border-red-500/40 text-red-400 mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-wide text-white flex items-center gap-2">
              LOCAL STATION DISCONNECTED · OFFLINE STANDALONE MODE
            </h4>
            <p className="text-xs text-red-200/90 mt-0.5">
              Cannot reach the local FastAPI server at <code className="bg-red-900/40 px-1 py-0.5 rounded font-mono text-red-300">http://127.0.0.1:8000</code>.
              Data updates and scenario switches require the local station engine to be active.
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-red-300">
              <Terminal className="w-3.5 h-3.5" />
              <span>To start the backend, run: <code>uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000</code></span>
            </div>
          </div>
        </div>

        <button
          onClick={onRetry}
          disabled={retrying}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold transition shadow whitespace-nowrap self-end md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Connecting...' : 'Retry Connection'}</span>
        </button>
      </div>
    </div>
  );
}
