import { useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Moon, 
  Zap, 
  Loader2, 
  Users,
  Calculator,
  ChevronRight
} from 'lucide-react';
import { 
  AstronautSummary, 
  AstronautTimelineResponse, 
  DeteriorationAlert 
} from '../../types';
import { SynchronizedCharts } from '../SynchronizedCharts';
import { BaselineInspectorModal } from './BaselineInspectorModal';

interface AstronautProfileDetailProps {
  astronaut: AstronautSummary | null;
  timeline: AstronautTimelineResponse | null;
  activeAlert: DeteriorationAlert | null;
  timelineLoading: boolean;
  onOpenEvidence: (alertId: string) => void;
  onOpenRegisterModal: () => void;
  onRefreshTimeline?: () => void;
}

export function AstronautProfileDetail({
  astronaut,
  timeline,
  activeAlert,
  timelineLoading,
  onOpenEvidence,
  onOpenRegisterModal,
  onRefreshTimeline,
}: AstronautProfileDetailProps) {
  const [showBaselineModal, setShowBaselineModal] = useState<boolean>(false);

  if (!astronaut) {
    return (
      <div className="bg-space-900 border border-space-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
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

  const rhrBaseline = timeline?.baselines['RESTING_HEART_RATE'];
  const sleepBaseline = timeline?.baselines['SLEEP_DURATION'];
  const hrrBaseline = timeline?.baselines['HEART_RATE_RECOVERY_1MIN'];

  return (
    <section className="bg-space-900 border border-space-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-space-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-xl text-white">{astronaut.full_name}</h2>
            <span className="text-xs font-mono text-nasa-cyan bg-space-850 px-2.5 py-0.5 rounded border border-space-700">
              {astronaut.callsign}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {astronaut.mission_role} · {astronaut.mission_code}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Personal Flight Baseline Reference: 7-Day Calendar-Time Rolling Window with Bessel&apos;s Correction (N-1)
          </p>
        </div>

        <div className="flex items-center gap-3">
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
    </section>
  );
}
