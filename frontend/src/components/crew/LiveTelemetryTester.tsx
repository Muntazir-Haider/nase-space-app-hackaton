import React, { useState } from 'react';
import { 
  Activity, 
  Moon, 
  Zap, 
  Wind, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Loader2, 
  Send,
  RefreshCw,
  Cpu,
  Radio,
  Thermometer,
  ChevronDown,
  ChevronUp
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
  const [isSyncingDevices, setIsSyncingDevices] = useState<boolean>(false);
  const [showOverrideForm, setShowOverrideForm] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'alert' | 'info'; title: string; message: string } | null>(null);

  // ── Synchronize Astronaut Wearables to Station ──
  async function handleSyncAllDevices() {
    setIsSyncingDevices(true);
    setFeedback(null);
    try {
      const nowIso = new Date().toISOString();

      // 1. Ingest continuous biometric telemetry packet batch
      await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: 'RESTING_HEART_RATE',
        value: Number(rhr),
        unit: 'bpm',
        observation_time: nowIso,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: 'ASTROSKIN_VEST_DOCK_SYNC',
      });

      await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: 'SLEEP_DURATION',
        value: Number(sleep),
        unit: 'hours',
        observation_time: nowIso,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: 'SOMNA_SLEEP_BAND_SYNC',
      });

      await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: 'HEART_RATE_RECOVERY_1MIN',
        value: Number(hrr),
        unit: 'bpm',
        observation_time: nowIso,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: 'HEXOSKIN_POD_SYNC',
      });

      // 2. Trigger automated multi-indicator clinical deterioration analysis
      const analysisRes = await runDeteriorationAnalysis();
      onDataSubmitted();

      if (analysisRes.alerts_generated_count > 0) {
        setFeedback({
          type: 'alert',
          title: 'Device Sync Complete · Clinical Drift Alert Generated',
          message: `Synchronized 4 biometric channels to Station WAL storage. ${analysisRes.alerts_generated_count} active physiological alert(s) flagged for CMO review.`,
        });
      } else {
        setFeedback({
          type: 'success',
          title: 'Device Telemetry Synchronized Successfully',
          message: `Offloaded 4 wearable device channels to Station WAL database. All physiological parameters conform to personal 7-day baseline corridor.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: 'info',
        title: 'Device Sync Warning',
        message: msg,
      });
    } finally {
      setIsSyncingDevices(false);
    }
  }

  // ── Clinical Flight Conditions ──
  function handlePresetNominal() {
    setRhr(62);
    setSleep(7.6);
    setHrr(36);
    setCo2(480);
    onLoadScenario('SCENARIO_A_NOMINAL');
    setFeedback({
      type: 'success',
      title: 'Condition: Nominal Flight Baseline Synchronized',
      message: 'Crew member homeostatic. Restorative sleep 7.6h, normal RHR 62 bpm, robust HR recovery 36 bpm.',
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
      title: 'Condition: Acute Spacewalk Exertion Filtered',
      message: 'Transient cardiovascular load detected post-EVA. Clinical noise suppression filter active to prevent alarm fatigue.',
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
      title: 'Condition: Multi-Day Silent Deterioration Detected',
      message: 'Consecutive multi-indicator drift confirmed: elevated resting heart rate (+6.5 bpm), severe sleep deficit (-2.3h), delayed cardiac recovery, and elevated airlock CO2.',
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
        provenance_ref: 'CMO_STATION_MANUAL_LOG',
      });

      await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: 'SLEEP_DURATION',
        value: Number(sleep),
        unit: 'hours',
        observation_time: nowIso,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: 'CMO_STATION_MANUAL_LOG',
      });

      await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: 'HEART_RATE_RECOVERY_1MIN',
        value: Number(hrr),
        unit: 'bpm',
        observation_time: nowIso,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: 'CMO_STATION_MANUAL_LOG',
      });

      const analysisRes = await runDeteriorationAnalysis();
      onDataSubmitted();

      if (analysisRes.alerts_generated_count > 0) {
        setFeedback({
          type: 'alert',
          title: 'Manual Observations Logged · Clinical Alert Triggered',
          message: `${analysisRes.alerts_generated_count} active health alert(s) detected across baseline corridor.`,
        });
      } else {
        setFeedback({
          type: 'success',
          title: 'Clinical Observations Recorded',
          message: `Readings stored in station database. Parameters within nominal corridor.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: 'info',
        title: 'Ingestion Error',
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-slate-300 rounded-md p-5 shadow-2xs flex flex-col gap-4 font-sans">
      
      {/* ── Top Station Docking Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#0b3d91] flex items-center justify-center text-white shadow-xs">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                NASA Bio-Station Dock // Astronaut Device Synchronizer
              </h3>
              {activeAlert ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-rose-50 text-rose-800 border border-rose-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  DRIFT DETECTED: {activeAlert.review_priority}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  DOCK LINK ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Automated wireless bio-telemetry offload, cryptographic device verification & station database sync
            </p>
          </div>
        </div>

        {/* Sync All Devices Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSyncingDevices || scenarioLoading}
            onClick={handleSyncAllDevices}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0b3d91] hover:bg-[#092d6c] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Sync all connected astronaut wearables directly to Station SQLite WAL storage"
          >
            {isSyncingDevices ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isSyncingDevices ? 'Syncing Wearables...' : 'Sync Wearables to Station'}</span>
          </button>
        </div>
      </div>

      {/* ── Connected Medical Wearables Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Device 1: Astroskin Bio-Vest */}
        <div className="p-3 rounded-md border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-500" />
              Astroskin Bio-Vest
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-200">
              BLE 5.4 · 94%
            </span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            Lead II Continuous ECG · Respiration Rate
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>RSSI: -38 dBm</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced
            </span>
          </div>
        </div>

        {/* Device 2: Hexoskin Smart Pod */}
        <div className="p-3 rounded-md border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              Hexoskin Pod #HEX-331
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-200">
              UWB · 88%
            </span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            R-R Autonomic Intervals · HR Recovery
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>Rate: 100 Hz</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced
            </span>
          </div>
        </div>

        {/* Device 3: VitalSense Core Temp Capsule */}
        <div className="p-3 rounded-md border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              VitalSense Core Capsule
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-200">
              433 MHz RF
            </span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            Visceral Deep Core Temperature (36.8°C)
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>Metabolic Flux</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Link
            </span>
          </div>
        </div>

        {/* Device 4: Somna Neuro-Sleep Band */}
        <div className="p-3 rounded-md border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-sky-600" />
              Somna Neuro-Band
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-200">
              Optical · 91%
            </span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            Circadian Phase & Slow-Wave Sleep EEG
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>Delta Power SWS</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Docked
            </span>
          </div>
        </div>
      </div>

      {/* ── Flight Physiological Conditions Toolbar ── */}
      <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-[#0b3d91]" />
          <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
            Flight Clinical State:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={scenarioLoading || submitting}
            onClick={handlePresetNominal}
            className="px-2.5 py-1.5 rounded-sm bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            title="Load nominal baseline condition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>1. Nominal Baseline Transit</span>
          </button>

          <button
            type="button"
            disabled={scenarioLoading || submitting}
            onClick={handlePresetSpike}
            className="px-2.5 py-1.5 rounded-sm bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            title="Load acute EVA physical exertion condition"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>2. Acute Spacewalk Exertion</span>
          </button>

          <button
            type="button"
            disabled={scenarioLoading || submitting}
            onClick={handlePresetDeterioration}
            className="px-2.5 py-1.5 rounded-sm bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            title="Load silent deterioration condition post-EVA"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>3. Multi-Day Silent Deterioration</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOverrideForm(!showOverrideForm)}
            className="px-2.5 py-1.5 rounded-sm bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono transition cursor-pointer flex items-center gap-1"
          >
            <span>{showOverrideForm ? 'Hide Sensor Buffer' : 'Sensor Buffer Override'}</span>
            {showOverrideForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-3 rounded-md text-xs border flex items-start gap-2.5 shadow-2xs ${
          feedback.type === 'alert' 
            ? 'bg-rose-50 border-rose-300 text-rose-900' 
            : feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-blue-50 border-blue-300 text-blue-900'
        }`}>
          {feedback.type === 'alert' ? (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          ) : feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold">{feedback.title}</div>
            <div className="mt-0.5 text-[11px] leading-relaxed opacity-90">{feedback.message}</div>
          </div>
        </div>
      )}

      {/* ── Sensor Buffer & Manual Clinical Calibration Override Form ── */}
      {showOverrideForm && (
        <form onSubmit={handleManualSubmit} className="space-y-3 pt-2 border-t border-slate-200">
          <div className="text-[11px] font-mono text-slate-500 uppercase font-bold tracking-wider">
            Station Clinical Calibration Buffer:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Heart Rate */}
            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
              <label className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-1">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-red-500" /> RHR
                </span>
                <span className="font-mono text-[10px] text-slate-400">bpm</span>
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
            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
              <label className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-1">
                <span className="flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-sky-600" /> Sleep Duration
                </span>
                <span className="font-mono text-[10px] text-slate-400">hrs</span>
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
            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
              <label className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-1">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" /> HR Recovery (1m)
                </span>
                <span className="font-mono text-[10px] text-slate-400">bpm drop</span>
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

            {/* CO2 */}
            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200">
              <label className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-1">
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-amber-600" /> Habitat CO₂
                </span>
                <span className="font-mono text-[10px] text-slate-400">ppm</span>
              </label>
              <input
                type="number"
                min={300}
                max={5000}
                value={co2}
                onChange={(e) => setCo2(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-transparent text-lg font-bold font-mono text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0b3d91] hover:bg-[#092d6c] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Commit Calibrated Ingestion</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
