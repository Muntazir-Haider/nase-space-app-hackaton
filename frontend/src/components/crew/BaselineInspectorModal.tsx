import { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  RefreshCw, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Sliders
} from 'lucide-react';
import { PersonalBaselineOut, AstronautSummary } from '../../types';
import { fetchAstronautBaselines, recomputeAstronautBaselines } from '../../services/api';

interface BaselineInspectorModalProps {
  astronaut: AstronautSummary;
  onClose: () => void;
  onBaselineUpdated?: () => void;
}

export function BaselineInspectorModal({
  astronaut,
  onClose,
  onBaselineUpdated,
}: BaselineInspectorModalProps) {
  const [baselines, setBaselines] = useState<PersonalBaselineOut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recomputing, setRecomputing] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  useEffect(() => {
    loadBaselines();
  }, [astronaut.id]);

  async function loadBaselines() {
    setLoading(true);
    try {
      const data = await fetchAstronautBaselines(astronaut.id);
      setBaselines(data);
    } catch (err) {
      console.error('Failed to load baselines:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecompute() {
    setRecomputing(true);
    setFeedbackMsg('');
    try {
      const updated = await recomputeAstronautBaselines(astronaut.id);
      setBaselines(updated);
      setFeedbackMsg(`Baselines recalculated successfully.`);
      if (onBaselineUpdated) onBaselineUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedbackMsg(`Failed: ${msg}`);
    } finally {
      setRecomputing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0b3d91]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-800">Personal Baselines</h3>
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {astronaut.callsign}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {astronaut.full_name} · 7-Day Window
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

        {/* Action / Recompute Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white text-xs font-mono">
          <span className="text-slate-600 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#0b3d91]" />
            Minimum Valid Samples: <strong className="text-slate-900">4 daily readings</strong>
          </span>

          <button
            onClick={handleRecompute}
            disabled={recomputing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b3d91] hover:bg-blue-800 disabled:opacity-50 text-white font-bold transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
            <span>{recomputing ? 'Recalculating...' : 'Recompute Baselines'}</span>
          </button>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-200 text-xs font-mono text-[#0b3d91] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="p-16 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0b3d91]" /> Loading baselines...
            </div>
          ) : baselines.length === 0 ? (
            <div className="p-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 font-mono text-xs">
              <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-800 font-bold">No Baselines Initialized</p>
              <p className="text-slate-500 mt-1">Click &quot;Recompute Baselines&quot; to calculate.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {baselines.map((b) => {
                const isActive = b.status === 'ACTIVE';
                const unit = b.indicator_key === 'SLEEP_DURATION' ? 'hours' : 'bpm';
                return (
                  <div 
                    key={b.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 font-mono text-xs shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Version {b.version}
                          </span>
                          <h4 className="text-slate-900 font-bold text-sm mt-1.5">
                            {b.indicator_key.replace(/_/g, ' ')}
                          </h4>
                        </div>

                        {isActive ? (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> INSUFFICIENT
                          </span>
                        )}
                      </div>

                      {/* Statistical Distribution Parameters */}
                      <div className="mt-3 space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Mean (μ):</span>
                          <span className="text-slate-900 font-bold">
                            {isActive ? `${b.mean.toFixed(2)} ${unit}` : '0.00'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Median:</span>
                          <span className="text-slate-900 font-bold">
                            {isActive ? `${b.median.toFixed(2)} ${unit}` : '0.00'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Std Dev (σ):</span>
                          <span className="text-slate-900 font-bold">
                            {isActive ? `±${b.std_dev.toFixed(2)} ${unit}` : '0.00'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                          <span className="text-slate-500">Sample Count (N):</span>
                          <span className={b.sample_count >= 4 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                            {b.sample_count} / 7 days
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Window dates */}
                    <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400 space-y-0.5">
                      <div>Window: {b.window_start.slice(0, 10)} to {b.window_end.slice(0, 10)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
