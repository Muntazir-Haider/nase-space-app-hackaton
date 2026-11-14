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
  UserCheck
} from 'lucide-react';
import { AlertEvidenceDetail } from '../types';
import { updateAlertStatus } from '../services/api';

interface Props {
  evidence: AlertEvidenceDetail | null;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export function AlertInspectorModal({ evidence, onClose, onStatusUpdated }: Props) {
  const [newStatus, setNewStatus] = useState<string>('UNDER_REVIEW');
  const [reviewerCallsign, setReviewerCallsign] = useState<string>('CMO-01');
  const [reviewNotes, setReviewNotes] = useState<string>('Reviewed multi-indicator drift. Prescription of supplemental rest cycle and hydration protocol initiated.');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!evidence) return null;

  const { alert: alertData, astronaut_callsign, astronaut_full_name, evidence_items, followups } = evidence;
  let mathData: Record<string, any> = {};
  try {
    mathData = JSON.parse(alertData.math_summary);
  } catch (e) {
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
              <Calculator className="w-4 h-4" /> Mathematical Provenance & OLS Regression
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
              <Activity className="w-4 h-4" /> Linked Biometric & Environmental Evidence Records ({evidence_items.length})
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
              <span className="font-bold text-white">NASA Grounding & Evidence Provenance:</span>
              <p className="text-slate-400 mt-0.5">{alertData.scientific_ref}</p>
            </div>
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
