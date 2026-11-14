import React, { useState, useEffect } from 'react';
import { X, UserPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { MissionOut } from '../../types';
import { fetchMissions, createAstronaut } from '../../services/api';

interface ProfileRegistrationModalProps {
  onClose: () => void;
  onSuccess: (newAstronautId: string) => void;
}

export function ProfileRegistrationModal({ onClose, onSuccess }: ProfileRegistrationModalProps) {
  const [missions, setMissions] = useState<MissionOut[]>([]);
  const [loadingMissions, setLoadingMissions] = useState<boolean>(true);

  const [missionId, setMissionId] = useState<string>('');
  const [callsign, setCallsign] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [flightRole, setFlightRole] = useState<string>('MISSION_SPECIALIST');
  const [medicalClearance, setMedicalClearance] = useState<string>('FULL_FLIGHT_CLEARANCE');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    async function loadMissions() {
      try {
        const list = await fetchMissions();
        setMissions(list);
        if (list.length > 0) {
          setMissionId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load missions:', err);
      } finally {
        setLoadingMissions(false);
      }
    }
    loadMissions();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!callsign.trim()) {
      setErrorMsg('Astronaut callsign is required (e.g. ARTEMIS-04).');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Astronaut full name is required.');
      return;
    }
    if (!missionId) {
      setErrorMsg('Please select a valid mission assignment.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAstronaut({
        mission_id: missionId,
        callsign: callsign.trim().toUpperCase(),
        full_name: fullName.trim(),
        flight_role: flightRole,
        medical_clearance_status: medicalClearance,
      });
      setSuccessMsg(`Astronaut ${created.callsign} (${created.full_name}) registered successfully.`);
      setTimeout(() => {
        onSuccess(created.id);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-space-900 border border-space-750 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-space-800 bg-space-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-nasa-blue/30 border border-nasa-cyan/40 text-nasa-cyan">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Register Crew Member Profile</h3>
              <p className="text-xs text-slate-400 font-mono">CMO Crew Roster Management & Medical Enlistment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-space-750 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mission Assignment */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Mission Assignment
            </label>
            {loadingMissions ? (
              <div className="p-2 rounded-xl bg-space-950 border border-space-800 text-xs text-slate-500 font-mono flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-nasa-cyan" /> Loading missions...
              </div>
            ) : (
              <select
                value={missionId}
                onChange={(e) => setMissionId(e.target.value)}
                className="w-full bg-space-950 border border-space-750 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-nasa-cyan"
              >
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.mission_code} — {m.name} ({m.spacecraft_module})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Callsign & Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Callsign <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ARTEMIS-04"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                className="w-full bg-space-950 border border-space-750 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-nasa-cyan"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono">Must be unique across mission fleet</span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Alex Vogel"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-space-950 border border-space-750 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-nasa-cyan"
                required
              />
            </div>
          </div>

          {/* Flight Role & Medical Clearance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Flight Operational Role
              </label>
              <select
                value={flightRole}
                onChange={(e) => setFlightRole(e.target.value)}
                className="w-full bg-space-950 border border-space-750 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-nasa-cyan"
              >
                <option value="COMMANDER">Commander</option>
                <option value="PILOT">Pilot</option>
                <option value="MISSION_SPECIALIST">Mission Specialist</option>
                <option value="FLIGHT_ENGINEER">Flight Engineer</option>
                <option value="SCIENCE_OFFICER">Science Officer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Medical Clearance Status
              </label>
              <select
                value={medicalClearance}
                onChange={(e) => setMedicalClearance(e.target.value)}
                className="w-full bg-space-950 border border-space-750 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-nasa-cyan"
              >
                <option value="FULL_FLIGHT_CLEARANCE">Full Flight Clearance</option>
                <option value="RESTRICTED_DUTY">Restricted Duty</option>
                <option value="MEDICAL_OBSERVATION">Medical Observation</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-space-850/60 border border-space-800 text-[11px] font-mono text-slate-400">
            <strong>Acceptance Test 1 Verification:</strong> Registering this profile will write a permanent record into the local SQLite database (<code className="text-nasa-cyan">data/sentinel.db</code>). The profile remains persisted across process restarts.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-space-800 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-nasa-blue hover:bg-nasa-blue/80 active:bg-nasa-blue/90 disabled:opacity-50 text-white font-mono text-xs font-bold transition shadow-lg shadow-nasa-blue/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
