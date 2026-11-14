import { useState } from 'react';
import { 
  X, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  PlusCircle 
} from 'lucide-react';
import { AstronautSummary } from '../../types';
import { ingestObservation } from '../../services/api';

interface QuickTelemetryModalProps {
  astronaut: AstronautSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface IndicatorConfig {
  key: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  defaultValue: number;
  step: number;
}

const INDICATORS: IndicatorConfig[] = [
  { key: 'RESTING_HEART_RATE', name: 'Resting Heart Rate', unit: 'bpm', min: 30, max: 200, defaultValue: 62, step: 1 },
  { key: 'SLEEP_DURATION', name: 'Sleep Duration', unit: 'hours', min: 0, max: 24, defaultValue: 7.2, step: 0.1 },
  { key: 'HEART_RATE_RECOVERY_1MIN', name: '1-Min Heart Rate Recovery', unit: 'bpm', min: 0, max: 100, defaultValue: 32, step: 1 },
  { key: 'BLOOD_OXYGEN_SPO2', name: 'Blood Oxygen (SpO₂)', unit: '%', min: 70, max: 100, defaultValue: 98, step: 1 },
  { key: 'CORE_BODY_TEMP', name: 'Core Body Temperature', unit: '°C', min: 34.0, max: 42.0, defaultValue: 36.8, step: 0.1 },
  { key: 'SYSTOLIC_BP', name: 'Systolic Blood Pressure', unit: 'mmHg', min: 60, max: 240, defaultValue: 115, step: 1 },
  { key: 'DIASTOLIC_BP', name: 'Diastolic Blood Pressure', unit: 'mmHg', min: 40, max: 150, defaultValue: 75, step: 1 },
];

export function QuickTelemetryModal({
  astronaut,
  isOpen,
  onClose,
  onSuccess,
}: QuickTelemetryModalProps) {
  const [selectedKey, setSelectedKey] = useState<string>('RESTING_HEART_RATE');
  const [value, setValue] = useState<number>(62);
  const [obsTime, setObsTime] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [provenanceRef, setProvenanceRef] = useState<string>('CMO_BEDSIDE_EXAM');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen || !astronaut) return null;

  const currentConfig = INDICATORS.find((i) => i.key === selectedKey) || INDICATORS[0];

  function handleIndicatorChange(key: string) {
    setSelectedKey(key);
    const cfg = INDICATORS.find((i) => i.key === key);
    if (cfg) {
      setValue(cfg.defaultValue);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!astronaut) return;
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const isoTime = new Date(obsTime).toISOString();
      const res = await ingestObservation({
        astronaut_id: astronaut.id,
        indicator_key: currentConfig.key,
        value: Number(value),
        unit: currentConfig.unit,
        observation_time: isoTime,
        data_origin: 'FLIGHT_BEDSIDE_CMO',
        provenance_ref: provenanceRef || 'CMO_MANUAL_ENTRY',
      });

      if (res.rejected_count > 0) {
        const item = res.results.find((r) => r.quality_status === 'REJECTED');
        setError(item?.quality_notes || 'Measurement was rejected by the 7-point Data Quality Audit engine.');
      } else {
        setSuccessMsg(`Logged ${value} ${currentConfig.unit} for ${astronaut.callsign}. Quality Audit: VALID.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to log telemetry: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-space-900 border border-space-750 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-space-800 bg-space-950">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-nasa-cyan" />
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                Log Bedside Clinical Telemetry
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {astronaut.full_name} ({astronaut.callsign}) · Mission {astronaut.mission_code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-space-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-mono text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Indicator Select */}
          <div>
            <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[11px] font-bold">
              Biometric Indicator
            </label>
            <select
              value={selectedKey}
              onChange={(e) => handleIndicatorChange(e.target.value)}
              className="w-full bg-space-950 border border-space-700 rounded-xl px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-nasa-cyan"
            >
              {INDICATORS.map((ind) => (
                <option key={ind.key} value={ind.key}>
                  {ind.name} ({ind.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Value Input */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[11px] font-bold">
                Measured Value ({currentConfig.unit})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={currentConfig.step}
                  min={currentConfig.min}
                  max={currentConfig.max}
                  value={value}
                  onChange={(e) => setValue(parseFloat(e.target.value))}
                  required
                  className="w-full bg-space-950 border border-space-700 rounded-xl px-3 py-2.5 text-white text-sm font-bold font-mono focus:outline-none focus:border-nasa-cyan"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                  {currentConfig.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[11px] font-bold">
                Timestamp (Station Time)
              </label>
              <input
                type="datetime-local"
                value={obsTime}
                onChange={(e) => setObsTime(e.target.value)}
                required
                className="w-full bg-space-950 border border-space-700 rounded-xl px-3 py-2.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-nasa-cyan"
              />
            </div>
          </div>

          {/* Provenance Context */}
          <div>
            <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[11px] font-bold">
              Clinical Context / Provenance Ref
            </label>
            <input
              type="text"
              value={provenanceRef}
              onChange={(e) => setProvenanceRef(e.target.value)}
              placeholder="e.g. CMO_POST_EXERCISE_ASSESSMENT"
              className="w-full bg-space-950 border border-space-700 rounded-xl px-3 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-nasa-cyan"
            />
          </div>

          {/* Audit Verification Note */}
          <div className="p-3 bg-space-950/70 border border-space-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
            <Activity className="w-4 h-4 text-nasa-cyan shrink-0 mt-0.5" />
            <span>
              Entry will undergo the 7-Point Data Quality Audit (range bounds [{currentConfig.min}–{currentConfig.max}],
              future timestamp rejection, duplicate hash prevention) and immediately update personal baselines.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-space-850 hover:bg-space-800 text-slate-300 font-mono text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-nasa-blue hover:bg-nasa-blue/80 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
              <span>{submitting ? 'Auditing & Ingesting...' : 'Record Telemetry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
