import { 
  HeartPulse, 
  Clock, 
  Database, 
  FileSearch, 
  Play, 
  Loader2, 
  Users, 
  Activity, 
  UserPlus, 
  HardDrive,
  BrainCircuit,
  Compass,
} from 'lucide-react';
import { HealthCheckResponse } from '../../types';

export type ActiveView = 'fleet' | 'review' | 'register' | 'diagnostics' | 'benchmark';

interface NavbarProps {
  health: HealthCheckResponse | null;
  isOffline: boolean;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenDataQuality: () => void;
  activeScenario: string;
  scenarioLoading: boolean;
  onScenarioSwitch: (scenarioKey: string) => void;
  rejectedAuditCount?: number;
  onOpenJudgeTour?: () => void;
}

export function Navbar({
  health,
  isOffline,
  activeView,
  onSelectView,
  onOpenDataQuality,
  activeScenario,
  scenarioLoading,
  onScenarioSwitch,
  rejectedAuditCount = 0,
  onOpenJudgeTour,
}: NavbarProps) {
  return (
    <header className="border-b border-space-800 bg-space-900/95 backdrop-blur sticky top-0 z-40 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nasa-blue to-nasa-cyan flex items-center justify-center shadow-lg shadow-nasa-cyan/10">
          <HeartPulse className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg tracking-wider text-white">MISSION SENTINEL</h1>
            <span className="text-[10px] font-mono uppercase bg-nasa-blue/40 text-nasa-cyan px-2 py-0.5 rounded border border-nasa-cyan/30">
              NASA Space Apps 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">Astronaut Health Intelligence & Medical Review Support</p>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-space-950 p-1 rounded-xl border border-space-800 text-xs font-mono">
        <button
          onClick={() => onSelectView('fleet')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeView === 'fleet'
              ? 'bg-nasa-blue text-white font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-space-850'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Fleet Roster</span>
        </button>

        <button
          onClick={() => onSelectView('review')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeView === 'review'
              ? 'bg-nasa-blue text-white font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-space-850'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Medical Review</span>
        </button>

        <button
          onClick={() => onSelectView('register')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeView === 'register'
              ? 'bg-nasa-blue text-white font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-space-850'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-nasa-cyan" />
          <span>Register Crew</span>
        </button>

        <button
          onClick={() => onSelectView('diagnostics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeView === 'diagnostics'
              ? 'bg-nasa-blue text-white font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-space-850'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>Station Diagnostics</span>
        </button>

        <button
          onClick={() => onSelectView('benchmark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeView === 'benchmark'
              ? 'bg-purple-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-white hover:bg-space-850'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
          <span>ML Benchmark</span>
        </button>
      </nav>

      {/* Operational Status & Telemetry Indicators */}
      <div className="flex items-center gap-2.5 text-xs font-mono">
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-space-850 border border-space-700 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-nasa-cyan" />
          <span>FD 14 · Comms Latency: 22m 14s (Mars Sim)</span>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${
          isOffline
            ? 'bg-red-950/60 border-red-500/50 text-red-300'
            : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
        }`}>
          <Database className={`w-3.5 h-3.5 ${isOffline ? 'text-red-400' : 'text-emerald-400'}`} />
          <span>
            {isOffline 
              ? 'Station Offline (Retrying)' 
              : health?.database_file 
                ? `SQLite (${health.database_file}) WAL` 
                : 'SQLite Monolith Active'}
          </span>
        </div>

        <button
          onClick={onOpenDataQuality}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-space-850 hover:bg-space-800 border border-space-700 hover:border-nasa-cyan text-slate-300 transition"
          title="Inspect sensor data quality validation log and rejected packets"
        >
          <FileSearch className={`w-3.5 h-3.5 ${rejectedAuditCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Data Quality Audit</span>
          {rejectedAuditCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
              {rejectedAuditCount}
            </span>
          )}
        </button>
        {/* 1-Click Judge Tour Walkthrough */}
        {onOpenJudgeTour && (
          <button
            onClick={onOpenJudgeTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 text-purple-200 text-xs font-mono font-semibold transition shadow-sm hover:scale-105 active:scale-95"
            title="Open interactive 6-step hackathon judge demonstration walkthrough"
          >
            <Compass className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">Judge Tour</span>
          </button>
        )}
      </div>

      {/* 1-Click Demo Scenario Switcher for Hackathon Judges */}
      <div className="flex items-center gap-1 bg-space-850 p-1.5 rounded-xl border border-space-700">
        <span className="text-xs font-mono text-slate-400 px-2 flex items-center gap-1">
          {scenarioLoading ? <Loader2 className="w-3 h-3 text-nasa-amber animate-spin" /> : <Play className="w-3 h-3 text-nasa-amber" />} 
          <span className="hidden md:inline">Demo:</span>
        </span>
        <button
          disabled={scenarioLoading}
          onClick={() => onScenarioSwitch('SCENARIO_A_NOMINAL')}
          className={`px-2.5 py-1 text-xs rounded-lg font-mono font-medium transition ${
            activeScenario === 'SCENARIO_A_NOMINAL'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-space-800'
          }`}
          title="Nominal 10-day stable flight baseline"
        >
          A: Nominal
        </button>
        <button
          disabled={scenarioLoading}
          onClick={() => onScenarioSwitch('SCENARIO_B_ACUTE_SPIKE')}
          className={`px-2.5 py-1 text-xs rounded-lg font-mono font-medium transition ${
            activeScenario === 'SCENARIO_B_ACUTE_SPIKE'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-space-800'
          }`}
          title="Single EVA exertion spike (tests false alarm suppression)"
        >
          B: Exertion Spike
        </button>
        <button
          disabled={scenarioLoading}
          onClick={() => onScenarioSwitch('SCENARIO_C_SILENT_DETERIORATION')}
          className={`px-2.5 py-1 text-xs rounded-lg font-mono font-medium transition ${
            activeScenario === 'SCENARIO_C_SILENT_DETERIORATION'
              ? 'bg-red-600 text-white shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-space-800'
          }`}
          title="Multi-indicator silent deterioration hero scenario"
        >
          C: Hero Scenario
        </button>
      </div>
    </header>
  );
}
