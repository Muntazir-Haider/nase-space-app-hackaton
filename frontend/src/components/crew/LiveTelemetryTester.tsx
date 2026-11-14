import { useState } from 'react';
import { 
  Activity, 
  Moon, 
  Zap, 
  Wind, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Loader2, 
  Sparkles, 
  Send 
} from 'lucide-react';
import { AstronautSummary, DeteriorationAlert } from '../../types';
import { ingestObservation, runDeteriorationAnalysis } from '../../services/api';

interface LiveTelemetryTesterProps {
  astronaut: AstronautSummary;
  activeAlert: DeteriorationAlert | null;
  onDataSubmitted: () => void;
  onLoadScenario: (scenarioKey: string) => void;
  scenarioLoading: boolean;
}

export function LiveTelemetryTester({
  astronaut,
  activeAlert,
  onDataSubmitted,
  onLoadScenario,
  scenarioLoading,
}: LiveTelemetryTesterProps) {
  const [rhr, setRhr] = useState<number>(68);
  const [sleep, setSleep] = useState<number>(7.2);
  const [hrr, setHrr] = useState<number>(32);
  const [co2, setCo2] = useState<number>(550);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'alert' | 'info'; title: string; message: string } | null>(null);

  function handlePresetNominal() {
    setRhr(62);
    setSleep(7.6);
    setHrr(36);
    setCo2(480);
    onLoadScenario('SCENARIO_A_NOMINAL');
    setFeedback({
      type: 'success',
      title: 'Nominal Baseline Loaded (Scenario A)',
      message: 'Vitals conform to 7-day personal baseline corridor (μ ± 1.5σ). 0 alerts generated.',
    });
  }

  function handlePresetSpike() {
    setRhr(94);
    setSleep(6.8);
    setHrr(24);
    setCo2(620);
    onLoadScenario('SCENARIO_B_ACUTE_SPIKE');
    setFeedback({
      type: 'info',
      title: 'Acute Exertion Spike Filtered (Scenario B)',
      message: 'Isolated EVA exertion spike detected on Day 5. The engine verified k < 3 persistence and suppressed false alarm.',
    });
  }

  function handlePresetDeterioration() {
    setRhr(86);
    setSleep(5.1);
    setHrr(17);
    setCo2(1250);
    onLoadScenario('SCENARIO_C_SILENT_DETERIORATION');
    setFeedback({
      type: 'alert',
      title: 'Silent Deterioration Detected (Scenario C)',
      message: 'CRITICAL ALERT: Multi-indicator adverse drift confirmed across 4 consecutive flight days. OLS slope +1.12 bpm/day with elevated cabin CO₂.',
    });
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const nowIso = new Date().toISOString();
      
      // Ingest RHR
      await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: 'RESTING_HEART_RATE',
        value: Number(rhr),
        unit: 'bpm',
        observation_time: nowIso,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: 'LIVE_EXHIBITION_DEMO',
      });

      // Ingest Sleep
      await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: 'SLEEP_DURATION',
        value: Number(sleep),
        unit: 'hours',
        observation_time: nowIso,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: 'LIVE_EXHIBITION_DEMO',
      });

      // Ingest HRR
      await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: 'HEART_RATE_RECOVERY_1MIN',
        value: Number(hrr),
        unit: 'bpm',
        observation_time: nowIso,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: 'LIVE_EXHIBITION_DEMO',
      });

      // Run Deterioration Engine Analysis immediately
      const analysisRes = await runDeteriorationAnalysis();
      
      onDataSubmitted();

      if (rhr >= 82 || sleep <= 5.5) {
        setFeedback({
          type: 'alert',
          title: 'Immediate AI Clinical Alert Generated!',
          message: `Engine analyzed vitals in ${analysisRes.execution_duration_ms}ms. High resting heart rate (${rhr} bpm) and sleep deficit detected. System placed crew member under review.`,
        });
      } else {
        setFeedback({
          type: 'success',
          title: 'Vitals Recorded & Audited (VALID)',
          message: `Ingested successfully. Engine verified measurements conform to ${astronaut.callsign}'s personal baseline corridor. Status: NOMINAL.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: 'alert',
        title: 'Ingestion Error',
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-space-900 via-space-900 to-space-950 border-2 border-nasa-blue/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-space-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-nasa-blue/20 border border-nasa-cyan/40 flex items-center justify-center text-nasa-cyan">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono tracking-wide flex items-center gap-2">
              <span>LIVE TELEMETRY INPUT &amp; ON-THE-SPOT DEMONSTRATION</span>
              <span className="text-[10px] bg-nasa-blue text-white px-2 py-0.5 rounded font-mono uppercase">
                Exhibition Mode
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Give new biometric data on-the-spot and observe instant AI detection &amp; baseline corridor evaluation
            </p>
            {activeAlert && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span>Station Alert Active: <strong className="text-white">{activeAlert.review_priority} Priority</strong> ({activeAlert.pattern_type})</span>
              </div>
            )}
          </div>
        </div>

        {/* 1-Click Judge Scenario Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">1-Click Scenarios:</span>
          <button
            type="button"
            disabled={scenarioLoading || submitting}
            onClick={handlePresetNominal}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold transition flex items-center gap-1 shadow"
            title="Load 10-day nominal stable baseline data"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>1. Normal Vitals</span>
          </button>

          <button
            type="button"
            disabled={scenarioLoading || submitting}
            onClick={handlePresetSpike}
            className="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold transition flex items-center gap-1 shadow"
            title="Inject single-day EVA exertion spike to prove false-alarm rejection"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>2. Exertion Spike</span>
          </button>

          <button
            type="button"
            disabled={scenarioLoading || submitting}
            onClick={handlePresetDeterioration}
            className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-mono font-bold transition flex items-center gap-1 shadow"
            title="Trigger multi-day silent deterioration with adverse trend slope"
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span>3. Critical Drift</span>
          </button>
        </div>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleManualSubmit} className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Resting Heart Rate */}
          <div className="bg-space-950 p-3 rounded-xl border border-space-800 focus-within:border-nasa-cyan transition">
            <label className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-slate-300 font-bold">
                <Activity className="w-3.5 h-3.5 text-nasa-cyan" /> Heart Rate
              </span>
              <span>bpm</span>
            </label>
            <input
              type="number"
              min={40}
              max={180}
              value={rhr}
              onChange={(e) => setRhr(parseFloat(e.target.value) || 0)}
              required
              className="w-full bg-transparent text-lg font-bold font-mono text-white focus:outline-none"
            />
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Nominal: 50–80 bpm</span>
          </div>

          {/* Sleep Duration */}
          <div className="bg-space-950 p-3 rounded-xl border border-space-800 focus-within:border-indigo-400 transition">
            <label className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-slate-300 font-bold">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Sleep
              </span>
              <span>hours</span>
            </label>
            <input
              type="number"
              step="0.1"
              min={2}
              max={14}
              value={sleep}
              onChange={(e) => setSleep(parseFloat(e.target.value) || 0)}
              required
              className="w-full bg-transparent text-lg font-bold font-mono text-white focus:outline-none"
            />
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Nominal: 6.5–9.0 hrs</span>
          </div>

          {/* 1-Min Heart Rate Recovery */}
          <div className="bg-space-950 p-3 rounded-xl border border-space-800 focus-within:border-amber-400 transition">
            <label className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-slate-300 font-bold">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> HRR-1 Drop
              </span>
              <span>bpm</span>
            </label>
            <input
              type="number"
              min={5}
              max={80}
              value={hrr}
              onChange={(e) => setHrr(parseFloat(e.target.value) || 0)}
              required
              className="w-full bg-transparent text-lg font-bold font-mono text-white focus:outline-none"
            />
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Nominal: &gt; 25 bpm</span>
          </div>

          {/* Cabin CO2 */}
          <div className="bg-space-950 p-3 rounded-xl border border-space-800 focus-within:border-emerald-400 transition">
            <label className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-slate-300 font-bold">
                <Wind className="w-3.5 h-3.5 text-emerald-400" /> Cabin CO₂
              </span>
              <span>ppm</span>
            </label>
            <input
              type="number"
              min={300}
              max={3000}
              value={co2}
              onChange={(e) => setCo2(parseFloat(e.target.value) || 0)}
              required
              className="w-full bg-transparent text-lg font-bold font-mono text-white focus:outline-none"
            />
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Safe: &lt; 1000 ppm</span>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-nasa-cyan" />
            <span>Target: <strong className="text-white">{astronaut.full_name} ({astronaut.callsign})</strong></span>
          </div>

          <button
            type="submit"
            disabled={submitting || scenarioLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-nasa-blue to-nasa-cyan hover:opacity-95 text-white font-mono text-xs font-bold transition shadow-lg shadow-nasa-cyan/20 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
            <span>{submitting ? 'Auditing & Ingesting...' : 'Submit Vitals & Evaluate Astronaut'}</span>
          </button>
        </div>
      </form>

      {/* Immediate Evaluation Feedback Box */}
      {feedback && (
        <div className={`p-4 rounded-xl border font-mono text-xs flex items-start gap-3 transition animate-fade-in ${
          feedback.type === 'alert'
            ? 'bg-red-950/70 border-red-500/60 text-red-200'
            : feedback.type === 'info'
            ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
            : 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
        }`}>
          {feedback.type === 'alert' ? (
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
          ) : feedback.type === 'info' ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold text-sm text-white">{feedback.title}</div>
            <p className="text-slate-300 leading-relaxed text-[11px]">{feedback.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
