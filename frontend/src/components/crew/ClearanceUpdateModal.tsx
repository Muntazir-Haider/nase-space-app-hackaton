import { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';
import { AstronautSummary } from '../../types';
import { updateAstronautClearance } from '../../services/api';

interface ClearanceUpdateModalProps {
  astronaut: AstronautSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CLEARANCE_OPTIONS = [
  {
    status: 'FULL_FLIGHT_CLEARANCE',
    label: 'Full Flight Clearance',
    desc: 'Unrestricted mission operations, EVA sorties, and high-workload duty.',
    color: 'text-emerald-400 border-emerald-500 bg-emerald-950/40',
  },
  {
    status: 'TEMPORARY_MEDICAL_HOLD',
    label: 'Temporary Medical Hold',
    desc: 'Suspension from high-stress tasks and EVAs pending clinical review.',
    color: 'text-red-400 border-red-500 bg-red-950/40',
  },
  {
    status: 'OBSERVATION_RESTRICTED',
    label: 'Observation Restricted',
    desc: 'Light duties with close cardiovascular and circadian surveillance.',
    color: 'text-amber-400 border-amber-500 bg-amber-950/40',
  },
  {
    status: 'FIT_FOR_DUTY_WITH_RESTRICTIONS',
    label: 'Fit For Duty (Restricted)',
    desc: 'Intravehicular activities permitted; EVA sorties prohibited.',
    color: 'text-sky-400 border-sky-500 bg-sky-950/40',
  },
  {
    status: 'GROUNDED',
    label: 'Medical Grounding',
    desc: 'Critical physiological deterioration; complete duty relief.',
    color: 'text-rose-400 border-rose-500 bg-rose-950/40',
  },
];

export function ClearanceUpdateModal({
  astronaut,
  isOpen,
  onClose,
  onSuccess,
}: ClearanceUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    astronaut?.medical_clearance_status || 'FULL_FLIGHT_CLEARANCE'
  );
  const [reviewer, setReviewer] = useState<string>('CMO-01');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  if (!isOpen || !astronaut) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!astronaut) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateAstronautClearance(astronaut.id, selectedStatus, reviewer, notes);
      setSuccess(`Updated flight clearance for ${astronaut.callsign} to ${selectedStatus}.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to update flight clearance: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-space-900 border border-space-750 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-space-800 bg-space-950">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-nasa-cyan" />
            <div>
              <h3 className="text-base font-bold text-white">
                Modify Flight Medical Clearance
              </h3>
              <p className="text-xs text-slate-400">
                {astronaut.full_name} ({astronaut.callsign}) · Current: {astronaut.medical_clearance_status}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Clearance Status Radio Grid */}
          <div className="space-y-2">
            <label className="block text-slate-400 uppercase text-[11px] font-bold">
              Select Clearance Tier
            </label>
            <div className="space-y-2">
              {CLEARANCE_OPTIONS.map((opt) => (
                <label
                  key={opt.status}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedStatus === opt.status
                      ? `${opt.color} ring-1 ring-white/20`
                      : 'bg-space-950 border-space-800 text-slate-400 hover:border-space-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearance"
                    value={opt.status}
                    checked={selectedStatus === opt.status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mt-0.5 text-nasa-cyan focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-slate-200 text-xs">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reviewer & Notes */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-slate-400 mb-1 uppercase text-[11px] font-bold">
                Reviewer Callsign
              </label>
              <input
                type="text"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                required
                className="w-full bg-space-950 border border-space-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-nasa-cyan"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-slate-400 mb-1 uppercase text-[11px] font-bold">
                Clinical Justification / Directive Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Imposed due to RHR drift + CO2 exposure"
                className="w-full bg-space-950 border border-space-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-nasa-cyan"
              />
            </div>
          </div>

          {/* Offline Sync Attribution Notice */}
          <div className="p-2.5 bg-space-950 border border-space-800 rounded-xl text-[10px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-nasa-cyan shrink-0" />
            <span>
              Clearance modification will be saved to station SQLite WAL and queued in the Store-and-Forward Comms Queue.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-space-850 hover:bg-space-800 text-slate-300 text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-nasa-blue hover:bg-nasa-blue/80 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{saving ? 'Transacting...' : 'Apply Clearance Change'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
