import { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  Wind, 
  FileText, 
  Loader2, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';
import { FlightSurgeonHandoverReport } from '../../types';
import { fetchHandoverReport } from '../../services/api';

interface MedicalHandoverModalProps {
  astronautId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MedicalHandoverModal({ astronautId, isOpen, onClose }: MedicalHandoverModalProps) {
  const [report, setReport] = useState<FlightSurgeonHandoverReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [cmoNotesInput, setCmoNotesInput] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && astronautId) {
      loadReport();
    }
  }, [isOpen, astronautId]);

  async function loadReport(notes?: string) {
    if (!astronautId) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchHandoverReport(astronautId, notes);
      setReport(data);
      if (data.cmo_handover_notes) {
        setCmoNotesInput(data.cmo_handover_notes);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to compile clinical handover report: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    await loadReport(cmoNotesInput);
    setSavingNotes(false);
  }

  function handleDownloadJson() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NASA_Handover_Report_${report.callsign}_${report.report_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-space-900 border border-space-750 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:w-full print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Modal Action Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-space-800 bg-space-950 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-nasa-cyan" />
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                NASA Flight Surgeon Clinical Handover &amp; Summary Report
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Evidence-Grounded Shift Handover Record · Space Medicine Directorate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !report}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700 text-xs font-mono text-slate-200 hover:text-white transition"
              title="Print document or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-nasa-cyan" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadJson}
              disabled={loading || !report}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700 text-xs font-mono text-slate-200 hover:text-white transition"
              title="Download official JSON report"
            >
              <Download className="w-3.5 h-3.5 text-nasa-amber" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-space-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 print:text-black print:p-0 print:overflow-visible">
          {loading && !report ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-nasa-cyan animate-spin" />
              <p className="text-xs font-mono text-slate-400">Compiling multi-indicator flight surgeon dossier...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-mono">
              {error}
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Document Banner */}
              <div className="border-b-2 border-nasa-blue pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-nasa-blue text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                      NASA SPACE MEDICINE
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      REPORT ID: <strong className="text-slate-200 print:text-black">{report.report_id}</strong>
                    </span>
                  </div>
                  <h1 className="text-xl font-black text-white print:text-black tracking-wide mt-1">
                    ASTRONAUT CLINICAL STATUS HANDOVER DOSSIER
                  </h1>
                  <p className="text-xs font-mono text-slate-400 print:text-slate-600">
                    Generated: {report.generated_at} · Mission: {report.mission_code} (Flight Day {report.flight_day})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Overall Assessment</div>
                    <div className={`font-mono text-xs font-bold px-2.5 py-1 rounded inline-flex items-center gap-1.5 mt-0.5 ${
                      report.overall_clinical_status === 'CRITICAL_REVIEW'
                        ? 'bg-red-950 text-red-300 border border-red-500'
                        : report.overall_clinical_status === 'OBSERVATION'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                    }`}>
                      {report.overall_clinical_status === 'CRITICAL_REVIEW' ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      ) : report.overall_clinical_status === 'OBSERVATION' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>{report.overall_clinical_status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Astronaut Demographics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-space-950/70 p-4 rounded-xl border border-space-800 print:bg-slate-50 print:border-slate-300">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Crew Member</div>
                  <div className="text-sm font-bold text-white print:text-black">{report.full_name}</div>
                  <div className="text-xs font-mono text-nasa-cyan">{report.callsign}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Flight Role</div>
                  <div className="text-xs font-mono text-slate-200 print:text-black">{report.flight_role}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Destination / Craft</div>
                  <div className="text-xs font-mono text-slate-200 print:text-black">{report.target_destination}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Flight Clearance</div>
                  <div className="text-xs font-mono font-bold text-nasa-amber">{report.medical_clearance_status}</div>
                </div>
              </div>

              {/* Flight Surgeon Clinical Directive Box */}
              <div className="bg-space-850/80 border border-space-700 rounded-xl p-4 print:border-slate-300">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-nasa-cyan" />
                  <h3 className="text-xs font-bold uppercase font-mono text-slate-200 print:text-black tracking-wider">
                    Flight Surgeon Clinical Directives &amp; Action Plan
                  </h3>
                </div>
                <div className="font-mono text-xs text-slate-300 print:text-black whitespace-pre-line leading-relaxed bg-space-950 p-3 rounded-lg border border-space-800 print:bg-slate-100 print:border-slate-200">
                  {report.flight_surgeon_recommendation}
                </div>
              </div>

              {/* 7-Day Personal Baseline Corridors */}
              <div>
                <h3 className="text-xs font-bold uppercase font-mono text-slate-300 print:text-black tracking-wider flex items-center gap-2 mb-2">
                  <Activity className="w-3.5 h-3.5 text-nasa-cyan" />
                  <span>Personal Rolling Baseline Standards (7-Day Bessel N-1)</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border border-space-800 rounded-lg overflow-hidden">
                    <thead className="bg-space-950 text-slate-400 print:bg-slate-200 print:text-black">
                      <tr>
                        <th className="p-2.5">Biometric Indicator</th>
                        <th className="p-2.5">Mean (μ)</th>
                        <th className="p-2.5">Std Dev (σ)</th>
                        <th className="p-2.5">Sample Size (N)</th>
                        <th className="p-2.5">Baseline Status</th>
                        <th className="p-2.5">NASA Nominal Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-space-800 print:divide-slate-200">
                      {Object.entries(report.baselines_summary).map(([key, b]: [string, any]) => (
                        <tr key={key} className="hover:bg-space-850/40">
                          <td className="p-2.5 font-bold text-white print:text-black">{key.replace(/_/g, ' ')}</td>
                          <td className="p-2.5 text-nasa-cyan font-bold">
                            {b.mean !== null ? `${b.mean} ${b.unit || ''}` : 'N/A'}
                          </td>
                          <td className="p-2.5 text-slate-300">
                            {b.std_dev !== null ? `±${b.std_dev}` : 'N/A'}
                          </td>
                          <td className="p-2.5 text-slate-400">{b.sample_count}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'ACTIVE' 
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400">
                            {b.nominal_min !== undefined ? `${b.nominal_min} – ${b.nominal_max} ${b.unit || ''}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Active Deterioration Alerts & Trends */}
              <div>
                <h3 className="text-xs font-bold uppercase font-mono text-slate-300 print:text-black tracking-wider flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-nasa-amber" />
                  <span>Active Deterioration Alerts &amp; Multi-Day Drift Slopes ({report.active_alerts_count})</span>
                </h3>
                {report.active_alerts.length === 0 ? (
                  <div className="p-3 bg-space-950 rounded-lg border border-space-800 text-xs font-mono text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>No active deterioration alerts. Crew member operating within nominal baseline bounds.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.active_alerts.map((a) => (
                      <div key={a.alert_id} className="p-3 bg-space-950 rounded-lg border border-space-800 space-y-1.5 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white print:text-black">{a.indicator_key}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-500' : 'bg-amber-950 text-amber-300 border border-amber-500'
                          }`}>
                            {a.severity} · {a.lifecycle_status}
                          </span>
                        </div>
                        <p className="text-slate-300 print:text-slate-800 text-[11px]">{a.trigger_reason}</p>
                        <div className="flex flex-wrap gap-4 text-[10px] text-slate-400">
                          {a.ols_slope !== null && (
                            <span>OLS Trend Slope: <strong className="text-nasa-amber">{a.ols_slope > 0 ? `+${a.ols_slope}` : a.ols_slope} /day</strong></span>
                          )}
                          {a.z_score !== null && (
                            <span>Z-Score Deviation: <strong className="text-nasa-cyan">{a.z_score} σ</strong></span>
                          )}
                          <span>Consecutive Shift Persistence: <strong className="text-white print:text-black">k = {a.persistence_count}</strong></span>
                          <span>Evidence Links: {a.evidence_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Habitat Environmental Telemetry Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-space-950 p-4 rounded-xl border border-space-800 print:bg-slate-50 print:border-slate-300 font-mono text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-300 font-bold uppercase text-[11px]">
                    <Wind className="w-4 h-4 text-nasa-cyan" />
                    <span>Habitat Environmental Exposure</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">MEAN CABIN CO₂</span>
                      <span className="font-bold text-white print:text-black">
                        {report.environmental_context.cabin_co2_mean_ppm ? `${report.environmental_context.cabin_co2_mean_ppm} ppm` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">MAX CABIN CO₂</span>
                      <span className={`font-bold ${report.environmental_context.cabin_co2_elevated ? 'text-red-400' : 'text-emerald-400'}`}>
                        {report.environmental_context.cabin_co2_max_ppm ? `${report.environmental_context.cabin_co2_max_ppm} ppm` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">CUMULATIVE RADIATION</span>
                      <span className="font-bold text-white print:text-black">{report.environmental_context.radiation_total_usv} μSv</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">HABITAT MODULE</span>
                      <span className="font-bold text-slate-300 print:text-black">{report.environmental_context.habitat_zone}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-space-950 p-4 rounded-xl border border-space-800 print:bg-slate-50 print:border-slate-300 font-mono text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-300 font-bold uppercase text-[11px]">
                    <Clock className="w-4 h-4 text-nasa-amber" />
                    <span>Recent Mission Events &amp; Shifts</span>
                  </div>
                  {report.recent_mission_events.length === 0 ? (
                    <p className="text-slate-500 text-[11px]">No high-workload mission events logged in current window.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                      {report.recent_mission_events.map((e) => (
                        <div key={e.event_id} className="text-[11px] flex justify-between items-center text-slate-300 border-b border-space-850 pb-1">
                          <span>{e.title} ({e.event_type})</span>
                          <span className="text-[10px] text-nasa-amber font-bold">{e.workload_intensity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Countermeasure Prescriptions */}
              {report.countermeasures_summary.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase font-mono text-slate-300 print:text-black tracking-wider mb-2">
                    Prescribed Countermeasures &amp; Follow-up History
                  </h3>
                  <div className="space-y-2 font-mono text-xs">
                    {report.countermeasures_summary.map((cm) => (
                      <div key={cm.countermeasure_id} className="p-3 bg-space-950 rounded-lg border border-space-800">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-nasa-cyan">{cm.countermeasure_type}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-space-850 rounded text-slate-300">
                            {cm.status} · Efficacy: {cm.efficacy_status}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-1">{cm.prescription_details}</p>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Prescribed by: {cm.prescribed_by} · Follow-ups logged: {cm.followup_count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CMO Handover Notes Input Section (Hidden in print if empty) */}
              <div className="bg-space-950 p-4 rounded-xl border border-space-800 print:hidden space-y-2 font-mono">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Crew Medical Officer (CMO) Handover Notes &amp; Sign-off
                </label>
                <textarea
                  value={cmoNotesInput}
                  onChange={(e) => setCmoNotesInput(e.target.value)}
                  placeholder="Enter specific CMO observations, sleep schedule comments, or notes for incoming flight surgeon shift..."
                  rows={3}
                  className="w-full bg-space-900 border border-space-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-nasa-cyan"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nasa-blue hover:bg-nasa-blue/80 text-white text-xs font-mono font-bold transition shadow"
                  >
                    {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Update &amp; Re-sign Report</span>
                  </button>
                </div>
              </div>

              {/* Cryptographic Integrity Block */}
              <div className="border-t border-space-800 pt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 print:text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>SHA-256 INTEGRITY HASH:</span>
                  <span className="font-mono text-slate-400 select-all">{report.integrity_hash}</span>
                </div>
                <div>OFFLINE CANONICAL MEDICAL AUDIT RECORD · MISSION SENTINEL</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
