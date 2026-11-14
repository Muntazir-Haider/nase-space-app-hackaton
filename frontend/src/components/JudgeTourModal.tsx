import { useState } from 'react';
import { 
  Compass, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Play, 
  HeartPulse, 
  AlertTriangle, 
  Activity, 
  Radio, 
  BrainCircuit,
  Loader2
} from 'lucide-react';
import { loadDemoScenario, triggerCommsFlush } from '../services/api';
import { ActiveView } from './layout/Navbar';

interface JudgeTourModalProps {
  onClose: () => void;
  onNavigateView: (view: ActiveView) => void;
  onScenarioLoaded: (scenarioKey: string) => void;
}

interface TourStep {
  step: number;
  title: string;
  badge: string;
  badgeColor: string;
  icon: any;
  leadNarrative: string;
  technicalDetails: string[];
  actionLabel: string;
  actionHandler: () => Promise<void>;
  targetView: ActiveView;
}

export function JudgeTourModal({ onClose, onNavigateView, onScenarioLoaded }: JudgeTourModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [executing, setExecuting] = useState<boolean>(false);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  const steps: TourStep[] = [
    {
      step: 1,
      title: "Stage 1: Establish Rolling Personal Baselines",
      badge: "Scenario A: Nominal Flight",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      icon: HeartPulse,
      leadNarrative: "Spacecraft crews cannot be evaluated against generic static population thresholds. Mission Sentinel establishes individual 7-day rolling baselines with Bessel's correction.",
      technicalDetails: [
        "Enforces calendar-time window [T - 7d, T] with minimum sample threshold N >= 4.",
        "Calculates mean (μ), median (M), and sample standard deviation (σ with ddof=1).",
        "Result: Entire fleet displays NOMINAL readiness; zero false alerts generated."
      ],
      actionLabel: "Load Nominal Baseline (Scenario A)",
      targetView: 'fleet',
      actionHandler: async () => {
        await loadDemoScenario('SCENARIO_A_NOMINAL');
        onScenarioLoaded('SCENARIO_A_NOMINAL');
        onNavigateView('fleet');
      },
    },
    {
      step: 2,
      title: "Stage 2: False Alarm Suppression on Acute Spikes",
      badge: "Scenario B: EVA Exertion Spike",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      icon: AlertTriangle,
      leadNarrative: "In deep space, excessive false alarms cause crew alarm fatigue. When an astronaut conducts an intense EVA workout, their heart rate acutely spikes without indicating chronic pathology.",
      technicalDetails: [
        "Day 5: Single acute Resting Heart Rate spike to 92 bpm (+16.6σ) following heavy EVA drill.",
        "Mission Sentinel's 3-day multi-indicator persistence gate safely filters the isolated spike.",
        "Outcome: 0 false alerts generated; avoids dangerous medical alarm fatigue."
      ],
      actionLabel: "Test Spike Suppression (Scenario B)",
      targetView: 'review',
      actionHandler: async () => {
        await loadDemoScenario('SCENARIO_B_ACUTE_SPIKE');
        onScenarioLoaded('SCENARIO_B_ACUTE_SPIKE');
        onNavigateView('review');
      },
    },
    {
      step: 3,
      title: "Stage 3: Silent Deterioration Hero Event",
      badge: "Scenario C: Winning Hero Demo",
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
      icon: Activity,
      leadNarrative: "The core challenge innovation: subtle, multi-indicator physiological deconditioning over multi-day windows under operational and environmental spacecraft stress.",
      technicalDetails: [
        "Days 8–12: Commander Dr. Elena Vance undergoes strenuous EVA prep and elevated cabin CO2 (4,075 ppm).",
        "RHR creeps up (+2.7 bpm/day), sleep duration collapses (-0.43 hr/day), and cardiac recovery slows (-2.8 bpm/day).",
        "Ordinary Least Squares (OLS) regression triggers High-Priority Alert on Day 11 with NASA HRR citations."
      ],
      actionLabel: "Trigger Silent Deterioration (Scenario C)",
      targetView: 'review',
      actionHandler: async () => {
        await loadDemoScenario('SCENARIO_C_SILENT_DETERIORATION');
        onScenarioLoaded('SCENARIO_C_SILENT_DETERIORATION');
        onNavigateView('review');
      },
    },
    {
      step: 4,
      title: "Stage 4: Clinical Evidence Audit & Countermeasure Tracking",
      badge: "Clinical Decision Support",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      icon: CheckCircle2,
      leadNarrative: "Every alert provides complete evidence provenance linking raw observation UUIDs, OLS regression math, and active clinical countermeasure protocols.",
      technicalDetails: [
        "CMO inspects exact baseline deviations, mathematical slopes, and environmental CO2 telemetry.",
        "Clinical countermeasure: CMO prescribes cardiovascular conditioning & sleep hygiene adjustments.",
        "Lifecycle management: Alert transitions from NEW to MONITORING to COMPLETED with auditable review notes."
      ],
      actionLabel: "Open Medical Review Workspace",
      targetView: 'review',
      actionHandler: async () => {
        onNavigateView('review');
      },
    },
    {
      step: 5,
      title: "Stage 5: 100% Offline Store-and-Forward Comms Pass",
      badge: "Station Diagnostics & DSN Relay",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      icon: Radio,
      leadNarrative: "Because Mars comms latency is 22 minutes each way, the spacecraft operates 100% locally. Transactions are queued with SHA-256 idempotency and flushed during DSN passes.",
      technicalDetails: [
        "14-table local SQLite WAL database survives power loss and process restarts without corruption.",
        "Offline sync queue uses deterministic SHA-256 hashing to guarantee zero duplicate records on Earth uplink.",
        "Interactive Deep Space Network (DSN) simulator flushes pending transactions to Earth in 1 click."
      ],
      actionLabel: "Simulate DSN High-Gain Pass Flush",
      targetView: 'diagnostics',
      actionHandler: async () => {
        const res = await triggerCommsFlush();
        setExecutionMessage(res.message);
        onNavigateView('diagnostics');
      },
    },
    {
      step: 6,
      title: "Stage 6: Aerospace ML Anomaly Benchmark",
      badge: "Rules vs. Isolation Forest & LOF",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      icon: BrainCircuit,
      leadNarrative: "Rigorous benchmark comparing deterministic clinical rules against Scikit-Learn Isolation Forest and Local Outlier Factor (LOF).",
      technicalDetails: [
        "Rule-Based OLS achieves 10/10 explainability and 0 false alarms on isolated spikes.",
        "Isolation Forest provides valuable continuous anomaly probability curves [0, 1] as an early companion.",
        "Demonstrates NASA flight surgeon rationale for hybrid autonomous decision support."
      ],
      actionLabel: "Open ML Benchmark Visualizer",
      targetView: 'benchmark',
      actionHandler: async () => {
        onNavigateView('benchmark');
      },
    },
  ];

  const current = steps[currentStep - 1];

  async function handleExecuteStepAction() {
    setExecuting(true);
    setExecutionMessage(null);
    try {
      await current.actionHandler();
      setExecutionMessage("Action executed successfully! Application state updated.");
    } catch (err: unknown) {
      setExecutionMessage(`Execution note: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-space-900 border border-space-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Top Header */}
        <div className="p-5 border-b border-space-800 flex items-center justify-between bg-space-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nasa-blue to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Mission Sentinel Evaluation Walkthrough</h3>
                <span className="text-[10px] font-mono uppercase bg-nasa-blue/30 text-nasa-cyan px-2 py-0.5 rounded border border-nasa-cyan/30">
                  Judge Guide
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                NASA Space Apps Challenge 2026 · Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-space-800 hover:bg-space-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-6 border-b border-space-800 bg-space-950">
          {steps.map((s) => (
            <button
              key={s.step}
              onClick={() => {
                setCurrentStep(s.step);
                setExecutionMessage(null);
              }}
              className={`py-2 px-1 text-center border-b-2 font-mono text-[11px] transition ${
                currentStep === s.step
                  ? 'border-nasa-cyan text-nasa-cyan font-bold bg-space-900/60'
                  : currentStep > s.step
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Stage {s.step}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
          {/* Badge & Title */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold inline-block ${current.badgeColor}`}>
              {current.badge}
            </span>
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <current.icon className="w-5 h-5 text-nasa-cyan" />
              <span>{current.title}</span>
            </h4>
          </div>

          {/* Lead Narrative */}
          <p className="text-sm text-slate-200 leading-relaxed bg-space-950/80 p-4 rounded-xl border border-space-800">
            {current.leadNarrative}
          </p>

          {/* Technical Bullets */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-semibold">
              Aerospace & Clinical Engineering Specifications:
            </span>
            <ul className="space-y-2">
              {current.technicalDetails.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Feedback message if action executed */}
          {executionMessage && (
            <div className="p-3 rounded-xl bg-space-950 border border-nasa-cyan/40 text-xs font-mono text-nasa-cyan flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-nasa-cyan animate-ping" />
              <span>{executionMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-space-800 bg-space-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                  setExecutionMessage(null);
                }
              }}
              disabled={currentStep === 1 || executing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-space-700 bg-space-800 hover:bg-space-700 text-xs font-mono text-slate-300 disabled:opacity-40 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => {
                if (currentStep < steps.length) {
                  setCurrentStep(currentStep + 1);
                  setExecutionMessage(null);
                }
              }}
              disabled={currentStep === steps.length || executing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-space-700 bg-space-800 hover:bg-space-700 text-xs font-mono text-slate-300 disabled:opacity-40 transition"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExecuteStepAction}
              disabled={executing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-nasa-blue to-purple-600 hover:from-nasa-blue/90 hover:to-purple-500 text-white text-xs font-mono font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50 transition"
            >
              {executing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Loading State...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{current.actionLabel}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-space-700 hover:border-slate-500 text-xs font-mono text-slate-400 hover:text-white transition"
            >
              Close Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
