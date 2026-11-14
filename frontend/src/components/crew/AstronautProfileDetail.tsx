import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Moon, 
  Zap, 
  Loader2, 
  Users, 
  Calculator, 
  ChevronRight, 
  CheckCircle2, 
  Table, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  PlusCircle, 
  UserCheck,
  Stethoscope
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
import { AnatomicalScanner } from '../nasa/AnatomicalScanner';
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
  const [showScanner, setShowScanner] = useState<boolean>(true);

  if (!astronaut) {
    return (
      <div className="bg-white border border-slate-300 rounded-md p-12 text-center flex flex-col items-center justify-center gap-4 shadow-2xs font-sans">
        <Users className="w-10 h-10 text-slate-400" />
        <div>
          <h3 className="text-base font-bold text-slate-800">No Astronaut Selected</h3>
          <p className="text-xs text-slate-500 mt-1">
            Select a crew member from the fleet roster to view vitals.
          </p>
        </div>
        <button
          onClick={onOpenRegisterModal}
          className="px-4 py-2 rounded-lg bg-[#0b3d91] text-white text-xs font-bold transition shadow-sm"
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
      setAnalysisFeedback(`Analysis complete (${res.execution_duration_ms}ms) · ${res.alerts_generated_count} alert(s) active.`);
      if (onRefreshTimeline) {
        onRefreshTimeline();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAnalysisFeedback(`Failed: ${msg}`);
    } finally {
      setRunningAnalysis(false);
      setTimeout(() => setAnalysisFeedback(''), 4000);
    }
  }

  const rhrBaseline = timeline?.baselines['RESTING_HEART_RATE'];
  const sleepBaseline = timeline?.baselines['SLEEP_DURATION'];
  const hrrBaseline = timeline?.baselines['HEART_RATE_RECOVERY_1MIN'];
  const points = timeline?.timeline_points || [];

  const baseLatestRhr = points.length > 0 && points[points.length - 1]?.rhr_value 
    ? points[points.length - 1].rhr_value! 
    : (activeAlert ? 68.9 : 62.4);
  const baseLatestSleep = points.length > 0 && points[points.length - 1]?.sleep_value 
    ? points[points.length - 1].sleep_value! 
    : (activeAlert ? 5.2 : 7.6);
  const baseLatestHrr = points.length > 0 && points[points.length - 1]?.hrr_value 
    ? points[points.length - 1].hrr_value! 
    : (activeAlert ? 24.5 : 34.0);
  const baseLatestSpo2 = 98.4;
  const baseLatestTemp = 36.8;

  const [liveVitals, setLiveVitals] = useState({
    rhr: baseLatestRhr,
    sleep: baseLatestSleep,
    hrr: baseLatestHrr,
    spo2: baseLatestSpo2,
    temp: baseLatestTemp,
  });

  // Keep live vitals synchronized with astronaut, scenario, and timeline changes
  useEffect(() => {
    setLiveVitals({
      rhr: baseLatestRhr,
      sleep: baseLatestSleep,
      hrr: baseLatestHrr,
      spo2: baseLatestSpo2,
      temp: baseLatestTemp,
    });
  }, [baseLatestRhr, baseLatestSleep, baseLatestHrr, baseLatestSpo2, baseLatestTemp, astronaut.id, activeAlert?.id]);

  // Authentic human physiological telemetry simulation (sinus arrhythmia, respiration cycle, autonomic micro-fluctuation)
  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      // High-cadence sinus arrhythmia and autonomic micro-fluctuations (~450ms stream, ~2.2 Hz)
      const rhrDrift = Math.sin(tick * 0.28) * 0.95 + Math.cos(tick * 0.14) * 0.5 + (Math.random() - 0.5) * 0.35;
      const nextRhr = Math.round((baseLatestRhr + rhrDrift) * 10) / 10;

      // SpO2 arterial saturation micro-variation (97.8% - 99.4%)
      const spo2Drift = Math.sin(tick * 0.12) * 0.2 + (Math.random() - 0.5) * 0.15;
      const nextSpo2 = Math.round(Math.min(99.8, Math.max(93.0, baseLatestSpo2 + spo2Drift)) * 10) / 10;

      // Core temp metabolic micro-variation (36.72°C - 36.92°C)
      const tempDrift = Math.sin(tick * 0.08) * 0.05 + (Math.random() - 0.5) * 0.02;
      const nextTemp = Math.round((baseLatestTemp + tempDrift) * 100) / 100;

      // HRR autonomic recovery fluctuation
      const hrrDrift = Math.sin(tick * 0.2) * 0.4 + (Math.random() - 0.5) * 0.25;
      const nextHrr = Math.round((baseLatestHrr + hrrDrift) * 10) / 10;

      setLiveVitals({
        rhr: nextRhr,
        sleep: baseLatestSleep,
        hrr: nextHrr,
        spo2: nextSpo2,
        temp: nextTemp,
      });
    }, 450);

    return () => clearInterval(interval);
  }, [baseLatestRhr, baseLatestSleep, baseLatestHrr, baseLatestSpo2, baseLatestTemp]);

  return (
    <section className="bg-white border border-slate-300 rounded-md p-6 shadow-2xs flex flex-col gap-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-bold text-2xl text-slate-900 tracking-tight">{astronaut.full_name}</h2>
            <span className="text-xs font-mono font-bold text-[#0b3d91] bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              {astronaut.callsign}
            </span>
            <span className="text-xs text-slate-600">
              {astronaut.mission_role} · <span className="font-semibold text-slate-800">{astronaut.mission_code}</span>
            </span>
            <button
              onClick={() => setShowClearanceModal(true)}
              className={`text-xs font-semibold px-3 py-1 rounded border transition flex items-center gap-1.5 cursor-pointer ${
                astronaut.medical_clearance_status === 'FULL_FLIGHT_CLEARANCE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : astronaut.medical_clearance_status === 'TEMPORARY_MEDICAL_HOLD'
                  ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {astronaut.medical_clearance_status === 'FULL_FLIGHT_CLEARANCE'
                  ? 'Cleared for Duty'
                  : astronaut.medical_clearance_status === 'TEMPORARY_MEDICAL_HOLD'
                  ? 'Medical Hold'
                  : 'Restricted Duty'}
              </span>
            </button>
          </div>
          {analysisFeedback && (
            <div className="mt-2 text-xs text-[#0b3d91] flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{analysisFeedback}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition shadow-sm ${
              showScanner
                ? 'bg-blue-50 border-blue-300 text-[#0b3d91]'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#0b3d91]" />
            <span>{showScanner ? '3D Biometrics: Visible' : 'Show 3D Biometrics'}</span>
          </button>

          <button
            onClick={() => setShowQuickTelemetry(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#0b3d91]" />
            <span>+ Log Vitals</span>
          </button>

          <button
            onClick={() => setShowHandoverModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-[#0b3d91]" />
            <span>Handover Report</span>
          </button>

          <button
            onClick={handleTriggerAnalysis}
            disabled={runningAnalysis}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-sm"
          >
            {runningAnalysis ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{runningAnalysis ? 'Analyzing...' : 'Run Analysis'}</span>
          </button>

          <button
            onClick={() => setShowBaselineModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5 text-[#0b3d91]" />
            <span>Baselines</span>
          </button>

          {activeAlert ? (
            <button
              onClick={() => onOpenEvidence(activeAlert.id)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>Review Alert ({activeAlert.review_priority})</span>
            </button>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Nominal</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Telemetry Tester */}
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

      {/* Baseline & Live Telemetry Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Resting Heart Rate */}
        <div 
          onClick={() => setShowBaselineModal(true)}
          className="bg-white border border-slate-300 hover:border-slate-400 rounded-md p-4 flex flex-col justify-between cursor-pointer transition shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Activity className="w-4 h-4 text-red-500" />
              <span>Resting Heart Rate</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight flex items-baseline justify-between">
              <span>{liveVitals.rhr.toFixed(1)} <span className="text-sm font-normal text-slate-500">bpm</span></span>
              {rhrBaseline && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  Math.abs((liveVitals.rhr - rhrBaseline.mean) / rhrBaseline.std_dev) >= 1.5 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {((liveVitals.rhr - rhrBaseline.mean) / rhrBaseline.std_dev) > 0 ? '+' : ''}
                  {((liveVitals.rhr - rhrBaseline.mean) / rhrBaseline.std_dev).toFixed(2)}σ
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">
              Baseline: {rhrBaseline ? `${rhrBaseline.mean.toFixed(1)} ± ${rhrBaseline.std_dev.toFixed(1)} bpm` : '62.0 ± 2.5 bpm'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Continuous Stream Active
            </span>
            <span className="text-[#0b3d91] font-semibold flex items-center gap-0.5">
              Inspect <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Sleep Duration */}
        <div 
          onClick={() => setShowBaselineModal(true)}
          className="bg-white border border-slate-300 hover:border-slate-400 rounded-md p-4 flex flex-col justify-between cursor-pointer transition shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Moon className="w-4 h-4 text-sky-600" />
              <span>Sleep Duration</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Circadian Phase
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight flex items-baseline justify-between">
              <span>{liveVitals.sleep.toFixed(1)} <span className="text-sm font-normal text-slate-500">hrs</span></span>
              {sleepBaseline && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  (liveVitals.sleep - sleepBaseline.mean) / sleepBaseline.std_dev <= -1.5 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {((liveVitals.sleep - sleepBaseline.mean) / sleepBaseline.std_dev).toFixed(2)}σ
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">
              Baseline: {sleepBaseline ? `${sleepBaseline.mean.toFixed(1)} ± ${sleepBaseline.std_dev.toFixed(2)} hrs` : '7.4 ± 0.45 hrs'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              7-Day Baseline Active
            </span>
            <span className="text-[#0b3d91] font-semibold flex items-center gap-0.5">
              Inspect <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Recovery HRR */}
        <div 
          onClick={() => setShowBaselineModal(true)}
          className="bg-white border border-slate-300 hover:border-slate-400 rounded-md p-4 flex flex-col justify-between cursor-pointer transition shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Recovery (HRR-1)</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Autonomic
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight flex items-baseline justify-between">
              <span>{liveVitals.hrr.toFixed(1)} <span className="text-sm font-normal text-slate-500">bpm</span></span>
              {hrrBaseline && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  (liveVitals.hrr - hrrBaseline.mean) / hrrBaseline.std_dev <= -1.5 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {((liveVitals.hrr - hrrBaseline.mean) / hrrBaseline.std_dev) > 0 ? '+' : ''}
                  {((liveVitals.hrr - hrrBaseline.mean) / hrrBaseline.std_dev).toFixed(2)}σ
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">
              Baseline: {hrrBaseline ? `${hrrBaseline.mean.toFixed(1)} ± ${hrrBaseline.std_dev.toFixed(1)} bpm` : '28.0 ± 3.0 bpm'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Continuous Stream Active
            </span>
            <span className="text-[#0b3d91] font-semibold flex items-center gap-0.5">
              Inspect <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 3D Anatomical Biometric Hologram */}
      {showScanner && (
        <AnatomicalScanner
          astronaut={astronaut}
          activeAlert={activeAlert}
          latestVitals={liveVitals}
        />
      )}

      {/* Synchronized Multi-Indicator Charts */}
      {timelineLoading ? (
        <div className="p-16 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-[#0b3d91] animate-spin" /> Loading charts...
        </div>
      ) : (
        <SynchronizedCharts
          timeline={timeline}
          liveVitals={liveVitals}
          onOpenAlert={() => {
            if (activeAlert) onOpenEvidence(activeAlert.id);
          }}
          hasActiveAlert={Boolean(activeAlert)}
        />
      )}

      {/* Flight Log Excel Sheet */}
      <div className="bg-white border border-slate-300 rounded-md p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-[#0b3d91]" />
            <h3 className="font-bold text-sm text-slate-800 font-mono uppercase tracking-wider">
              Telemetry Data Worksheet
            </h3>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              .XLSX View · {points.length} Records
            </span>
          </div>

          <button
            onClick={() => setShowFlightLog(!showFlightLog)}
            className="flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-slate-800 transition"
          >
            <span>{showFlightLog ? 'Collapse Sheet' : 'Expand Sheet'}</span>
            {showFlightLog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showFlightLog && (
          <div className="excel-grid-container">
            {/* Excel Formula Bar */}
            <div className="excel-formula-bar">
              <div className="bg-white border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded">
                A1:G{Math.max(points.length, 1)}
              </div>
              <div className="text-slate-400 font-serif italic text-xs font-bold">fx</div>
              <div className="text-slate-700 text-[11px] truncate flex-1">
                =TELEMETRY_LOG(CALLSIGN="{astronaut.callsign}", RANGE=FD1..FD{points.length}, METRICS=["RHR", "SLEEP", "HRR", "CO2"])
              </div>
            </div>

            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="excel-table">
                <thead>
                  {/* Excel Column Letters (A, B, C...) */}
                  <tr>
                    <th className="excel-col-letter w-9 min-w-9">#</th>
                    <th className="excel-col-letter">A</th>
                    <th className="excel-col-letter">B</th>
                    <th className="excel-col-letter">C</th>
                    <th className="excel-col-letter">D</th>
                    <th className="excel-col-letter">E</th>
                    <th className="excel-col-letter">F</th>
                    <th className="excel-col-letter">G</th>
                  </tr>
                  {/* Column Header Titles */}
                  <tr>
                    <th className="excel-th w-9 min-w-9 text-center">Row</th>
                    <th className="excel-th">Flight Day ▼</th>
                    <th className="excel-th">Date ▼</th>
                    <th className="excel-th">Resting HR (bpm) ▼</th>
                    <th className="excel-th">Sleep Duration (hrs) ▼</th>
                    <th className="excel-th">HR Recovery (bpm) ▼</th>
                    <th className="excel-th">Cabin CO2 (ppm) ▼</th>
                    <th className="excel-th">Events & Notes ▼</th>
                  </tr>
                </thead>
                <tbody>
                  {points.length === 0 ? (
                    <tr className="excel-row">
                      <td className="excel-row-num">1</td>
                      <td colSpan={7} className="excel-td text-center text-slate-400 py-6">
                        No telemetry records available in worksheet.
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
                          className={`excel-row transition ${
                            hasCO2Warning || (rhrZ && rhrZ >= 2.0)
                              ? 'bg-red-50/50'
                              : isHighStressor
                                ? 'bg-amber-50/30'
                                : idx % 2 === 1
                                  ? 'bg-[#fcfdfd]'
                                  : 'bg-white'
                          }`}
                        >
                          {/* Row Number Gutter */}
                          <td className="excel-row-num">{idx + 1}</td>

                          {/* Column A: Flight Day */}
                          <td className="excel-td font-bold text-slate-900">
                            FD{idx + 1}
                          </td>

                          {/* Column B: Date */}
                          <td className="excel-td text-slate-500">
                            {pt.date}
                          </td>

                          {/* Column C: RHR */}
                          <td className="excel-td">
                            {pt.rhr_value !== null && pt.rhr_value !== undefined ? (
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold">{pt.rhr_value.toFixed(1)}</span>
                                {rhrZ !== null && rhrZ !== undefined && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                    rhrZ >= 2.0 
                                      ? 'bg-red-100 text-red-800 border border-red-300' 
                                      : rhrZ >= 1.5 
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                        : 'text-slate-400'
                                  }`}>
                                    {rhrZ > 0 ? `+${rhrZ.toFixed(1)}σ` : `${rhrZ.toFixed(1)}σ`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                                GAP
                              </span>
                            )}
                          </td>

                          {/* Column D: Sleep */}
                          <td className="excel-td">
                            {pt.sleep_value !== null && pt.sleep_value !== undefined ? (
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold">{pt.sleep_value.toFixed(1)}</span>
                                {sleepZ !== null && sleepZ !== undefined && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                    sleepZ <= -2.0 
                                      ? 'bg-red-100 text-red-800 border border-red-300' 
                                      : sleepZ <= -1.5 
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                        : 'text-slate-400'
                                  }`}>
                                    {sleepZ > 0 ? `+${sleepZ.toFixed(1)}σ` : `${sleepZ.toFixed(1)}σ`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                                GAP
                              </span>
                            )}
                          </td>

                          {/* Column E: HRR */}
                          <td className="excel-td">
                            {pt.hrr_value !== null && pt.hrr_value !== undefined ? (
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold">{pt.hrr_value.toFixed(1)}</span>
                                {hrrZ !== null && hrrZ !== undefined && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                    hrrZ <= -2.0 
                                      ? 'bg-red-100 text-red-800 border border-red-300' 
                                      : hrrZ <= -1.5 
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                        : 'text-slate-400'
                                  }`}>
                                    {hrrZ > 0 ? `+${hrrZ.toFixed(1)}σ` : `${hrrZ.toFixed(1)}σ`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                                GAP
                              </span>
                            )}
                          </td>

                          {/* Column F: CO2 */}
                          <td className="excel-td">
                            {pt.cabin_co2_ppm ? (
                              <span className={`font-semibold ${
                                pt.cabin_co2_ppm > 4000 
                                  ? 'text-red-700 font-bold' 
                                  : pt.cabin_co2_ppm > 2500 
                                    ? 'text-amber-800 font-bold' 
                                    : 'text-slate-700'
                              }`}>
                                {pt.cabin_co2_ppm}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Column G: Events */}
                          <td className="excel-td">
                            {pt.mission_events.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {pt.mission_events.map((ev, i) => (
                                  <span 
                                    key={i} 
                                    className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-medium"
                                  >
                                    {ev}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Nominal Schedule</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Excel Status Bar */}
            <div className="excel-status-bar">
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-700">READY</span>
                <span className="text-slate-400">|</span>
                <span>Sheet1: FD_Telemetry</span>
                <span className="text-slate-400">|</span>
                <span>Astronaut: {astronaut.callsign}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Rows: <strong className="text-slate-800">{points.length}</strong></span>
                <span>Cols: <strong className="text-slate-800">7 (A:G)</strong></span>
                {points.length > 0 && (
                  <span>
                    Avg RHR: <strong className="text-slate-800">
                      {(points.reduce((acc, p) => acc + (p.rhr_value || 0), 0) / (points.filter(p => p.rhr_value).length || 1)).toFixed(1)} bpm
                    </strong>
                  </span>
                )}
                <span className="text-slate-400">|</span>
                <span>Zoom: 100%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showBaselineModal && (
        <BaselineInspectorModal
          astronaut={astronaut}
          onClose={() => setShowBaselineModal(false)}
          onBaselineUpdated={() => {
            if (onRefreshTimeline) onRefreshTimeline();
          }}
        />
      )}

      <MedicalHandoverModal
        astronautId={astronaut.id}
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
      />

      <QuickTelemetryModal
        astronaut={astronaut}
        isOpen={showQuickTelemetry}
        onClose={() => setShowQuickTelemetry(false)}
        onSuccess={() => {
          if (onRefreshTimeline) onRefreshTimeline();
        }}
      />

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
