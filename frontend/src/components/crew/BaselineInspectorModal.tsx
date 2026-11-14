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
      setFeedbackMsg(`Baselines recalculated successfully across 7-day calendar window. Version counter incremented.`);
      if (onBaselineUpdated) onBaselineUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedbackMsg(`Recomputation failed: ${msg}`);
    } finally {
      setRecomputing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-space-900 border border-space-750 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-space-800 bg-space-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-nasa-blue/30 border border-nasa-cyan/40 flex items-center justify-center text-nasa-cyan">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Personal Baseline Engine & Mathematical Audit</h3>
                <span className="text-[10px] font-mono bg-space-950 text-nasa-cyan px-2 py-0.5 rounded border border-space-700">
                  {astronaut.callsign}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {astronaut.full_name} · 7-Day Rolling Calendar Window · Bessel&apos;s Correction (N-1)
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

        {/* Action / Recompute Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-space-800 bg-space-950 text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-nasa-cyan" />
            Minimum Valid Sample Threshold: <strong className="text-white">N ≥ 4 daily readings</strong>
          </span>

          <button
            onClick={handleRecompute}
            disabled={recomputing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nasa-blue hover:bg-nasa-blue/80 active:bg-nasa-blue/90 disabled:opacity-50 text-white font-bold transition shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
            <span>{recomputing ? 'Recalculating...' : 'Recompute 7d Baselines'}</span>
          </button>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="px-6 py-2.5 bg-space-850 border-b border-space-800 text-xs font-mono text-nasa-cyan flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="p-16 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-nasa-cyan" /> Loading active personal baselines...
            </div>
          ) : baselines.length === 0 ? (
            <div className="p-12 border border-dashed border-space-750 rounded-xl text-center text-slate-400 font-mono text-xs">
              <Activity className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-white font-bold">No Baselines Initialized</p>
              <p className="text-slate-500 mt-1">Click &quot;Recompute 7d Baselines&quot; to initialize statistical distribution.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {baselines.map((b) => {
                const isActive = b.status === 'ACTIVE';
                const unit = b.indicator_key === 'SLEEP_DURATION' ? 'hours' : 'bpm';
                return (
                  <div 
                    key={b.id}
                    className="bg-space-850 border border-space-750 rounded-2xl p-5 flex flex-col justify-between gap-4 font-mono text-xs shadow"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] text-nasa-cyan bg-space-950 px-2 py-0.5 rounded border border-space-700">
                            Version {b.version}
                          </span>
                          <h4 className="text-white font-bold text-sm mt-1.5">
                            {b.indicator_key.replace(/_/g, ' ')}
                          </h4>
                        </div>

                        {isActive ? (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ACTIVE
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/40">
                            <AlertTriangle className="w-3 h-3 text-amber-400" /> INSUFFICIENT DATA
                          </span>
                        )}
                      </div>

                      {/* Statistical Distribution Parameters */}
                      <div className="mt-4 space-y-2 bg-space-950 p-3.5 rounded-xl border border-space-800">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Arithmetic Mean (μ):</span>
                          <span className="text-white font-bold">
                            {isActive ? `${b.mean.toFixed(2)} ${unit}` : '0.00 (Suppressed)'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">50th Percentile Median (M):</span>
                          <span className="text-white font-bold">
                            {isActive ? `${b.median.toFixed(2)} ${unit}` : '0.00'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Sample Std Dev (σ):</span>
                          <span className="text-white font-bold">
                            {isActive ? `±${b.std_dev.toFixed(2)} ${unit}` : '0.00'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-space-800/80 text-[11px]">
                          <span className="text-slate-400">Valid Sample Count (N):</span>
                          <span className={b.sample_count >= 4 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {b.sample_count} / 7 days
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Window dates & audit */}
                    <div className="pt-2 border-t border-space-800/80 text-[10px] text-slate-500 space-y-1">
                      <div>Lookback: {b.window_start.slice(0, 10)} to {b.window_end.slice(0, 10)}</div>
                      <div>Audit Log: {b.calculated_at.slice(0, 19).replace('T', ' ')} UTC</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mathematical Proof & Formulas Grounding Card */}
          <div className="bg-space-950 border border-space-800 rounded-2xl p-5 font-mono text-xs text-slate-300 space-y-3">
            <div className="flex items-center gap-2 text-nasa-cyan font-bold text-sm">
              <Calculator className="w-4 h-4" /> Mathematical Grounding (NASA Evidence Specification)
            </div>

            <p className="text-slate-400 leading-relaxed">
              Mission Sentinel evaluates rolling baselines strictly over a preceding 7 calendar-day window (W = [T₀ - 7d, T₀]).
              To avoid false alarms from inadequate samples, baselines require a sample threshold of N ≥ 4 valid daily readings.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px]">
              <div className="bg-space-900 border border-space-800 p-3 rounded-xl">
                <span className="text-indigo-400 font-bold block mb-1">1. Sample Standard Deviation (Bessel&apos;s Correction)</span>
                <code>σ = sqrt( (1 / (N - 1)) * Σ (x_i - μ)^2 )</code>
                <p className="text-slate-500 mt-1">Uses $N-1$ degrees of freedom to prevent sample bias on small spaceflight cohorts.</p>
              </div>

              <div className="bg-space-900 border border-space-800 p-3 rounded-xl">
                <span className="text-emerald-400 font-bold block mb-1">2. Standardized Deviation Score</span>
                <code>z = (x_t - μ) / σ</code>
                <p className="text-slate-500 mt-1">Measures individual deviation magnitude against personal historical distribution.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
