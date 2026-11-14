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
      title: "Stage 1: Rolling Personal Baselines",
      badge: "Scenario A: Nominal Flight",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: HeartPulse,
      leadNarrative: "Evaluates astronauts using personalized 7-day rolling baselines instead of static population thresholds.",
      technicalDetails: [
        "Calculates individual mean, median, and sample standard deviation (7-day window).",
        "Enforces minimum valid sample threshold (N >= 4 readings).",
        "Result: Fleet nominal readiness with 0 false alarms."
      ],
      actionLabel: "Load Nominal Baseline",
      targetView: 'fleet',
      actionHandler: async () => {
        await loadDemoScenario('SCENARIO_A_NOMINAL');
        onScenarioLoaded('SCENARIO_A_NOMINAL');
        onNavigateView('fleet');
      },
    },
    {
      step: 2,
      title: "Stage 2: False Alarm Suppression on Spikes",
      badge: "Scenario B: Acute Spikes",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      icon: AlertTriangle,
      leadNarrative: "Acute exertion causes transient heart rate spikes that should not trigger false chronic alarms.",
      technicalDetails: [
        "Day 5: Single acute heart rate spike following heavy EVA workout.",
        "Multi-indicator persistence gate safely suppresses isolated spikes.",
        "Outcome: Prevents medical alarm fatigue."
      ],
      actionLabel: "Test Spike Suppression",
      targetView: 'review',
      actionHandler: async () => {
        await loadDemoScenario('SCENARIO_B_ACUTE_SPIKE');
        onScenarioLoaded('SCENARIO_B_ACUTE_SPIKE');
        onNavigateView('review');
      },
    },
    {
      step: 3,
      title: "Stage 3: Silent Deterioration Detection",
      badge: "Scenario C: Multi-Day Drift",
      badgeColor: "bg-red-50 text-red-800 border-red-200",
      icon: Activity,
      leadNarrative: "Detects subtle multi-indicator physiological deconditioning over consecutive days under spacecraft stress.",
      technicalDetails: [
        "Commander experiences EVA prep and elevated cabin CO2 (4,075 ppm).",
        "Heart rate drift (+2.7 bpm/day), sleep loss (-0.43 hr/day), recovery delay (-2.8 bpm/day).",
        "Triggers High-Priority Alert with full mathematical evidence."
      ],
      actionLabel: "Trigger Deterioration Demo",
      targetView: 'review',
      actionHandler: async () => {
        await loadDemoScenario('SCENARIO_C_SILENT_DETERIORATION');
        onScenarioLoaded('SCENARIO_C_SILENT_DETERIORATION');
        onNavigateView('review');
      },
    },
    {
      step: 4,
      title: "Stage 4: Evidence Audit & Countermeasures",
      badge: "Clinical Decision Support",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
      icon: CheckCircle2,
      leadNarrative: "Provides complete evidence provenance connecting raw observations, OLS math, and clinical protocols.",
      technicalDetails: [
        "Inspect exact baseline deviations, regression slopes, and CO2 exposure.",
        "Prescribe targeted countermeasures (sleep cycle adjustment, workout modulation).",
        "Lifecycle state management with auditable review history."
      ],
      actionLabel: "Open Medical Review",
      targetView: 'review',
      actionHandler: async () => {
        onNavigateView('review');
      },
    },
    {
      step: 5,
      title: "Stage 5: Offline Store-and-Forward Comms",
      badge: "Diagnostics & Relay",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: Radio,
      leadNarrative: "Because deep space comms have substantial latency, the system runs 100% locally with offline queueing.",
      technicalDetails: [
        "Local SQLite WAL storage operates without cloud connectivity.",
        "Transactions queued with SHA-256 idempotency preventing duplicate records.",
        "Simulate Deep Space Network (DSN) uplink pass with 1 click."
      ],
      actionLabel: "Simulate DSN Comms Pass",
      targetView: 'diagnostics',
      actionHandler: async () => {
        const res = await triggerCommsFlush();
        setExecutionMessage(res.message);
        onNavigateView('diagnostics');
      },
    },
    {
      step: 6,
      title: "Stage 6: Aerospace ML Benchmark",
      badge: "Rules vs. Isolation Forest & LOF",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
      icon: BrainCircuit,
      leadNarrative: "Compares deterministic clinical rules against unsupervised Isolation Forest and Local Outlier Factor.",
      technicalDetails: [
        "Rule-based OLS offers full explainability and zero spike false alarms.",
        "Isolation Forest provides continuous early anomaly probability scores.",
        "Evaluates hybrid decision-support architecture for spaceflight."
      ],
      actionLabel: "Open ML Benchmark",
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
      setExecutionMessage("Action executed successfully.");
    } catch (err: unknown) {
      setExecutionMessage(`Execution note: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0b3d91] flex items-center justify-center shadow-sm">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-800">Mission Walkthrough</h3>
                <span className="text-[10px] font-mono uppercase bg-blue-50 text-[#0b3d91] px-2 py-0.5 rounded border border-blue-200 font-bold">
                  Guide
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-6 border-b border-slate-200 bg-white">
          {steps.map((s) => (
            <button
              key={s.step}
              onClick={() => {
                setCurrentStep(s.step);
                setExecutionMessage(null);
              }}
              className={`py-2 px-1 text-center border-b-2 font-mono text-xs transition ${
                currentStep === s.step
                  ? 'border-[#0b3d91] text-[#0b3d91] font-bold bg-blue-50/50'
                  : currentStep > s.step
                    ? 'border-emerald-500 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Stage {s.step}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Badge & Title */}
          <div className="space-y-1">
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold inline-block ${current.badgeColor}`}>
              {current.badge}
            </span>
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <current.icon className="w-5 h-5 text-[#0b3d91]" />
              <span>{current.title}</span>
            </h4>
          </div>

          {/* Lead Narrative */}
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {current.leadNarrative}
          </p>

          {/* Technical Bullets */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
              Key Capabilities:
            </span>
            <ul className="space-y-1.5">
              {current.technicalDetails.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Feedback message if action executed */}
          {executionMessage && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-mono text-[#0b3d91] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0b3d91]" />
              <span>{executionMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                  setExecutionMessage(null);
                }
              }}
              disabled={currentStep === 1 || executing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-mono text-slate-700 disabled:opacity-40 transition"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-mono text-slate-700 disabled:opacity-40 transition"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExecuteStepAction}
              disabled={executing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b3d91] hover:bg-blue-800 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition"
            >
              {executing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Loading...</span>
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
              className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs text-slate-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
