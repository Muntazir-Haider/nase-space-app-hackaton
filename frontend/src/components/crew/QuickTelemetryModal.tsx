import { useState } from 'react';
import { 
  X, 
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
        setError(item?.quality_notes || 'Measurement rejected by validation engine.');
      } else {
        setSuccessMsg(`Logged ${value} ${currentConfig.unit} for ${astronaut.callsign}.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-[#0b3d91]" />
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Log Telemetry
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {astronaut.full_name} ({astronaut.callsign})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-mono">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Indicator Select */}
          <div>
            <label className="block text-slate-600 mb-1 font-bold">
              Biometric Indicator
            </label>
            <select
              value={selectedKey}
              onChange={(e) => handleIndicatorChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs font-mono focus:outline-none focus:border-[#0b3d91]"
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
              <label className="block text-slate-600 mb-1 font-bold">
                Value ({currentConfig.unit})
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
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm font-bold font-mono focus:outline-none focus:border-[#0b3d91]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-bold">
                Timestamp
              </label>
              <input
                type="datetime-local"
                value={obsTime}
                onChange={(e) => setObsTime(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs font-mono focus:outline-none focus:border-[#0b3d91]"
              />
            </div>
          </div>

          {/* Provenance Context */}
          <div>
            <label className="block text-slate-600 mb-1 font-bold">
              Provenance / Context
            </label>
            <input
              type="text"
              value={provenanceRef}
              onChange={(e) => setProvenanceRef(e.target.value)}
              placeholder="e.g. CMO_POST_EXERCISE"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs font-mono focus:outline-none focus:border-[#0b3d91]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#0b3d91] hover:bg-blue-800 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
              <span>{submitting ? 'Recording...' : 'Record Telemetry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
