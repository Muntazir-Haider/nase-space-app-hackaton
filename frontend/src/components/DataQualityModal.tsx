import { useEffect, useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  Sliders, 
  BookOpen, 
  Send, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  DataQualityAuditLog, 
  IndicatorDefinitionOut, 
  AstronautSummary, 
  IngestionResponse 
} from '../types';
import { 
  fetchDataQualityAudit, 
  fetchIndicatorDefinitions, 
  fetchAstronauts, 
  ingestObservation 
} from '../services/api';

interface Props {
  onClose: () => void;
  onTelemetryIngested?: () => void;
}

type TabType = 'audit' | 'simulator' | 'catalog';

export function DataQualityModal({ onClose, onTelemetryIngested }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('audit');
  
  // Data state
  const [logs, setLogs] = useState<DataQualityAuditLog[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDefinitionOut[]>([]);
  const [astronauts, setAstronauts] = useState<AstronautSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Simulator form state
  const [selectedAstroId, setSelectedAstroId] = useState<string>('');
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState<string>('RESTING_HEART_RATE');
  const [testValue, setTestValue] = useState<string>('68.0');
  const [testUnit, setTestUnit] = useState<string>('bpm');
  const [testTimestampMode, setTestTimestampMode] = useState<'now' | 'stale' | 'future'>('now');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [ingestionResult, setIngestionResult] = useState<IngestionResponse | null>(null);
  const [submissionError, setSubmissionError] = useState<string>('');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [auditData, indData, astroData] = await Promise.all([
        fetchDataQualityAudit().catch(() => []),
        fetchIndicatorDefinitions().catch(() => []),
        fetchAstronauts().catch(() => []),
      ]);
      setLogs(auditData);
      setIndicators(indData);
      setAstronauts(astroData);
      if (astroData.length > 0 && !selectedAstroId) {
        setSelectedAstroId(astroData[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleIndicatorChange(key: string) {
    setSelectedIndicatorKey(key);
    const ind = indicators.find(i => i.indicator_key === key);
    if (ind) {
      setTestUnit(ind.standard_unit);
      if (key === 'RESTING_HEART_RATE') setTestValue('65.0');
      else if (key === 'SLEEP_DURATION') setTestValue('7.5');
      else if (key === 'HEART_RATE_RECOVERY_1MIN') setTestValue('28.0');
      else if (key === 'CABIN_CO2_PPM') setTestValue('1200.0');
      else if (key === 'AMBIENT_RADIATION_USV') setTestValue('350.0');
    }
  }

  function applyPreset(presetType: 'nominal' | 'out_of_bounds' | 'invalid_unit' | 'stale' | 'future') {
    const ind = indicators.find(i => i.indicator_key === selectedIndicatorKey) || indicators[0];
    setTestUnit(ind.standard_unit);
    setTestTimestampMode('now');

    switch (presetType) {
      case 'nominal':
        setTestValue(String(ind.nominal_min + (ind.nominal_max - ind.nominal_min) / 2));
        break;
      case 'out_of_bounds':
        setTestValue(String(ind.critical_max + 120.0));
        break;
      case 'invalid_unit':
        setTestValue('65.0');
        setTestUnit('psi_invalid');
        break;
      case 'stale':
        setTestValue(String(ind.nominal_min + 5));
        setTestTimestampMode('stale');
        break;
      case 'future':
        setTestValue(String(ind.nominal_min + 5));
        setTestTimestampMode('future');
        break;
    }
  }

  async function handleSimulateIngest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionError('');
    setIngestionResult(null);

    let obsTime = new Date().toISOString();
    if (testTimestampMode === 'stale') {
      // 48 hours ago
      obsTime = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    } else if (testTimestampMode === 'future') {
      // 3 hours in future
      obsTime = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
    }

    try {
      const valNum = parseFloat(testValue);
      if (isNaN(valNum)) {
        throw new Error('Please enter a valid numeric value.');
      }

      const res = await ingestObservation({
        astronaut_id: selectedAstroId,
        indicator_key: selectedIndicatorKey,
        value: valNum,
        unit: testUnit.trim(),
        observation_time: obsTime,
        data_origin: 'SIMULATED',
        provenance_ref: 'CMO-SIMULATOR-INJECT',
      });

      setIngestionResult(res);

      // Refresh audit logs in background
      fetchDataQualityAudit().then(setLogs);
      if (onTelemetryIngested) onTelemetryIngested();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmissionError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-space-900 border border-space-750 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-space-800 bg-space-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Data Quality & Telemetry Ingestion Testbench</h3>
              <p className="text-xs text-slate-400 font-mono">
                7-Point Pre-Analysis Validation Engine · NASA Biological Plausibility Enforcement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-space-800 hover:bg-space-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-space-800 bg-space-950 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-3 border-b-2 font-medium transition ${
                activeTab === 'audit'
                  ? 'border-amber-400 text-amber-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Rejection Audit Log ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'border-nasa-cyan text-nasa-cyan font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Telemetry Ingestion Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'border-indigo-400 text-indigo-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>NASA Indicator Catalog ({indicators.length})</span>
            </button>
          </div>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="text-[11px] text-slate-400 hover:text-nasa-cyan flex items-center gap-1 transition"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: REJECTION AUDIT LOG */}
          {activeTab === 'audit' && (
            <div>
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-nasa-cyan" /> Retrieving audit entries...
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 border border-dashed border-space-750 rounded-xl text-center text-slate-400 font-mono text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-white font-bold">100% Ingestion Integrity</p>
                  <p className="text-slate-500 mt-1">Zero sensor packet rejections or physiological violations recorded.</p>
                  <button
                    onClick={() => setActiveTab('simulator')}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-space-850 hover:bg-space-800 text-nasa-cyan border border-space-700 transition"
                  >
                    Open Simulator to test packet validation
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-xl bg-space-850 border border-space-750 flex flex-col gap-2 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          {log.error_code}
                        </span>
                        <span className="text-[10px] text-slate-500">{log.flagged_at.slice(0, 19).replace('T', ' ')} UTC</span>
                      </div>
                      <p className="text-slate-200">{log.rejection_reason}</p>
                      <div className="bg-space-950 p-2 rounded text-[11px] text-slate-400 overflow-x-auto border border-space-800">
                        <code>{log.raw_payload_blob}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE TELEMETRY INGESTION SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="flex flex-col gap-5">
              <div className="bg-space-950 border border-space-800 rounded-xl p-4 text-xs font-mono text-slate-300">
                <span className="text-nasa-cyan font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Judge & CMO Interactive Ingestion Testbench
                </span>
                Inject test telemetry packets into the live ingestion pipeline. The 7-point validation engine verifies biological bounds, unit compliance, timestamp integrity, and prevents duplicates.
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-xs font-mono text-slate-400 block mb-2">Pre-Calibrated Test Scenarios:</span>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => applyPreset('nominal')}
                    className="px-2.5 py-1 rounded bg-space-850 hover:bg-space-800 border border-space-700 text-emerald-300"
                  >
                    ✓ Nominal (Valid)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('out_of_bounds')}
                    className="px-2.5 py-1 rounded bg-space-850 hover:bg-space-800 border border-space-700 text-amber-300"
                  >
                    ⚠ Out of Bounds (Test 3)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('invalid_unit')}
                    className="px-2.5 py-1 rounded bg-space-850 hover:bg-space-800 border border-space-700 text-rose-300"
                  >
                    ✕ Invalid Unit (Test 3)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('stale')}
                    className="px-2.5 py-1 rounded bg-space-850 hover:bg-space-800 border border-space-700 text-indigo-300"
                  >
                    ⏱ Stale 48h (Test 5)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('future')}
                    className="px-2.5 py-1 rounded bg-space-850 hover:bg-space-800 border border-space-700 text-purple-300"
                  >
                    🚀 Future Time (Integrity)
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSimulateIngest} className="bg-space-850 border border-space-750 rounded-xl p-4 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Target Astronaut Profile</label>
                    <select
                      value={selectedAstroId}
                      onChange={(e) => setSelectedAstroId(e.target.value)}
                      className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-nasa-cyan"
                    >
                      {astronauts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.callsign} — {a.full_name} ({a.mission_role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Target Indicator</label>
                    <select
                      value={selectedIndicatorKey}
                      onChange={(e) => handleIndicatorChange(e.target.value)}
                      className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-nasa-cyan"
                    >
                      {indicators.map((i) => (
                        <option key={i.id} value={i.indicator_key}>
                          {i.display_name} ({i.indicator_key})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Observation Value</label>
                    <input
                      type="number"
                      step="any"
                      value={testValue}
                      onChange={(e) => setTestValue(e.target.value)}
                      className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-nasa-cyan"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Unit String</label>
                    <input
                      type="text"
                      value={testUnit}
                      onChange={(e) => setTestUnit(e.target.value)}
                      className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-nasa-cyan"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Observation Timestamp</label>
                    <select
                      value={testTimestampMode}
                      onChange={(e) => setTestTimestampMode(e.target.value as any)}
                      className="w-full bg-space-950 border border-space-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-nasa-cyan"
                    >
                      <option value="now">Current Station Time (Now)</option>
                      <option value="stale">48 Hours Ago (Test 5: Stale)</option>
                      <option value="future">+3 Hours in Future (Temporal Error)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-nasa-blue hover:bg-nasa-blue/80 active:bg-nasa-blue/90 disabled:opacity-50 text-white font-mono text-xs font-bold transition shadow"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ingesting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Submit Telemetry Packet
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Submission Error Banner */}
              {submissionError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono">
                  {submissionError}
                </div>
              )}

              {/* Ingestion Result Card */}
              {ingestionResult && (
                <div className="bg-space-950 border border-space-800 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Validation Pipeline Result:</span>
                    <span className="text-[11px] text-slate-500">
                      Accepted: {ingestionResult.accepted_count} | Rejected: {ingestionResult.rejected_count}
                    </span>
                  </div>

                  {ingestionResult.results.map((r, idx) => {
                    const isAccepted = r.quality_status === 'VALID' || r.quality_status === 'STALE';
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex flex-col gap-1 ${
                          isAccepted
                            ? r.quality_status === 'STALE'
                              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                            : 'bg-red-950/40 border-red-500/50 text-red-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>Status: {r.quality_status}</span>
                          {r.observation_id && (
                            <span className="text-[10px] text-slate-400">ID: {r.observation_id.slice(0, 8)}...</span>
                          )}
                        </div>
                        {r.quality_notes && <p className="text-[11px] opacity-90">{r.quality_notes}</p>}
                        {!isAccepted && (
                          <span className="text-[10px] text-slate-400 mt-1">
                            Logged to `data_quality_audit_log` with complete payload blob.
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NASA INDICATOR CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="bg-space-950 border border-space-800 rounded-xl p-4 text-xs font-mono text-slate-300">
                <span className="text-indigo-400 font-bold block mb-1">
                  NASA Human Research Program (HRP) Indicator Specifications
                </span>
                Standardized physiological and habitat parameters with normal baselines, critical boundaries, and published spaceflight references.
              </div>

              <div className="space-y-3 font-mono text-xs">
                {indicators.map((ind) => (
                  <div key={ind.id} className="bg-space-850 border border-space-750 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-space-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{ind.display_name}</span>
                        <span className="text-[10px] bg-space-950 text-nasa-cyan px-2 py-0.5 rounded border border-space-700">
                          {ind.indicator_key}
                        </span>
                      </div>
                      <span className="text-indigo-400 text-[11px] font-bold">{ind.category}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500 block">Standard Unit:</span>
                        <span className="text-slate-200 font-bold">{ind.standard_unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Nominal Range:</span>
                        <span className="text-emerald-400 font-bold">{ind.nominal_min} – {ind.nominal_max} {ind.standard_unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Critical Bounds:</span>
                        <span className="text-rose-400 font-bold">&lt; {ind.critical_min} or &gt; {ind.critical_max}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Expected Interval:</span>
                        <span className="text-slate-200">{ind.sampling_frequency_hours}h</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-1 border-t border-space-800/80">
                      <span className="text-slate-500">NASA HRP Reference: </span>
                      <span className="text-nasa-cyan">{ind.nasa_hrp_reference}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
