import { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Activity, 
  FileText, 
  CheckCircle, 
  Calculator,
  UserCheck,
  Pill,
  PlusCircle,
  Clock
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
      setSuccessMsg(`Status updated to ${newStatus}.`);
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
      setCmSuccessMsg(`Countermeasure prescribed.`);
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
        resolution_notes: `Status changed to ${outcome} by ${reviewerCallsign}.`,
      });
      setCmSuccessMsg(`Protocol marked as ${outcome}.`);
      onStatusUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCmErrorMsg(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-800">Alert Evidence &amp; Medical Review</h3>
                <span className="text-[10px] font-mono uppercase bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200 font-bold">
                  {alertData.review_priority}
                </span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {alertData.lifecycle_status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Astronaut: <span className="font-semibold text-slate-800">{astronaut_full_name}</span> ({astronaut_callsign})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Plain-Language Detection Narrative */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b3d91] flex items-center gap-1.5 mb-1.5">
              <FileText className="w-4 h-4" /> Detection Summary
            </h4>
            <p className="text-slate-700 text-xs leading-relaxed">{alertData.detection_narrative}</p>
          </div>

          {/* Mathematical Provenance Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-2.5">
              <Calculator className="w-4 h-4 text-[#0b3d91]" /> Statistical Deviation &amp; Slope
            </h4>
            <div className="excel-grid-container mt-2">
              <div className="excel-formula-bar">
                <div className="bg-white border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded">
                  A1:F{Object.keys(mathData).length}
                </div>
                <div className="text-slate-400 font-serif italic text-xs font-bold">fx</div>
                <div className="text-slate-700 text-[11px] truncate flex-1">
                  =STAT_DEVIATION(METRICS=CURRENT_ROW, WINDOW="7_DAY_BASELINE", METHOD="OLS_REGRESSION")
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="excel-table">
                  <thead>
                    <tr>
                      <th className="excel-col-letter w-9 min-w-9">#</th>
                      <th className="excel-col-letter">A</th>
                      <th className="excel-col-letter">B</th>
                      <th className="excel-col-letter">C</th>
                      <th className="excel-col-letter">D</th>
                      <th className="excel-col-letter">E</th>
                      <th className="excel-col-letter">F</th>
                    </tr>
                    <tr>
                      <th className="excel-th w-9 min-w-9 text-center">Row</th>
                      <th className="excel-th">Clinical Indicator ▼</th>
                      <th className="excel-th">7d Baseline (Mean ± SD) ▼</th>
                      <th className="excel-th">Current Reading ▼</th>
                      <th className="excel-th">Slope (Δ/day) ▼</th>
                      <th className="excel-th">Z-Score ▼</th>
                      <th className="excel-th">Status ▼</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(mathData).map(([key, d]: [string, any], idx) => (
                      <tr key={key} className={`excel-row ${d.is_adverse ? 'bg-red-50/60' : idx % 2 === 1 ? 'bg-[#fcfdfd]' : 'bg-white'}`}>
                        <td className="excel-row-num">{idx + 1}</td>
                        <td className="excel-td font-bold text-slate-900">{key}</td>
                        <td className="excel-td text-slate-600">{d.baseline_mean} ± {d.baseline_std}</td>
                        <td className="excel-td text-slate-900 font-bold">{d.latest_value}</td>
                        <td className="excel-td font-bold text-amber-700">
                          {d.ols_slope > 0 ? `+${d.ols_slope}` : d.ols_slope}
                        </td>
                        <td className="excel-td font-bold text-red-600">
                          {d.latest_z_score > 0 ? `+${d.latest_z_score}` : d.latest_z_score}σ
                        </td>
                        <td className="excel-td">
                          {d.is_adverse ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                              Drift Warning
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Nominal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="excel-status-bar">
                <span>READY | Sheet: Stats_Regression_Matrix</span>
                <span>Indicators: <strong className="text-slate-800">{Object.keys(mathData).length}</strong></span>
              </div>
            </div>
          </div>

          {/* Linked Raw Evidence Records */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-2.5">
              <Activity className="w-4 h-4 text-[#0b3d91]" /> Evidence Records ({evidence_items.length})
            </h4>
            <div className="excel-grid-container">
              <div className="excel-formula-bar">
                <div className="bg-white border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded">
                  A1:E{Math.max(evidence_items.length, 1)}
                </div>
                <div className="text-slate-400 font-serif italic text-xs font-bold">fx</div>
                <div className="text-slate-700 text-[11px] truncate flex-1">
                  =SELECT(EVIDENCE_LOG, ALERT_ID="{alertData.id}")
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto overflow-x-auto">
                <table className="excel-table">
                  <thead>
                    <tr>
                      <th className="excel-col-letter w-9 min-w-9">#</th>
                      <th className="excel-col-letter">A</th>
                      <th className="excel-col-letter">B</th>
                      <th className="excel-col-letter">C</th>
                      <th className="excel-col-letter">D</th>
                      <th className="excel-col-letter">E</th>
                    </tr>
                    <tr>
                      <th className="excel-th w-9 min-w-9 text-center">Row</th>
                      <th className="excel-th">Type ▼</th>
                      <th className="excel-th">Metric ▼</th>
                      <th className="excel-th">Observed ▼</th>
                      <th className="excel-th">Baseline ▼</th>
                      <th className="excel-th">Clinical Contribution Summary ▼</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence_items.map((item, idx) => (
                      <tr key={item.id} className="excel-row">
                        <td className="excel-row-num">{idx + 1}</td>
                        <td className="excel-td text-slate-500 font-medium">{item.evidence_type}</td>
                        <td className="excel-td font-semibold text-slate-900">{item.metric_name}</td>
                        <td className="excel-td text-slate-900 font-bold">{item.observed_value}</td>
                        <td className="excel-td text-slate-500">{item.baseline_mean ?? '—'}</td>
                        <td className="excel-td text-slate-600">{item.contribution_summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="excel-status-bar">
                <span>READY | Sheet: Evidence_Audit_Trail</span>
                <span>Count: <strong className="text-slate-800">{evidence_items.length}</strong></span>
              </div>
            </div>
          </div>

          {/* Clinical Countermeasures Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-[#0b3d91]" /> Countermeasures ({countermeasures.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowCountermeasureForm(!showCountermeasureForm)}
                className="flex items-center gap-1 text-xs font-semibold text-[#0b3d91] hover:underline"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{showCountermeasureForm ? 'Cancel' : '+ Prescribe'}</span>
              </button>
            </div>

            {cmSuccessMsg && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> {cmSuccessMsg}
              </div>
            )}

            {cmErrorMsg && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-800 rounded text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" /> {cmErrorMsg}
              </div>
            )}

            {countermeasures.length > 0 ? (
              <div className="space-y-2">
                {countermeasures.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{c.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        c.outcome_status === 'ACTIVE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : c.outcome_status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {c.outcome_status}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs">{c.prescription_details}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-200 mt-1">
                      <span>Type: {c.countermeasure_type}</span>
                      <span>Target: {c.target_duration_hours}h</span>
                      {c.outcome_status === 'ACTIVE' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCountermeasureStatus(c.id, 'COMPLETED')}
                            className="px-2 py-0.5 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
                          >
                            Mark Completed
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No countermeasures currently prescribed.
              </p>
            )}

            {showCountermeasureForm && (
              <form onSubmit={handlePrescribeCountermeasure} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Type</label>
                    <select
                      value={cmType}
                      onChange={(e) => {
                        setCmType(e.target.value);
                        if (e.target.value === 'SLEEP_SCHEDULE_ADJUSTMENT') {
                          setCmTitle('Prescribe 60-Min Supplemental Sleep Cycle');
                          setCmDetails('Provide 60-minute sleep extension prior to EVA prep.');
                        } else {
                          setCmTitle('Workload & Activity Modulation');
                          setCmDetails('Reduce heavy resistance workouts by 20% for 48 hours.');
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                    >
                      <option value="SLEEP_SCHEDULE_ADJUSTMENT">Sleep Schedule Adjustment</option>
                      <option value="HYDRATION_ELECTROLYTE_PROTOCOL">Hydration Protocol</option>
                      <option value="EXERCISE_WORKLOAD_MODULATION">Exercise Modulation</option>
                      <option value="ACTIVE_MONITORING">Active Monitoring</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Title</label>
                    <input
                      type="text"
                      value={cmTitle}
                      onChange={(e) => setCmTitle(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-slate-600 font-semibold block mb-1">Details</label>
                    <textarea
                      rows={2}
                      value={cmDetails}
                      onChange={(e) => setCmDetails(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Duration (Hours)</label>
                    <input
                      type="number"
                      value={cmDuration}
                      onChange={(e) => setCmDuration(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCountermeasureForm(false)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cmSubmitting}
                    className="px-4 py-1.5 bg-[#0b3d91] hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm"
                  >
                    {cmSubmitting ? 'Prescribing...' : 'Save Protocol'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Review History */}
          {followups.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
              <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Review History</span>
              </div>
              <div className="space-y-1">
                {followups.map((f) => (
                  <div key={f.id} className="text-[11px] text-slate-600 flex justify-between">
                    <span>{f.reviewer_callsign}: {f.review_notes}</span>
                    <span className="text-slate-400">{f.recorded_at.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CMO Action Box */}
          <form onSubmit={handleStatusSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#0b3d91]" /> Clinical Decision
            </h4>

            {successMsg && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-800 rounded text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" /> {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="MONITORING">MONITORING</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="DISMISSED">DISMISSED</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Reviewer Callsign</label>
                <input
                  type="text"
                  value={reviewerCallsign}
                  onChange={(e) => setReviewerCallsign(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1 text-xs">Review Notes</label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="self-end px-4 py-2 bg-[#0b3d91] hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              {submitting ? 'Updating...' : 'Submit Decision'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
