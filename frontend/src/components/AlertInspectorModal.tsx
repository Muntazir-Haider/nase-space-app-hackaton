import { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Activity, 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Calculator,
  UserCheck,
  Pill,
  PlusCircle,
  Loader2
} from 'lucide-react';
import { AlertEvidenceDetail } from '../types';
import { updateAlertStatus, prescribeCountermeasure, updateCountermeasureStatus } from '../services/api';

interface Props {
  evidence: AlertEvidenceDetail | null;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export function AlertInspectorModal({ evidence, onClose, onStatusUpdated }: Props) {
  const [newStatus, setNewStatus] = useState<string>('UNDER_REVIEW');
  const [reviewerCallsign, setReviewerCallsign] = useState<string>('CMO-01');
  const [reviewNotes, setReviewNotes] = useState<string>('Reviewed multi-indicator drift. Clinical review initiated.');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Countermeasure prescription form state
  const [showCountermeasureForm, setShowCountermeasureForm] = useState<boolean>(false);
  const [cmType, setCmType] = useState<string>('SLEEP_SCHEDULE_ADJUSTMENT');
  const [cmTitle, setCmTitle] = useState<string>('Prescribe 60-Min Supplemental Sleep Cycle');
  const [cmDetails, setCmDetails] = useState<string>('Provide 60-minute sleep extension prior to EVA prep. Modulate resistance load by -20%.');
  const [cmDuration, setCmDuration] = useState<number>(48);
  const [cmSubmitting, setCmSubmitting] = useState<boolean>(false);
  const [cmSuccessMsg, setCmSuccessMsg] = useState<string>('');
  const [cmErrorMsg, setCmErrorMsg] = useState<string>('');

  if (!evidence) return null;

  const { 
    alert: alertData, 
    astronaut_callsign, 
    astronaut_full_name, 
    evidence_items, 
    countermeasures, 
    followups 
  } = evidence;

  let mathData: Record<string, any> = {};
  try {
    mathData = JSON.parse(alertData.math_summary);
  } catch {
    mathData = {};
  }

  async function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await updateAlertStatus(alertData.id, newStatus, reviewerCallsign, reviewNotes);
      setSuccessMsg(`Status updated to ${newStatus}. CMO follow-up logged to permanent audit ledger.`);
      onStatusUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePrescribeCountermeasure(e: React.FormEvent) {
    e.preventDefault();
    setCmSubmitting(true);
    setCmSuccessMsg('');
    setCmErrorMsg('');
    try {
      await prescribeCountermeasure(alertData.id, {
        prescribed_by: reviewerCallsign,
        countermeasure_type: cmType,
        title: cmTitle.trim(),
        prescription_details: cmDetails.trim(),
        target_duration_hours: Number(cmDuration),
      });
      setCmSuccessMsg(`Clinical countermeasure prescribed. Alert status moved to MONITORING.`);
      setShowCountermeasureForm(false);
      onStatusUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCmErrorMsg(msg);
    } finally {
      setCmSubmitting(false);
    }
  }

  async function handleUpdateCountermeasureStatus(cmId: string, outcome: string) {
    try {
      await updateCountermeasureStatus(alertData.id, cmId, {
        outcome_status: outcome,
        resolved_by: reviewerCallsign,
        resolution_notes: `Protocol outcome transitioned to ${outcome} by ${reviewerCallsign}.`,
      });
      setCmSuccessMsg(`Countermeasure protocol updated to ${outcome}.`);
      onStatusUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCmErrorMsg(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-space-900 border border-space-750 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-space-800 bg-space-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Silent Deterioration Evidence Inspector</h3>
                <span className="text-[10px] font-mono uppercase bg-red-950/80 text-red-400 px-2 py-0.5 rounded border border-red-500/40 font-bold">
                  {alertData.review_priority} PRIORITY
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-space-800 px-2 py-0.5 rounded border border-space-700">
                  Status: {alertData.lifecycle_status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Crew Member: {astronaut_full_name} ({astronaut_callsign}) · Rule: {alertData.rule_version}
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Plain-Language Detection Narrative */}
          <div className="bg-space-850/80 border border-space-750 rounded-xl p-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-nasa-cyan flex items-center gap-1.5 mb-2">
              <FileText className="w-4 h-4" /> Explainable Detection Narrative
            </h4>
            <p className="text-slate-200 text-xs leading-relaxed">{alertData.detection_narrative}</p>
          </div>

          {/* Mathematical Provenance Breakdown */}
          <div className="bg-space-850/80 border border-space-750 rounded-xl p-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-3">
              <Calculator className="w-4 h-4" /> Mathematical Provenance &amp; OLS Regression
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-space-950 text-slate-400 border-b border-space-750">
                  <tr>
                    <th className="py-2 px-3">Indicator Metric</th>
                    <th className="py-2 px-3">7d Baseline (μ ± σ)</th>
                    <th className="py-2 px-3">Current Value</th>
                    <th className="py-2 px-3">OLS Slope (m / day)</th>
                    <th className="py-2 px-3">Z-Score (σ)</th>
                    <th className="py-2 px-3">Adverse State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-space-800 text-slate-300">
                  {Object.entries(mathData).map(([key, d]: [string, any]) => (
                    <tr key={key} className={d.is_adverse ? 'bg-red-950/20' : ''}>
                      <td className="py-2 px-3 font-semibold text-white">{key}</td>
                      <td className="py-2 px-3">{d.baseline_mean} ± {d.baseline_std}</td>
                      <td className="py-2 px-3 text-white font-bold">{d.latest_value}</td>
                      <td className="py-2 px-3 font-bold text-amber-300">
                        {d.ols_slope > 0 ? `+${d.ols_slope}` : d.ols_slope}
                      </td>
                      <td className="py-2 px-3 font-bold text-red-400">
                        {d.latest_z_score > 0 ? `+${d.latest_z_score}` : d.latest_z_score}σ
                      </td>
                      <td className="py-2 px-3">
                        {d.is_adverse ? (
                          <span className="text-red-400 font-bold">DRIFT DETECTED</span>
                        ) : (
                          <span className="text-emerald-400">NOMINAL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Linked Raw Evidence Records */}
          <div className="bg-space-850/80 border border-space-750 rounded-xl p-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-nasa-cyan flex items-center gap-1.5 mb-3">
              <Activity className="w-4 h-4" /> Linked Biometric &amp; Environmental Evidence Records ({evidence_items.length})
            </h4>
            <div className="max-h-48 overflow-y-auto border border-space-800 rounded-lg">
              <table className="w-full text-[11px] font-mono text-left">
                <thead className="bg-space-950 text-slate-400 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Metric</th>
                    <th className="py-2 px-3">Observed</th>
                    <th className="py-2 px-3">Baseline</th>
                    <th className="py-2 px-3">Delta / Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-space-800 text-slate-300">
                  {evidence_items.map((item) => (
                    <tr key={item.id} className="hover:bg-space-800/40">
                      <td className="py-1.5 px-3 text-[10px] text-slate-400">{item.evidence_type}</td>
                      <td className="py-1.5 px-3 font-semibold text-white">{item.metric_name}</td>
                      <td className="py-1.5 px-3 text-white font-bold">{item.observed_value}</td>
                      <td className="py-1.5 px-3 text-slate-400">{item.baseline_mean ?? '—'}</td>
                      <td className="py-1.5 px-3 text-slate-300">{item.contribution_summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NASA HRP Scientific Citation */}
          <div className="bg-space-900 border border-nasa-blue/40 rounded-xl p-3.5 flex items-start gap-3 text-xs font-mono text-slate-300">
            <ExternalLink className="w-4 h-4 text-nasa-cyan flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">NASA Grounding &amp; Evidence Provenance:</span>
              <p className="text-slate-400 mt-0.5">{alertData.scientific_ref}</p>
            </div>
          </div>

          {/* CLINICAL COUNTERMEASURES PROTOCOL SECTION */}
          <div className="bg-space-850/80 border border-space-750 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-amber-400" /> Clinical Countermeasures ({countermeasures.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowCountermeasureForm(!showCountermeasureForm)}
                className="flex items-center gap-1 text-xs font-mono text-nasa-cyan hover:text-white transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{showCountermeasureForm ? 'Cancel' : '+ Prescribe Protocol'}</span>
              </button>
            </div>

            {cmSuccessMsg && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded text-xs font-mono flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> {cmSuccessMsg}
              </div>
            )}

            {cmErrorMsg && (
              <div className="p-2.5 bg-red-950/60 border border-red-500/40 text-red-300 rounded text-xs font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" /> {cmErrorMsg}
              </div>
            )}

            {/* Countermeasures List */}
            {countermeasures.length > 0 ? (
              <div className="space-y-2">
                {countermeasures.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-space-950 border border-space-800 font-mono text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{c.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        c.outcome_status === 'ACTIVE'
                          ? 'bg-amber-950/80 text-amber-400 border-amber-500/40 animate-pulse'
                          : c.outcome_status === 'COMPLETED'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-space-700'
                      }`}>
                        {c.outcome_status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{c.prescription_details}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-1 border-t border-space-850">
                      <span>Type: {c.countermeasure_type}</span>
                      <span>Target: {c.target_duration_hours}h · Prescribed by: {c.prescribed_by}</span>
                      {c.outcome_status === 'ACTIVE' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCountermeasureStatus(c.id, 'COMPLETED')}
                            className="px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 transition"
                          >
                            ✓ Mark Completed
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateCountermeasureStatus(c.id, 'DISCONTINUED')}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-space-700 transition"
                          >
                            Discontinue
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-500">
                No clinical countermeasures prescribed yet. Click &quot;+ Prescribe Protocol&quot; to issue an intervention.
              </p>
            )}

            {/* Interactive Prescription Form */}
            {showCountermeasureForm && (
              <form onSubmit={handlePrescribeCountermeasure} className="bg-space-900 border border-space-700 rounded-xl p-4 flex flex-col gap-3 mt-2 animate-fade-in font-mono text-xs">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-nasa-cyan" /> New Countermeasure Prescription
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Protocol Type</label>
                    <select
                      value={cmType}
                      onChange={(e) => {
                        setCmType(e.target.value);
                        if (e.target.value === 'SLEEP_SCHEDULE_ADJUSTMENT') {
                          setCmTitle('Prescribe 60-Min Supplemental Sleep Cycle');
                          setCmDetails('Provide 60-minute sleep extension prior to EVA prep. Modulate resistance load by -20%.');
                        } else if (e.target.value === 'HYDRATION_ELECTROLYTE_PROTOCOL') {
                          setCmTitle('Oral Electrolyte Rehydration Protocol');
                          setCmDetails('Administer 500 mL balanced electrolyte solution with increased hydration checks.');
                        } else if (e.target.value === 'EXERCISE_WORKLOAD_MODULATION') {
                          setCmTitle('Reduced ARED Workload Modulation');
                          setCmDetails('Temporarily reduce heavy deadlift/squat load on ARED by 30% for 48 hours.');
                        } else {
                          setCmTitle('Active CMO 24h Observational Monitoring');
                          setCmDetails('Scheduled follow-up vitals check at 12h and 24h marks.');
                        }
                      }}
                      className="w-full bg-space-950 border border-space-700 rounded-lg p-2 text-white focus:outline-none focus:border-nasa-cyan"
                    >
                      <option value="SLEEP_SCHEDULE_ADJUSTMENT">Sleep Schedule Adjustment</option>
                      <option value="HYDRATION_ELECTROLYTE_PROTOCOL">Hydration &amp; Electrolyte Protocol</option>
                      <option value="EXERCISE_WORKLOAD_MODULATION">Exercise Workload Modulation</option>
                      <option value="ACTIVE_MONITORING">Active Monitoring Protocol</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Protocol Title</label>
                    <input
                      type="text"
                      value={cmTitle}
                      onChange={(e) => setCmTitle(e.target.value)}
                      className="w-full bg-space-950 border border-space-700 rounded-lg p-2 text-white focus:outline-none focus:border-nasa-cyan"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-slate-400 block mb-1">Prescription Details</label>
                    <textarea
                      rows={2}
                      value={cmDetails}
                      onChange={(e) => setCmDetails(e.target.value)}
                      className="w-full bg-space-950 border border-space-700 rounded-lg p-2 text-white focus:outline-none focus:border-nasa-cyan"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Duration (Hours)</label>
                    <input
                      type="number"
                      value={cmDuration}
                      onChange={(e) => setCmDuration(Number(e.target.value))}
                      className="w-full bg-space-950 border border-space-700 rounded-lg p-2 text-white focus:outline-none focus:border-nasa-cyan"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCountermeasureForm(false)}
                    className="px-3 py-1.5 text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cmSubmitting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition shadow flex items-center gap-2"
                  >
                    {cmSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Prescribing...</span>
                      </>
                    ) : (
                      <>
                        <Pill className="w-3.5 h-3.5" />
                        <span>Prescribe Protocol</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Previous Follow-Ups History */}
          {followups.length > 0 && (
            <div className="bg-space-850/60 border border-space-750 rounded-xl p-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-nasa-cyan" /> CMO Review History
              </h4>
              <div className="space-y-2">
                {followups.map((f) => (
                  <div key={f.id} className="text-xs font-mono p-2.5 rounded bg-space-900 border border-space-800">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>Reviewer: {f.reviewer_callsign} · Transition: {f.status_transition}</span>
                      <span>{f.recorded_at.slice(0, 19).replace('T', ' ')}</span>
                    </div>
                    <p className="text-slate-200 mt-1">{f.review_notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CMO Action Box */}
          <form onSubmit={handleStatusSubmit} className="bg-space-900 border border-space-750 rounded-xl p-4 flex flex-col gap-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-nasa-cyan" /> Crew Medical Officer (CMO) Review Action
            </h4>

            {successMsg && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded text-xs font-mono flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-red-950/60 border border-red-500/40 text-red-300 rounded text-xs font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" /> {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-space-950 border border-space-700 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-nasa-cyan"
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Clinical Review Active)</option>
                  <option value="MONITORING">MONITORING (Countermeasures Prescribed)</option>
                  <option value="RESOLVED">RESOLVED (Vitals Stabilized)</option>
                  <option value="DISMISSED">DISMISSED (False Alarm / Known Operational Stress)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Reviewer Callsign</label>
                <input
                  type="text"
                  value={reviewerCallsign}
                  onChange={(e) => setReviewerCallsign(e.target.value)}
                  className="w-full bg-space-950 border border-space-700 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-nasa-cyan"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Clinical Review Notes</label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full bg-space-950 border border-space-700 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-nasa-cyan"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="self-end px-5 py-2 bg-nasa-blue hover:bg-sky-600 text-white font-mono text-xs font-bold rounded-lg transition shadow flex items-center gap-2"
            >
              {submitting ? 'Recording Action...' : 'Submit Clinical Decision →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
