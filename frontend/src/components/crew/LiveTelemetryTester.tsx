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
      title: 'Nominal Baseline Loaded',
      message: 'Vitals conform to baseline corridor. 0 alerts active.',
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
      title: 'Exertion Spike Filtered',
      message: 'Isolated spike suppressed to prevent alarm fatigue.',
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
      title: 'Deterioration Detected',
      message: 'Multi-day drift confirmed across consecutive cycles with elevated CO2.',
    });
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const nowIso = new Date().toISOString();
      
      await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: 'RESTING_HEART_RATE',
        value: Number(rhr),
        unit: 'bpm',
        observation_time: nowIso,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: 'LIVE_TESTER',
      });

      await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: 'SLEEP_DURATION',
        value: Number(sleep),
        unit: 'hours',
        observation_time: nowIso,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: 'LIVE_TESTER',
      });

      await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: 'HEART_RATE_RECOVERY_1MIN',
        value: Number(hrr),
        unit: 'bpm',
        observation_time: nowIso,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: 'LIVE_TESTER',
      });

      const analysisRes = await runDeteriorationAnalysis();
      onDataSubmitted();

      if (analysisRes.alerts_generated_count > 0) {
        setFeedback({
          type: 'alert',
          title: 'Alert Triggered',
          message: `${analysisRes.alerts_generated_count} active health alert(s) detected.`,
        });
      } else {
        setFeedback({
          type: 'success',
          title: 'Telemetry Logged',
          message: `Readings recorded. All parameters within baseline bounds.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: 'info',
        title: 'Error',
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 font-sans">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0b3d91]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Telemetry Test Console</span>
            </h3>
            {activeAlert && (
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>Active Alert: {activeAlert.review_priority} Priority</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={scenarioLoading || submitting}
            onClick={handlePresetNominal}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition"
          >
            Nominal
          </button>

          <button
            type="button"
            disabled={scenarioLoading || submitting}
            onClick={handlePresetSpike}
            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold transition"
          >
            Spike
          </button>

          <button
            type="button"
            disabled={scenarioLoading || submitting}
            onClick={handlePresetDeterioration}
            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-xs font-bold transition"
          >
            Decline
          </button>
        </div>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleManualSubmit} className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Heart Rate */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-red-500" /> Heart Rate
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
              className="w-full bg-transparent text-lg font-bold font-mono text-slate-900 focus:outline-none"
            />
          </div>

          {/* Sleep */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-sky-600" /> Sleep
              </span>
              <span>hrs</span>
            </label>
            <input
              type="number"
              step="0.1"
              min={2}
              max={14}
              value={sleep}
              onChange={(e) => setSleep(parseFloat(e.target.value) || 0)}
              required
              className="w-full bg-transparent text-lg font-bold font-mono text-slate-900 focus:outline-none"
            />
          </div>

          {/* HR Recovery */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-600" /> Recovery
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
              className="w-full bg-transparent text-lg font-bold font-mono text-slate-900 focus:outline-none"
            />
          </div>

          {/* Cabin CO2 */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-amber-600" /> CO₂
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
              className="w-full bg-transparent text-lg font-bold font-mono text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-500 font-mono">
            Target: <strong className="text-slate-800">{astronaut.callsign}</strong>
          </div>

          <button
            type="submit"
            disabled={submitting || scenarioLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b3d91] hover:bg-blue-800 text-white font-mono text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
            <span>{submitting ? 'Testing...' : 'Submit & Evaluate'}</span>
          </button>
        </div>
      </form>

      {/* Immediate Feedback Box */}
      {feedback && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition animate-fade-in ${
          feedback.type === 'alert'
            ? 'bg-red-50 border-red-200 text-red-800'
            : feedback.type === 'info'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {feedback.type === 'alert' ? (
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          ) : feedback.type === 'info' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold text-slate-900">{feedback.title}</div>
            <p className="text-slate-600 text-xs mt-0.5">{feedback.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
