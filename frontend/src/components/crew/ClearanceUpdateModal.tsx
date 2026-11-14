import { useState } from 'react';
import { 
  X, 
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
    desc: 'Unrestricted mission operations and EVAs.',
    color: 'border-emerald-500 bg-emerald-50/50 text-emerald-800',
  },
  {
    status: 'TEMPORARY_MEDICAL_HOLD',
    label: 'Temporary Medical Hold',
    desc: 'Suspended from high-stress tasks pending review.',
    color: 'border-red-500 bg-red-50/50 text-red-800',
  },
  {
    status: 'OBSERVATION_RESTRICTED',
    label: 'Observation Restricted',
    desc: 'Light duties with close cardiovascular monitoring.',
    color: 'border-amber-500 bg-amber-50/50 text-amber-800',
  },
  {
    status: 'FIT_FOR_DUTY_WITH_RESTRICTIONS',
    label: 'Fit For Duty (Restricted)',
    desc: 'Intravehicular duty permitted; EVA sorties prohibited.',
    color: 'border-sky-500 bg-sky-50/50 text-sky-800',
  },
  {
    status: 'GROUNDED',
    label: 'Medical Grounding',
    desc: 'Complete duty relief due to physiological findings.',
    color: 'border-rose-500 bg-rose-50/50 text-rose-800',
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
      setSuccess(`Updated flight clearance for ${astronaut.callsign}.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-[#0b3d91]" />
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Update Medical Clearance
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

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Clearance Status Radio Grid */}
          <div className="space-y-2">
            <label className="block text-slate-600 font-bold uppercase text-[11px]">
              Clearance Status
            </label>
            <div className="space-y-2">
              {CLEARANCE_OPTIONS.map((opt) => (
                <label
                  key={opt.status}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedStatus === opt.status
                      ? `${opt.color} ring-1 ring-slate-400`
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearance"
                    value={opt.status}
                    checked={selectedStatus === opt.status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mt-0.5 text-[#0b3d91]"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reviewer & Notes */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-slate-600 mb-1 font-bold">
                Reviewer
              </label>
              <input
                type="text"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-[#0b3d91]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-slate-600 mb-1 font-bold">
                Clinical Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for clearance change"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-[#0b3d91]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#0b3d91] hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{saving ? 'Updating...' : 'Apply Clearance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
