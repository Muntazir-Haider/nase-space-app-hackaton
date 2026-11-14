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
      setError(`Failed to load report: ${msg}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:w-full print:border-none print:shadow-none">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#0b3d91]" />
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Medical Handover Report
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Space Medicine Status Dossier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !report}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition"
              title="Print document or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#0b3d91]" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadJson}
              disabled={loading || !report}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition"
              title="Download JSON report"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 print:p-0 print:overflow-visible">
          {loading && !report ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-[#0b3d91] animate-spin" />
              <p className="text-xs font-mono text-slate-500">Compiling handover report...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-mono">
              {error}
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Document Banner */}
              <div className="border-b-2 border-[#0b3d91] pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#0b3d91] text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                      NASA
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      REPORT ID: <strong className="text-slate-800">{report.report_id}</strong>
                    </span>
                  </div>
                  <h1 className="text-xl font-black text-slate-900 tracking-wide mt-1">
                    ASTRONAUT CLINICAL STATUS HANDOVER DOSSIER
                  </h1>
                  <p className="text-xs font-mono text-slate-500">
                    Generated: {report.generated_at} · Mission: {report.mission_code} (Flight Day {report.flight_day})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Assessment</div>
                    <div className={`font-mono text-xs font-bold px-2.5 py-1 rounded inline-flex items-center gap-1.5 mt-0.5 ${
                      report.overall_clinical_status === 'CRITICAL_REVIEW'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : report.overall_clinical_status === 'OBSERVATION'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {report.overall_clinical_status === 'CRITICAL_REVIEW' ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                      ) : report.overall_clinical_status === 'OBSERVATION' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{report.overall_clinical_status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demographics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Crew Member</div>
                  <div className="text-sm font-bold text-slate-900">{report.full_name}</div>
                  <div className="text-xs font-mono text-[#0b3d91] font-semibold">{report.callsign}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Flight Role</div>
                  <div className="text-xs font-mono text-slate-800">{report.flight_role}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Craft</div>
                  <div className="text-xs font-mono text-slate-800">{report.target_destination}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Flight Clearance</div>
                  <div className="text-xs font-mono font-bold text-amber-700">{report.medical_clearance_status}</div>
                </div>
              </div>

              {/* Flight Surgeon Clinical Directive Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-[#0b3d91]" />
                  <h3 className="text-xs font-bold uppercase font-mono text-slate-800 tracking-wider">
                    Flight Directives &amp; Action Plan
                  </h3>
                </div>
                <div className="font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {report.flight_surgeon_recommendation}
                </div>
              </div>

              {/* 7-Day Personal Baselines */}
              <div>
                <h3 className="text-xs font-bold uppercase font-mono text-slate-800 tracking-wider flex items-center gap-2 mb-2">
                  <Activity className="w-3.5 h-3.5 text-[#0b3d91]" />
                  <span>Personal Baselines (7-Day Window)</span>
                </h3>
                <div className="excel-grid-container">
                  <div className="excel-formula-bar">
                    <div className="bg-white border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded">
                      A1:F{Object.keys(report.baselines_summary).length}
                    </div>
                    <div className="text-slate-400 font-serif italic text-xs font-bold">fx</div>
                    <div className="text-slate-700 text-[11px] truncate flex-1">
                      =PERSONAL_BASELINES(CREW_ID="{report.callsign}", WINDOW=7, UNITS="METRIC")
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
                          <th className="excel-th">Physiological Indicator ▼</th>
                          <th className="excel-th">Baseline Mean (μ) ▼</th>
                          <th className="excel-th">Std Deviation (σ) ▼</th>
                          <th className="excel-th">Samples ▼</th>
                          <th className="excel-th">Status ▼</th>
                          <th className="excel-th">Nominal Range ▼</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(report.baselines_summary).map(([key, b]: [string, any], idx) => (
                          <tr key={key} className="excel-row">
                            <td className="excel-row-num">{idx + 1}</td>
                            <td className="excel-td font-bold text-slate-900">{key.replace(/_/g, ' ')}</td>
                            <td className="excel-td text-[#0b3d91] font-bold">
                              {b.mean !== null ? `${b.mean} ${b.unit || ''}` : 'N/A'}
                            </td>
                            <td className="excel-td text-slate-700">
                              {b.std_dev !== null ? `±${b.std_dev}` : 'N/A'}
                            </td>
                            <td className="excel-td text-slate-500">{b.sample_count}</td>
                            <td className="excel-td">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                b.status === 'ACTIVE' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="excel-td text-slate-500">
                              {b.nominal_min !== undefined ? `${b.nominal_min} – ${b.nominal_max} ${b.unit || ''}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="excel-status-bar">
                    <span>READY | Sheet: Personal_Baselines_7D</span>
                    <span>Count: <strong className="text-slate-800">{Object.keys(report.baselines_summary).length}</strong></span>
                  </div>
                </div>
              </div>

              {/* Active Deterioration Alerts */}
              <div>
                <h3 className="text-xs font-bold uppercase font-mono text-slate-800 tracking-wider flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Active Alerts ({report.active_alerts_count})</span>
                </h3>
                {report.active_alerts.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>No active deterioration alerts. Operating within nominal baseline bounds.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.active_alerts.map((a) => (
                      <div key={a.alert_id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{a.indicator_key}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {a.severity} · {a.lifecycle_status}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px]">{a.trigger_reason}</p>
                        <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
                          {a.ols_slope !== null && (
                            <span>Trend Slope: <strong className="text-slate-800">{a.ols_slope > 0 ? `+${a.ols_slope}` : a.ols_slope} /day</strong></span>
                          )}
                          {a.z_score !== null && (
                            <span>Deviation: <strong className="text-slate-800">{a.z_score} σ</strong></span>
                          )}
                          <span>Consecutive: <strong className="text-slate-800">{a.persistence_count} days</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Environmental Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase text-[11px]">
                    <Wind className="w-4 h-4 text-[#0b3d91]" />
                    <span>Environmental Telemetry</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">MEAN CABIN CO₂</span>
                      <span className="font-bold text-slate-800">
                        {report.environmental_context.cabin_co2_mean_ppm ? `${report.environmental_context.cabin_co2_mean_ppm} ppm` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">MAX CABIN CO₂</span>
                      <span className={`font-bold ${report.environmental_context.cabin_co2_elevated ? 'text-red-600' : 'text-emerald-700'}`}>
                        {report.environmental_context.cabin_co2_max_ppm ? `${report.environmental_context.cabin_co2_max_ppm} ppm` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">RADIATION</span>
                      <span className="font-bold text-slate-800">{report.environmental_context.radiation_total_usv} μSv</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">HABITAT ZONE</span>
                      <span className="font-bold text-slate-800">{report.environmental_context.habitat_zone}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase text-[11px]">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Recent Mission Events</span>
                  </div>
                  {report.recent_mission_events.length === 0 ? (
                    <p className="text-slate-500 text-[11px]">No events logged in window.</p>
                  ) : (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {report.recent_mission_events.map((e) => (
                        <div key={e.event_id} className="text-[11px] flex justify-between items-center text-slate-700 border-b border-slate-200 pb-0.5">
                          <span>{e.title}</span>
                          <span className="text-[10px] text-amber-700 font-bold">{e.workload_intensity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CMO Handover Notes */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 print:hidden space-y-2 font-mono">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Handover Notes &amp; Sign-off
                </label>
                <textarea
                  value={cmoNotesInput}
                  onChange={(e) => setCmoNotesInput(e.target.value)}
                  placeholder="Enter observations or notes for the incoming shift..."
                  rows={2}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#0b3d91]"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b3d91] hover:bg-blue-800 text-white text-xs font-mono font-bold transition shadow-sm"
                  >
                    {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Save &amp; Sign</span>
                  </button>
                </div>
              </div>

              {/* Cryptographic Hash */}
              <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>SHA-256:</span>
                  <span className="font-mono text-slate-600 select-all">{report.integrity_hash}</span>
                </div>
                <div>OFFLINE CANONICAL MEDICAL RECORD</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
