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
  RefreshCw
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
        setTestUnit('invalid_psi');
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
      obsTime = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    } else if (testTimestampMode === 'future') {
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
        provenance_ref: 'CMO-SIMULATOR',
      });

      setIngestionResult(res);
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Data Quality &amp; Validation</h3>
              <p className="text-xs text-slate-500 font-mono">
                Validation Engine &amp; Rejection Audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 bg-white text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-3 border-b-2 font-medium transition ${
                activeTab === 'audit'
                  ? 'border-[#0b3d91] text-[#0b3d91] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Rejection Audit ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'border-[#0b3d91] text-[#0b3d91] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ingestion Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'border-[#0b3d91] text-[#0b3d91] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Indicator Catalog ({indicators.length})</span>
            </button>
          </div>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
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
                  <Loader2 className="w-4 h-4 animate-spin text-[#0b3d91]" /> Loading audit...
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 font-mono text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-slate-800 font-bold">All Data Valid</p>
                  <p className="text-slate-500 mt-1">No telemetry packet rejections recorded.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          {log.error_code}
                        </span>
                        <span className="text-[10px] text-slate-400">{log.flagged_at.slice(0, 19).replace('T', ' ')} UTC</span>
                      </div>
                      <p className="text-slate-700">{log.rejection_reason}</p>
                      <div className="bg-white p-2 rounded text-[11px] text-slate-600 overflow-x-auto border border-slate-200">
                        <code>{log.raw_payload_blob}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INGESTION SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="flex flex-col gap-4 font-mono text-xs">
              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('nominal')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-emerald-800 font-semibold"
                >
                  ✓ Nominal
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('out_of_bounds')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-amber-800 font-semibold"
                >
                  ⚠ Out of Bounds
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('invalid_unit')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-rose-800 font-semibold"
                >
                  ✕ Invalid Unit
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('stale')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-blue-800 font-semibold"
                >
                  ⏱ Stale (48h)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('future')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-purple-800 font-semibold"
                >
                  Future Timestamp
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSimulateIngest} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Astronaut</label>
                    <select
                      value={selectedAstroId}
                      onChange={(e) => setSelectedAstroId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    >
                      {astronauts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.callsign} — {a.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Indicator</label>
                    <select
                      value={selectedIndicatorKey}
                      onChange={(e) => handleIndicatorChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    >
                      {indicators.map((i) => (
                        <option key={i.id} value={i.indicator_key}>
                          {i.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Value</label>
                    <input
                      type="number"
                      step="any"
                      value={testValue}
                      onChange={(e) => setTestValue(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Unit</label>
                    <input
                      type="text"
                      value={testUnit}
                      onChange={(e) => setTestUnit(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Timestamp</label>
                    <select
                      value={testTimestampMode}
                      onChange={(e) => setTestTimestampMode(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    >
                      <option value="now">Now</option>
                      <option value="stale">48 Hours Ago</option>
                      <option value="future">+3 Hours Future</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0b3d91] hover:bg-blue-800 disabled:opacity-50 text-white font-bold transition shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ingesting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Submit Packet
                      </>
                    )}
                  </button>
                </div>
              </form>

              {submissionError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                  {submissionError}
                </div>
              )}

              {ingestionResult && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 font-mono text-xs shadow-sm">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Validation Result:</span>
                    <span className="text-[11px] text-slate-500">
                      Accepted: {ingestionResult.accepted_count} | Rejected: {ingestionResult.rejected_count}
                    </span>
                  </div>

                  {ingestionResult.results.map((r, idx) => {
                    const isAccepted = r.quality_status === 'VALID' || r.quality_status === 'STALE';
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border flex flex-col gap-0.5 ${
                          isAccepted
                            ? r.quality_status === 'STALE'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-red-50 border-red-200 text-red-900'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>Status: {r.quality_status}</span>
                        </div>
                        {r.quality_notes && <p className="text-[11px]">{r.quality_notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-3 font-mono text-xs">
              {indicators.map((ind) => (
                <div key={ind.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-bold text-sm">{ind.display_name}</span>
                      <span className="text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {ind.indicator_key}
                      </span>
                    </div>
                    <span className="text-[#0b3d91] font-bold text-[11px]">{ind.category}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Unit:</span>
                      <span className="text-slate-800 font-bold">{ind.standard_unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Nominal:</span>
                      <span className="text-emerald-700 font-bold">{ind.nominal_min} – {ind.nominal_max}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Critical:</span>
                      <span className="text-red-700 font-bold">&lt; {ind.critical_min} or &gt; {ind.critical_max}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Interval:</span>
                      <span className="text-slate-800">{ind.sampling_frequency_hours}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
