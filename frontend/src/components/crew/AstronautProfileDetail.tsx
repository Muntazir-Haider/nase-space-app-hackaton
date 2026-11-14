import { useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Moon, 
  Zap, 
  Loader2, 
  Users, 
  Calculator, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Table, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  PlusCircle, 
  UserCheck 
} from 'lucide-react';
import { 
  AstronautSummary, 
  AstronautTimelineResponse, 
  DeteriorationAlert 
} from '../../types';
import { SynchronizedCharts } from '../SynchronizedCharts';
import { BaselineInspectorModal } from './BaselineInspectorModal';
import { MedicalHandoverModal } from './MedicalHandoverModal';
import { QuickTelemetryModal } from './QuickTelemetryModal';
import { ClearanceUpdateModal } from './ClearanceUpdateModal';
import { LiveTelemetryTester } from './LiveTelemetryTester';
import { runDeteriorationAnalysis } from '../../services/api';

interface AstronautProfileDetailProps {
  astronaut: AstronautSummary | null;
  timeline: AstronautTimelineResponse | null;
  activeAlert: DeteriorationAlert | null;
  timelineLoading: boolean;
  onOpenEvidence: (alertId: string) => void;
  onOpenRegisterModal: () => void;
  onRefreshTimeline?: () => void;
  onLoadScenario?: (scenarioKey: string) => void;
  scenarioLoading?: boolean;
}

export function AstronautProfileDetail({
  astronaut,
  timeline,
  activeAlert,
  timelineLoading,
  onOpenEvidence,
  onOpenRegisterModal,
  onRefreshTimeline,
  onLoadScenario,
  scenarioLoading = false,
}: AstronautProfileDetailProps) {
  const [showBaselineModal, setShowBaselineModal] = useState<boolean>(false);
  const [showFlightLog, setShowFlightLog] = useState<boolean>(true);
  const [runningAnalysis, setRunningAnalysis] = useState<boolean>(false);
  const [analysisFeedback, setAnalysisFeedback] = useState<string>('');
  const [showHandoverModal, setShowHandoverModal] = useState<boolean>(false);
  const [showQuickTelemetry, setShowQuickTelemetry] = useState<boolean>(false);
  const [showClearanceModal, setShowClearanceModal] = useState<boolean>(false);

  if (!astronaut) {
    return (
      <div className="bg-space-900 border border-space-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow">
        <Users className="w-10 h-10 text-slate-500" />
        <div>
          <h3 className="text-base font-bold text-white">No Astronaut Selected</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Select a crew member from the fleet roster to inspect synchronized time-series charts and baseline metrics.
          </p>
        </div>
        <button
          onClick={onOpenRegisterModal}
          className="px-4 py-2 rounded-xl bg-nasa-blue text-white font-mono text-xs font-bold transition shadow"
        >
          + Register Crew Member
        </button>
      </div>
    );
  }

  async function handleTriggerAnalysis() {
    setRunningAnalysis(true);
    setAnalysisFeedback('');
    try {
      const res = await runDeteriorationAnalysis();
      setAnalysisFeedback(`Engine completed in ${res.execution_duration_ms}ms · ${res.alerts_generated_count} alert(s) active.`);
      if (onRefreshTimeline) {
        onRefreshTimeline();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAnalysisFeedback(`Analysis failed: ${msg}`);
    } finally {
      setRunningAnalysis(false);
      setTimeout(() => setAnalysisFeedback(''), 5000);
    }
  }

  const rhrBaseline = timeline?.baselines['RESTING_HEART_RATE'];
  const sleepBaseline = timeline?.baselines['SLEEP_DURATION'];
  const hrrBaseline = timeline?.baselines['HEART_RATE_RECOVERY_1MIN'];
  const points = timeline?.timeline_points || [];

  return (
    <section className="bg-space-900 border border-space-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-space-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-bold text-xl text-white">{astronaut.full_name}</h2>
            <span className="text-xs font-mono text-nasa-cyan bg-space-850 px-2.5 py-0.5 rounded border border-space-700">
              {astronaut.callsign}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {astronaut.mission_role} · {astronaut.mission_code}
            </span>
            <button
              onClick={() => setShowClearanceModal(true)}
              title="Click to modify flight medical clearance tier"
              className={`text-[11px] font-mono px-2.5 py-0.5 rounded border transition flex items-center gap-1 cursor-pointer ${
                astronaut.medical_clearance_status === 'FULL_FLIGHT_CLEARANCE'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                  : astronaut.medical_clearance_status === 'TEMPORARY_MEDICAL_HOLD'
                  ? 'bg-red-950/80 text-red-300 border-red-500/50 hover:bg-red-900 animate-pulse'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              <span>{astronaut.medical_clearance_status}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Personal Flight Baseline Reference: 7-Day Calendar-Time Rolling Window with Bessel&apos;s Correction (N-1)
          </p>
          {analysisFeedback && (
            <div className="mt-2 text-xs font-mono text-nasa-cyan flex items-center gap-1.5 bg-space-950 px-3 py-1 rounded-lg border border-space-750">
              <CheckCircle2 className="w-3.5 h-3.5 text-nasa-cyan" />
              <span>{analysisFeedback}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowQuickTelemetry(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 hover:border-nasa-cyan text-xs font-mono text-slate-200 transition shadow"
            title="Log bedside vitals and telemetry directly into the station database"
          >
            <PlusCircle className="w-3.5 h-3.5 text-nasa-cyan" />
            <span>+ Log Vitals</span>
          </button>

          <button
            onClick={() => setShowHandoverModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 hover:border-nasa-cyan text-xs font-mono text-slate-200 transition shadow"
            title="Generate and export official NASA Flight Surgeon Handover & Medical Summary"
          >
            <FileText className="w-3.5 h-3.5 text-nasa-cyan" />
            <span>Handover Report</span>
          </button>

          <button
            onClick={handleTriggerAnalysis}
            disabled={runningAnalysis}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 hover:border-nasa-amber text-xs font-mono text-slate-200 transition shadow"
            title="Execute on-demand OLS regression trend analysis for this mission fleet"
          >
            {runningAnalysis ? (
              <Loader2 className="w-3.5 h-3.5 text-nasa-amber animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 text-nasa-amber" />
            )}
            <span>{runningAnalysis ? 'Analyzing...' : 'Run Engine Analysis'}</span>
          </button>

          <button
            onClick={() => setShowBaselineModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 hover:border-nasa-cyan text-xs font-mono text-slate-200 transition shadow"
          >
            <Calculator className="w-3.5 h-3.5 text-nasa-cyan" />
            <span>Audit Baselines &amp; Formulas</span>
          </button>

          {activeAlert ? (
            <button
              onClick={() => onOpenEvidence(activeAlert.id)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-mono text-xs font-bold rounded-xl shadow-lg shadow-red-950/40 transition flex items-center gap-2 animate-pulse"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>Inspect Active Alert ({activeAlert.review_priority})</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Nominal Baseline</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Live Telemetry Input & Evaluation Tester (For Exhibition Demonstrations) */}
      <LiveTelemetryTester
        astronaut={astronaut}
        activeAlert={activeAlert}
        onDataSubmitted={() => {
          if (onRefreshTimeline) onRefreshTimeline();
        }}
        onLoadScenario={(scKey) => {
          if (onLoadScenario) onLoadScenario(scKey);
        }}
        scenarioLoading={scenarioLoading}
      />

      {/* Baseline Metric Cards (Clickable to open math inspector) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setShowBaselineModal(true)}
          className="bg-space-950 border border-space-800 hover:border-space-700 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition shadow hover:shadow-nasa-cyan/10"
        >
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
              <Activity className="w-3.5 h-3.5 text-nasa-cyan" />
              <span>Resting Heart Rate (7d)</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {rhrBaseline ? `${rhrBaseline.mean.toFixed(1)} ± ${rhrBaseline.std_dev.toFixed(1)} bpm` : '62.0 ± 2.5 bpm'}
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              Status: {rhrBaseline?.status || 'ACTIVE'} <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-space-900 px-2 py-1 rounded">
            Cardiovascular
          </span>
        </div>

        <div 
          onClick={() => setShowBaselineModal(true)}
          className="bg-space-950 border border-space-800 hover:border-space-700 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition shadow hover:shadow-nasa-cyan/10"
        >
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sleep Duration (7d)</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {sleepBaseline ? `${sleepBaseline.mean.toFixed(1)} ± ${sleepBaseline.std_dev.toFixed(2)} hrs` : '7.4 ± 0.45 hrs'}
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              Status: {sleepBaseline?.status || 'ACTIVE'} <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-space-900 px-2 py-1 rounded">
            Rest &amp; Vigilance
          </span>
        </div>

        <div 
          onClick={() => setShowBaselineModal(true)}
          className="bg-space-950 border border-space-800 hover:border-space-700 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition shadow hover:shadow-nasa-cyan/10"
        >
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Exercise Recovery HRR-1 (7d)</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {hrrBaseline ? `${hrrBaseline.mean.toFixed(1)} ± ${hrrBaseline.std_dev.toFixed(1)} bpm` : '28.0 ± 3.0 bpm'}
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              Status: {hrrBaseline?.status || 'ACTIVE'} <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-space-900 px-2 py-1 rounded">
            Autonomic Tone
          </span>
        </div>
      </div>

      {/* Synchronized Multi-Indicator Time-Series Visualizer */}
      {timelineLoading ? (
        <div className="p-16 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-nasa-cyan animate-spin" /> Rendering synchronized time-series charts...
        </div>
      ) : (
        <SynchronizedCharts
          timeline={timeline}
          onOpenAlert={() => {
            if (activeAlert) onOpenEvidence(activeAlert.id);
          }}
          hasActiveAlert={Boolean(activeAlert)}
        />
      )}

      {/* Structured Daily Biometric Flight Log Table */}
      <div className="bg-space-950 border border-space-800 rounded-2xl p-5 shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-nasa-cyan" />
            <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
              Daily Biometric Telemetry &amp; Environmental Log
            </h3>
            <span className="text-[10px] font-mono text-slate-500 bg-space-900 px-2 py-0.5 rounded border border-space-800">
              {points.length} Flight Cycles Recorded
            </span>
          </div>

          <button
            onClick={() => setShowFlightLog(!showFlightLog)}
            className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white transition"
          >
            <span>{showFlightLog ? 'Collapse' : 'Expand'}</span>
            {showFlightLog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showFlightLog && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-space-800 text-[11px] text-slate-400 uppercase tracking-wider bg-space-900/60">
                <tr>
                  <th className="py-2.5 px-3">Flight Day</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Resting HR</th>
                  <th className="py-2.5 px-3">Sleep Duration</th>
                  <th className="py-2.5 px-3">HR Recovery (1m)</th>
                  <th className="py-2.5 px-3">Cabin CO2</th>
                  <th className="py-2.5 px-3">Operational Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-850 text-slate-300">
                {points.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No daily records found.
                    </td>
                  </tr>
                ) : (
                  points.map((pt, idx) => {
                    const rhrZ = pt.rhr_z_score;
                    const sleepZ = pt.sleep_z_score;
                    const hrrZ = pt.hrr_z_score;
                    const hasCO2Warning = pt.cabin_co2_ppm && pt.cabin_co2_ppm > 2500;
                    const isHighStressor = pt.mission_events.length > 0;

                    return (
                      <tr 
                        key={pt.date} 
                        className={`hover:bg-space-900/50 transition ${
                          hasCO2Warning || (rhrZ && rhrZ >= 2.0)
                            ? 'bg-red-950/15'
                            : isHighStressor
                              ? 'bg-amber-950/10'
                              : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-white">FD{idx + 1}</td>
                        <td className="py-2.5 px-3 text-slate-400">{pt.date}</td>

                        {/* RHR */}
                        <td className="py-2.5 px-3">
                          {pt.rhr_value !== null && pt.rhr_value !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span>{pt.rhr_value.toFixed(1)} bpm</span>
                              {rhrZ !== null && rhrZ !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  rhrZ >= 2.0 
                                    ? 'bg-red-950 text-red-400 border border-red-500/40' 
                                    : rhrZ >= 1.5 
                                      ? 'bg-amber-950 text-amber-400 border border-amber-500/40' 
                                      : 'text-slate-500'
                                }`}>
                                  {rhrZ > 0 ? `+${rhrZ.toFixed(1)}σ` : `${rhrZ.toFixed(1)}σ`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/40 font-bold">
                              DATA GAP
                            </span>
                          )}
                        </td>

                        {/* Sleep */}
                        <td className="py-2.5 px-3">
                          {pt.sleep_value !== null && pt.sleep_value !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span>{pt.sleep_value.toFixed(1)} hrs</span>
                              {sleepZ !== null && sleepZ !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  sleepZ <= -2.0 
                                    ? 'bg-red-950 text-red-400 border border-red-500/40' 
                                    : sleepZ <= -1.5 
                                      ? 'bg-amber-950 text-amber-400 border border-amber-500/40' 
                                      : 'text-slate-500'
                                }`}>
                                  {sleepZ > 0 ? `+${sleepZ.toFixed(1)}σ` : `${sleepZ.toFixed(1)}σ`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/40 font-bold">
                              DATA GAP
                            </span>
                          )}
                        </td>

                        {/* HRR */}
                        <td className="py-2.5 px-3">
                          {pt.hrr_value !== null && pt.hrr_value !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span>{pt.hrr_value.toFixed(1)} bpm</span>
                              {hrrZ !== null && hrrZ !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  hrrZ <= -2.0 
                                    ? 'bg-red-950 text-red-400 border border-red-500/40' 
                                    : hrrZ <= -1.5 
                                      ? 'bg-amber-950 text-amber-400 border border-amber-500/40' 
                                      : 'text-slate-500'
                                }`}>
                                  {hrrZ > 0 ? `+${hrrZ.toFixed(1)}σ` : `${hrrZ.toFixed(1)}σ`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/40 font-bold">
                              DATA GAP
                            </span>
                          )}
                        </td>

                        {/* CO2 */}
                        <td className="py-2.5 px-3">
                          {pt.cabin_co2_ppm ? (
                            <span className={`font-bold ${
                              pt.cabin_co2_ppm > 4000 
                                ? 'text-red-400' 
                                : pt.cabin_co2_ppm > 2500 
                                  ? 'text-amber-400' 
                                  : 'text-slate-400'
                            }`}>
                              {pt.cabin_co2_ppm} ppm
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Mission Events */}
                        <td className="py-2.5 px-3">
                          {pt.mission_events.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {pt.mission_events.map((ev, i) => (
                                <span 
                                  key={i} 
                                  className="text-[10px] bg-space-850 px-2 py-0.5 rounded border border-space-700 text-amber-300 font-medium"
                                >
                                  {ev}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[11px]">Nominal Schedule</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Baseline Inspector & Recompute Modal */}
      {showBaselineModal && (
        <BaselineInspectorModal
          astronaut={astronaut}
          onClose={() => setShowBaselineModal(false)}
          onBaselineUpdated={() => {
            if (onRefreshTimeline) onRefreshTimeline();
          }}
        />
      )}

      {/* Flight Surgeon Handover Dossier Modal */}
      <MedicalHandoverModal
        astronautId={astronaut.id}
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
      />

      {/* Quick Bedside Telemetry Logging Modal */}
      <QuickTelemetryModal
        astronaut={astronaut}
        isOpen={showQuickTelemetry}
        onClose={() => setShowQuickTelemetry(false)}
        onSuccess={() => {
          if (onRefreshTimeline) onRefreshTimeline();
        }}
      />

      {/* Flight Medical Clearance Modifier Modal */}
      <ClearanceUpdateModal
        astronaut={astronaut}
        isOpen={showClearanceModal}
        onClose={() => setShowClearanceModal(false)}
        onSuccess={() => {
          if (onRefreshTimeline) onRefreshTimeline();
        }}
      />
    </section>
  );
}
