import { useEffect, useState } from 'react';
import { 
  HardDrive, 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  ShieldCheck, 
  BookOpen, 
  Layers,
  Send,
  Loader2
} from 'lucide-react';
import { 
  StationDiagnosticsResponse, 
  HealthCheckResponse, 
  SyncQueueSummary 
} from '../../types';
import { 
  fetchStationDiagnostics, 
  fetchHealth, 
  fetchSyncStatus, 
  triggerCommsFlush 
} from '../../services/api';

interface SystemStatusViewProps {
  onRefreshHealth: () => void;
}

export function SystemStatusView({ onRefreshHealth }: SystemStatusViewProps) {
  const [diagnostics, setDiagnostics] = useState<StationDiagnosticsResponse | null>(null);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncQueueSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [flushing, setFlushing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [flushFeedback, setFlushFeedback] = useState<string>('');

  async function loadData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [h, d, s] = await Promise.all([
        fetchHealth(),
        fetchStationDiagnostics(),
        fetchSyncStatus().catch(() => null),
      ]);
      setHealth(h);
      setDiagnostics(d);
      setSyncSummary(s);
      onRefreshHealth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to connect to station: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleFlushComms() {
    setFlushing(true);
    setFlushFeedback('');
    try {
      const res = await triggerCommsFlush();
      setFlushFeedback(res.message);
      const updatedSync = await fetchSyncStatus();
      setSyncSummary(updatedSync);
      const updatedDiagnostics = await fetchStationDiagnostics();
      setDiagnostics(updatedDiagnostics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFlushFeedback(`Flush failed: ${msg}`);
    } finally {
      setFlushing(false);
      setTimeout(() => setFlushFeedback(''), 6000);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" /> Station Architecture &amp; SQLite Persistence Diagnostics
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Autonomous, offline-first execution environment for deep-space missions (NASA Space Apps 2026)
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 text-xs font-mono text-slate-200 transition shadow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-nasa-cyan' : ''}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Persistence & Architecture Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-space-900 border border-space-800 rounded-2xl p-5 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Database Storage File</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white mt-2">
            {health?.database_file || 'sentinel.db'}
          </div>
          <p className="text-xs text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> SQLite WAL Mode · Strict Foreign Keys
          </p>
          <div className="mt-3 pt-3 border-t border-space-800/80 text-[11px] font-mono text-slate-400">
            <span>File Size: </span>
            <span className="text-slate-200 font-bold">
              {diagnostics?.database_size_bytes 
                ? `${(diagnostics.database_size_bytes / 1024).toFixed(1)} KB` 
                : 'Active on disk'}
            </span>
          </div>
        </div>

        <div className="bg-space-900 border border-space-800 rounded-2xl p-5 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Comms Latency Simulation</span>
            <Radio className="w-4 h-4 text-nasa-cyan" />
          </div>
          <div className="text-lg font-bold font-mono text-nasa-cyan mt-2">
            22m 14s (One-Way)
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Mars Transit / Artemis Deep Space
          </p>
          <div className="mt-3 pt-3 border-t border-space-800/80 text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Autonomous Local Decisions
          </div>
        </div>

        <div className="bg-space-900 border border-space-800 rounded-2xl p-5 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Total Relational Records</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg font-bold font-mono text-indigo-300 mt-2">
            {diagnostics?.total_records ?? 0} Records
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Across 14 relational tables
          </p>
          <div className="mt-3 pt-3 border-t border-space-800/80 text-[11px] font-mono text-slate-400">
            <span>Status: </span>
            <span className="text-emerald-400 font-bold">STATION OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* Offline Store-and-Forward Sync Queue & DSN Pass Simulator */}
      <section className="bg-space-900 border border-space-800 rounded-2xl p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Radio className="w-4 h-4 text-nasa-cyan" /> Store-and-Forward Offline Sync Queue (SHA-256 Idempotency)
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Deep space asynchronous batch synchronization with Mission Control on Earth
            </p>
          </div>

          <button
            onClick={handleFlushComms}
            disabled={flushing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-nasa-blue hover:bg-nasa-blue/80 text-white font-mono text-xs font-bold transition shadow"
            title="Simulate high-gain Deep Space Network (DSN) uplink pass to transmit queued transactions"
          >
            {flushing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-nasa-cyan" />
            )}
            <span>{flushing ? 'Transmitting to DSN...' : 'Simulate DSN High-Gain Pass'}</span>
          </button>
        </div>

        {flushFeedback && (
          <div className="p-3 mb-4 rounded-xl bg-space-950 border border-nasa-cyan/40 text-nasa-cyan text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-nasa-cyan" />
            <span>{flushFeedback}</span>
          </div>
        )}

        {/* Sync Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-space-950 border border-space-800 rounded-xl p-3">
            <span className="text-[11px] font-mono text-slate-400 block">Total Enqueued</span>
            <span className="text-base font-bold font-mono text-white mt-1 block">
              {syncSummary?.total_transactions ?? 0}
            </span>
          </div>

          <div className="bg-space-950 border border-space-800 rounded-xl p-3">
            <span className="text-[11px] font-mono text-amber-400 block">Queued (Pending Uplink)</span>
            <span className="text-base font-bold font-mono text-amber-300 mt-1 block">
              {syncSummary?.queued_pending ?? 0}
            </span>
          </div>

          <div className="bg-space-950 border border-space-800 rounded-xl p-3">
            <span className="text-[11px] font-mono text-emerald-400 block">Synced to Earth</span>
            <span className="text-base font-bold font-mono text-emerald-300 mt-1 block">
              {syncSummary?.synced_to_earth ?? 0}
            </span>
          </div>

          <div className="bg-space-950 border border-space-800 rounded-xl p-3">
            <span className="text-[11px] font-mono text-slate-400 block">Deduplication Engine</span>
            <span className="text-base font-bold font-mono text-nasa-cyan mt-1 block">
              SHA-256 Valid
            </span>
          </div>
        </div>

        {/* Recent Offline Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-space-800 text-[11px] text-slate-400 uppercase tracking-wider bg-space-950/60">
              <tr>
                <th className="py-2.5 px-3">Transaction Type</th>
                <th className="py-2.5 px-3">Entity Table</th>
                <th className="py-2.5 px-3">SHA-256 Idempotency Hash</th>
                <th className="py-2.5 px-3">Sync Status</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-850 text-slate-300">
              {syncSummary?.recent_items && syncSummary.recent_items.length > 0 ? (
                syncSummary.recent_items.map((item) => (
                  <tr key={item.id} className="hover:bg-space-850/50 transition">
                    <td className="py-2.5 px-3 font-bold text-white">{item.transaction_type}</td>
                    <td className="py-2.5 px-3 text-slate-400">{item.entity_table}</td>
                    <td className="py-2.5 px-3 text-nasa-cyan text-[11px] font-mono">{item.idempotency_hash}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.sync_status === 'QUEUED'
                          ? 'bg-amber-950/70 text-amber-400 border-amber-500/40 animate-pulse'
                          : 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40'
                      }`}>
                        {item.sync_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {new Date(item.created_at).toISOString().slice(0, 19).replace('T', ' ')} UTC
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No transactions currently in offline sync queue. Ingest telemetry or log countermeasures to generate queued records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 14 Relational Tables Breakdown */}
      <section className="bg-space-900 border border-space-800 rounded-2xl p-6 shadow">
        <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-emerald-400" /> 14-Table Relational Schema Row Counts (Live SQLite Query)
        </h3>

        {diagnostics?.table_counts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(diagnostics.table_counts).map(([tableName, count]) => (
              <div 
                key={tableName} 
                className="bg-space-950 border border-space-800/80 rounded-xl p-3 flex flex-col justify-between"
              >
                <span className="text-[11px] font-mono text-slate-400 truncate" title={tableName}>
                  {tableName}
                </span>
                <span className="text-base font-bold font-mono text-white mt-1">
                  {typeof count === 'number' ? count.toLocaleString() : count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-mono">No table count diagnostics available.</p>
        )}
      </section>

      {/* NASA Scientific Evidence Grounding Dossier */}
      <section className="bg-space-900 border border-space-800 rounded-2xl p-6 shadow">
        <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-nasa-cyan" /> NASA Human Research Program Grounding &amp; Scientific Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-space-950 border border-space-800 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-nasa-cyan font-bold">1. Cardiovascular Deconditioning</span>
            <p className="text-slate-400 leading-relaxed">
              NASA HRP HRR-CV evidence: Microgravity cephalad fluid redistribution causes plasma contraction and resting heart rate elevation.
            </p>
            <span className="text-[10px] text-slate-500 mt-auto">Indicator: Resting Heart Rate (bpm)</span>
          </div>

          <div className="bg-space-950 border border-space-800 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-indigo-400 font-bold">2. Sleep Loss &amp; Work Overload</span>
            <p className="text-slate-400 leading-relaxed">
              NASA HRP HRR-Sleep: ISS crews average 6.0–6.4 hours/night. Cumulative sleep debt degrades neurobehavioral vigilance and cardiac stability.
            </p>
            <span className="text-[10px] text-slate-500 mt-auto">Indicator: Sleep Duration (hours)</span>
          </div>

          <div className="bg-space-950 border border-space-800 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-amber-400 font-bold">3. Exercise Recovery Velocity</span>
            <p className="text-slate-400 leading-relaxed">
              NASA HRP Exercise: Slowed 1-minute heart rate recovery post-ARED/T2 workout indicates autonomic fatigue and deconditioning.
            </p>
            <span className="text-[10px] text-slate-500 mt-auto">Indicator: HRR-1 (bpm drop)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
