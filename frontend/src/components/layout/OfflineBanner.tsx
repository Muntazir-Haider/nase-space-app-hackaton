import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface OfflineBannerProps {
  onRetry: () => void;
  retrying: boolean;
}

export function OfflineBanner({ onRetry, retrying }: OfflineBannerProps) {
  return (
    <div className="bg-rose-950/90 border-b border-rose-500/50 text-rose-200 px-6 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-900/60 border border-rose-500/40 text-rose-300 mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-wide text-white flex items-center gap-2">
              STATION ENGINE CONNECTING · OFFLINE MODE ACTIVE
            </h4>
            <p className="text-xs text-rose-200/90 mt-0.5">
              Connecting to the local station engine at <code className="bg-rose-900/40 px-1 py-0.5 rounded font-mono text-rose-300">http://127.0.0.1:8000</code>.
              The workstation is checking connection automatically every 2.5 seconds.
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-rose-300">
              <Terminal className="w-3.5 h-3.5" />
              <span>To start manually: <code>python -m uvicorn backend.app.main:app --reload --port 8000</code> or run <code>run_all.bat</code></span>
            </div>
          </div>
        </div>

        <button
          onClick={onRetry}
          disabled={retrying}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow whitespace-nowrap self-end md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Connecting...' : 'Check Connection'}</span>
        </button>
      </div>
    </div>
  );
}
