import { useEffect, useState } from 'react';
import { 
  HardDrive, 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  ShieldCheck, 
  Layers, 
  Send, 
  Loader2, 
  Download, 
  Wind, 
  PlusCircle, 
  X 
} from 'lucide-react';
import { 
  StationDiagnosticsResponse, 
  HealthCheckResponse, 
  SyncQueueSummary, 
  EnvironmentalTelemetryItem 
} from '../../types';
import { 
  fetchStationDiagnostics, 
  fetchHealth, 
  fetchSyncStatus, 
  triggerCommsFlush, 
  fetchDatabaseSnapshot, 
  fetchEnvironmentalTelemetry, 
  recordEnvironmentalTelemetry 
} from '../../services/api';

interface SystemStatusViewProps {
  onRefreshHealth: () => void;
}

export function SystemStatusView({ onRefreshHealth }: SystemStatusViewProps) {
  const [diagnostics, setDiagnostics] = useState<StationDiagnosticsResponse | null>(null);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncQueueSummary | null>(null);
  const [envReadings, setEnvReadings] = useState<EnvironmentalTelemetryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [flushing, setFlushing] = useState<boolean>(false);
  const [exportingSnapshot, setExportingSnapshot] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [flushFeedback, setFlushFeedback] = useState<string>('');
  const [snapshotFeedback, setSnapshotFeedback] = useState<string>('');
  
  // Habitat Environmental Modal State
  const [showEnvModal, setShowEnvModal] = useState<boolean>(false);
  const [envParam, setEnvParam] = useState<string>('CABIN_CO2_PPM');
  const [envValue, setEnvValue] = useState<number>(550);
  const [envUnit, setEnvUnit] = useState<string>('ppm');
  const [envZone, setEnvZone] = useState<string>('CREW_QUARTERS');
  const [submittingEnv, setSubmittingEnv] = useState<boolean>(false);

  async function loadData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [h, d, s, env] = await Promise.all([
        fetchHealth(),
        fetchStationDiagnostics(),
        fetchSyncStatus().catch(() => null),
        fetchEnvironmentalTelemetry(undefined, 25).catch(() => []),
      ]);
      setHealth(h);
      setDiagnostics(d);
      setSyncSummary(s);
      setEnvReadings(env);
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
      setTimeout(() => setFlushFeedback(''), 5000);
    }
  }

  async function handleExportSnapshot() {
    setExportingSnapshot(true);
    setSnapshotFeedback('');
    try {
      const snap = await fetchDatabaseSnapshot();
      const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      link.download = `sentinel_database_backup_${ts}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSnapshotFeedback(`Database backup exported (${snap.total_tables} tables, ${snap.total_records} records).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSnapshotFeedback(`Snapshot failed: ${msg}`);
    } finally {
      setExportingSnapshot(false);
      setTimeout(() => setSnapshotFeedback(''), 5000);
    }
  }

  async function handleRecordEnv(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingEnv(true);
    try {
      const missionId = envReadings.length > 0 ? envReadings[0].mission_id : 'MISSION-ARTEMIS-III';
      await recordEnvironmentalTelemetry({
        mission_id: missionId,
        parameter_name: envParam,
        value: Number(envValue),
        unit: envUnit,
        habitat_zone: envZone,
        timestamp: new Date().toISOString(),
      });
      setShowEnvModal(false);
      const updatedEnv = await fetchEnvironmentalTelemetry(undefined, 25);
      setEnvReadings(updatedEnv);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to record environmental reading: ${msg}`);
    } finally {
      setSubmittingEnv(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#0b3d91]" /> Station Diagnostics &amp; Environmental Status
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Local storage, environmental telemetry, and store-and-forward comms
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportSnapshot}
            disabled={exportingSnapshot || loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-sm"
          >
            {exportingSnapshot ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Export Backup</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0b3d91]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {snapshotFeedback && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{snapshotFeedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">Database Storage</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2">
            {health?.database_file || 'sentinel.db'}
          </div>
          <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> SQLite WAL Mode · 100% Offline
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-mono">
            <span>Size on disk:</span>
            <span className="text-slate-800 font-bold">
              {diagnostics?.database_size_bytes 
                ? `${(diagnostics.database_size_bytes / 1024).toFixed(1)} KB` 
                : 'Active'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">Earth Comms Latency</span>
            <Radio className="w-4 h-4 text-[#0b3d91]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#0b3d91] mt-2">
            22m 14s (One-Way)
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deep-Space Distance
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-emerald-700 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Local Autonomous Operations
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">Station Records</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2">
            {diagnostics?.total_records ?? 0} Records
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Across 14 relational tables
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-mono text-slate-500">
            <span>Status: </span>
            <span className="text-emerald-700 font-bold">OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* Offline Store-and-Forward Sync Queue & DSN Pass Simulator */}
      <section className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#0b3d91]" /> Store-and-Forward Sync Queue (SHA-256)
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Deep space asynchronous batch sync with Mission Control
            </p>
          </div>

          <button
            onClick={handleFlushComms}
            disabled={flushing}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#0b3d91] hover:bg-blue-800 text-white font-mono text-xs font-bold transition shadow-sm"
          >
            {flushing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
            <span>{flushing ? 'Transmitting...' : 'Simulate DSN Comms Pass'}</span>
          </button>
        </div>

        {flushFeedback && (
          <div className="p-3 mb-4 rounded-md bg-blue-50 border border-blue-200 text-[#0b3d91] text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0b3d91]" />
            <span>{flushFeedback}</span>
          </div>
        )}

        {/* Sync Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <span className="text-xs font-mono text-slate-500 block">Total Transactions</span>
            <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
              {syncSummary?.total_transactions ?? 0}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <span className="text-xs font-mono text-amber-700 block">Pending Uplink</span>
            <span className="text-base font-bold font-mono text-amber-800 mt-1 block">
              {syncSummary?.queued_pending ?? 0}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <span className="text-xs font-mono text-emerald-700 block">Synced to Earth</span>
            <span className="text-base font-bold font-mono text-emerald-800 mt-1 block">
              {syncSummary?.synced_to_earth ?? 0}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <span className="text-xs font-mono text-slate-500 block">Deduplication</span>
            <span className="text-base font-bold font-mono text-[#0b3d91] mt-1 block">
              SHA-256 Active
            </span>
          </div>
        </div>

        {/* Recent Transactions Excel Table */}
        <div className="excel-grid-container">
          <div className="excel-formula-bar">
            <div className="bg-white border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded">
              A1:E{Math.max(syncSummary?.recent_items?.length || 1, 1)}
            </div>
            <div className="text-slate-400 font-serif italic text-xs font-bold">fx</div>
            <div className="text-slate-700 text-[11px] truncate flex-1">
              =AUDIT_LOG(ENTITY="STATION_OUTBOX", STATUS="SYNCHRONIZED", HASH_ALGO="SHA256")
            </div>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="excel-table">
              <thead>
                <tr>
                  <th className="excel-col-letter w-9 min-w-9">#</th>
                  <th className="excel-col-letter">A</th>
                  <th className="excel-col-letter">B</th>
                  <th className="excel-col-letter">C</th>
                  <th className="excel-col-letter">D</th>
                  <th className="excel-col-letter">E</th>
                </tr>
                <tr>
                  <th className="excel-th w-9 min-w-9 text-center">Row</th>
                  <th className="excel-th">Transaction Type ▼</th>
                  <th className="excel-th">Entity Table ▼</th>
                  <th className="excel-th">SHA-256 Idempotency Hash ▼</th>
                  <th className="excel-th">Sync Status ▼</th>
                  <th className="excel-th">Recorded Timestamp ▼</th>
                </tr>
              </thead>
              <tbody>
                {syncSummary?.recent_items && syncSummary.recent_items.length > 0 ? (
                  syncSummary.recent_items.map((item, idx) => (
                    <tr key={item.id} className="excel-row">
                      <td className="excel-row-num">{idx + 1}</td>
                      <td className="excel-td font-bold text-slate-900">{item.transaction_type}</td>
                      <td className="excel-td text-slate-600 font-mono">{item.entity_table}</td>
                      <td className="excel-td text-[#0b3d91] text-[11px] font-mono">{item.idempotency_hash}</td>
                      <td className="excel-td">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.sync_status === 'QUEUED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {item.sync_status}
                        </span>
                      </td>
                      <td className="excel-td text-slate-500 text-[11px]">
                        {new Date(item.created_at).toISOString().slice(0, 19).replace('T', ' ')} UTC
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="excel-row">
                    <td className="excel-row-num">1</td>
                    <td colSpan={5} className="excel-td py-6 text-center text-slate-400">
                      No transactions currently in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="excel-status-bar">
            <span>READY | Sheet: Outbox_Sync_Queue | Encrypted: AES-256-GCM</span>
            <span>Items: <strong className="text-slate-800">{syncSummary?.recent_items?.length || 0}</strong></span>
          </div>
        </div>
      </section>

      {/* Habitat Environmental Telemetry */}
      <section className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
              <Wind className="w-4 h-4 text-[#0b3d91]" /> Habitat Environmental Telemetry
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Cabin atmospheric conditions and sensor readings
            </p>
          </div>

          <button
            onClick={() => setShowEnvModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-700 transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#0b3d91]" />
            <span>+ Log Reading</span>
          </button>
        </div>

        {/* Environmental Quick Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 font-mono">
            <span className="text-xs text-slate-500 block">CABIN CO₂</span>
            {(() => {
              const latestCo2 = envReadings.find((r) => r.parameter_name === 'CABIN_CO2_PPM');
              const val = latestCo2 ? latestCo2.value : 520;
              const isHigh = val > 1000;
              return (
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-lg font-bold ${isHigh ? 'text-red-600' : 'text-emerald-700'}`}>
                    {val} ppm
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${
                    isHigh ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    {isHigh ? 'ELEVATED' : 'NOMINAL'}
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 font-mono">
            <span className="text-xs text-slate-500 block">RADIATION EXPOSURE</span>
            {(() => {
              const rads = envReadings.filter((r) => r.parameter_name.includes('RADIATION'));
              const total = rads.reduce((acc, r) => acc + r.value, 0);
              return (
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-slate-900">
                    {total > 0 ? `${total.toFixed(2)} μSv` : '0.45 μSv/h'}
                  </span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                    Shielded
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 font-mono">
            <span className="text-xs text-slate-500 block">PRESSURE &amp; TEMP</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-[#0b3d91]">
                101.3 kPa
              </span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                21.5°C
              </span>
            </div>
          </div>
        </div>

        {/* Environmental Readings Excel Table */}
        <div className="excel-grid-container">
          <div className="excel-formula-bar">
            <div className="bg-white border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded">
              A1:E{Math.max(envReadings.length, 1)}
            </div>
            <div className="text-slate-400 font-serif italic text-xs font-bold">fx</div>
            <div className="text-slate-700 text-[11px] truncate flex-1">
              =ENVIRONMENTAL_TELEMETRY(ZONE="ALL", WINDOW="RECENT_BURST", INTEGRITY="CHECKED")
            </div>
          </div>
          <div className="overflow-x-auto max-h-56 overflow-y-auto">
            <table className="excel-table">
              <thead>
                <tr>
                  <th className="excel-col-letter w-9 min-w-9">#</th>
                  <th className="excel-col-letter">A</th>
                  <th className="excel-col-letter">B</th>
                  <th className="excel-col-letter">C</th>
                  <th className="excel-col-letter">D</th>
                  <th className="excel-col-letter">E</th>
                </tr>
                <tr>
                  <th className="excel-th w-9 min-w-9 text-center">Row</th>
                  <th className="excel-th">Atmospheric Parameter ▼</th>
                  <th className="excel-th">Sensor Value ▼</th>
                  <th className="excel-th">Habitat Zone ▼</th>
                  <th className="excel-th">Sensor Quality ▼</th>
                  <th className="excel-th">Telemetry Timestamp ▼</th>
                </tr>
              </thead>
              <tbody>
                {envReadings.length > 0 ? (
                  envReadings.map((r, idx) => (
                    <tr key={r.id} className="excel-row">
                      <td className="excel-row-num">{idx + 1}</td>
                      <td className="excel-td font-bold text-slate-900">{r.parameter_name}</td>
                      <td className="excel-td text-[#0b3d91] font-bold">{r.value} {r.unit}</td>
                      <td className="excel-td text-slate-600">{r.habitat_zone}</td>
                      <td className="excel-td">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          r.quality_status === 'VALID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {r.quality_status}
                        </span>
                      </td>
                      <td className="excel-td text-slate-500 text-[11px]">
                        {new Date(r.timestamp).toISOString().slice(0, 19).replace('T', ' ')} UTC
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="excel-row">
                    <td className="excel-row-num">1</td>
                    <td colSpan={5} className="excel-td py-6 text-center text-slate-400">
                      No environmental telemetry records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="excel-status-bar">
            <span>READY | Sheet: Habitat_Atmosphere_Grid | Status: Online</span>
            <span>Total Sensors: <strong className="text-slate-800">{envReadings.length}</strong></span>
          </div>
        </div>
      </section>

      {/* 14 Relational Tables */}
      <section className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-[#0b3d91]" /> Relational Schema Row Counts (Live SQLite Query)
        </h3>

        {diagnostics?.table_counts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(diagnostics.table_counts).map(([tableName, count]) => (
              <div 
                key={tableName} 
                className="bg-slate-50 border border-slate-200 rounded-md p-3 flex flex-col justify-between"
              >
                <span className="text-[11px] font-mono text-slate-500 truncate" title={tableName}>
                  {tableName}
                </span>
                <span className="text-base font-bold font-mono text-slate-900 mt-1">
                  {typeof count === 'number' ? count.toLocaleString() : count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 font-mono">No table count diagnostics available.</p>
        )}
      </section>

      {/* Environmental Entry Modal */}
      {showEnvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-md w-full max-w-md shadow-2xl overflow-hidden font-mono">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-[#0b3d91]" />
                <h3 className="text-sm font-bold text-slate-800">Log Habitat Telemetry</h3>
              </div>
              <button
                onClick={() => setShowEnvModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordEnv} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">
                  Parameter
                </label>
                <select
                  value={envParam}
                  onChange={(e) => {
                    const p = e.target.value;
                    setEnvParam(p);
                    if (p === 'CABIN_CO2_PPM') {
                      setEnvUnit('ppm');
                      setEnvValue(550);
                    } else if (p.includes('RADIATION')) {
                      setEnvUnit('μSv/h');
                      setEnvValue(0.45);
                    } else if (p.includes('PRESSURE')) {
                      setEnvUnit('kPa');
                      setEnvValue(101.3);
                    } else {
                      setEnvUnit('°C');
                      setEnvValue(21.5);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-[#0b3d91]"
                >
                  <option value="CABIN_CO2_PPM">Cabin CO₂ (ppm)</option>
                  <option value="RADIATION_RATE_USV_H">Ionizing Radiation Rate (μSv/h)</option>
                  <option value="CABIN_PRESSURE_KPA">Cabin Pressure (kPa)</option>
                  <option value="AMBIENT_TEMP_CELSIUS">Ambient Temperature (°C)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">
                    Value ({envUnit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={envValue}
                    onChange={(e) => setEnvValue(parseFloat(e.target.value))}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-[#0b3d91] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">
                    Habitat Zone
                  </label>
                  <select
                    value={envZone}
                    onChange={(e) => setEnvZone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-[#0b3d91]"
                  >
                    <option value="CREW_QUARTERS">Crew Quarters</option>
                    <option value="AIRLOCK">Airlock / Suit Prep</option>
                    <option value="COMMAND_MODULE">Command Module</option>
                    <option value="SERVICE_MODULE">Service Module</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnvModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEnv}
                  className="px-4 py-2 rounded-lg bg-[#0b3d91] hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  {submittingEnv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  <span>{submittingEnv ? 'Logging...' : 'Save Reading'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
