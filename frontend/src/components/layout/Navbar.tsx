import { useState, useEffect } from 'react';
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
  Wind, 
  Compass, 
  LogOut,
  UserCheck,
  RadioTower,
  Cpu,
  Orbit,
} from 'lucide-react';
import { HealthCheckResponse, AstronautSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';

export type ActiveView = 'fleet' | 'review' | 'register' | 'diagnostics' | 'benchmark' | 'spacecraft';

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
  astronauts?: AstronautSummary[];
  selectedAstronautId?: string | null;
  onSelectAstronaut?: (id: string) => void;
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
  astronauts = [],
  selectedAstronautId = null,
  onSelectAstronaut,
}: NavbarProps) {
  const { operator, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 25));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm flex flex-col">
      {/* Primary Top Bar */}
      <div className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        {/* Brand & NASA Meatball */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0b3d91] flex items-center justify-center text-white shrink-0 shadow-sm relative overflow-hidden">
            <HeartPulse className="w-5 h-5 animate-heart-pulse z-10" />
            {/* NASA Red Chevron Accent */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#fc3d21] rounded-full opacity-80" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider text-slate-900 uppercase">
                NASA MISSION SENTINEL
              </span>
              <span className="text-[10px] font-mono uppercase bg-blue-50 text-[#0b3d91] px-2 py-0.5 rounded border border-blue-200 font-bold">
                FLIGHT DAY 14
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-sans flex items-center gap-1.5">
              <span>Deep-Space Autonomous Medical Review System</span>
              <span className="text-slate-300">·</span>
              <span className="text-blue-700 font-semibold">Orion MPC-V / Lunar Orbit</span>
            </div>
          </div>
        </div>

        {/* 5 Primary Core Views */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => onSelectView('review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeView === 'review'
                ? 'bg-[#0b3d91] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Crew Telemetry</span>
          </button>

          <button
            onClick={() => onSelectView('fleet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeView === 'fleet'
                ? 'bg-[#0b3d91] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Fleet Roster</span>
          </button>

          <button
            onClick={() => onSelectView('spacecraft')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeView === 'spacecraft'
                ? 'bg-[#0b3d91] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Orbit className="w-3.5 h-3.5 text-blue-600" />
            <span>3D Spacecraft HUD</span>
          </button>

          <button
            onClick={() => onSelectView('benchmark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeView === 'benchmark'
                ? 'bg-[#0b3d91] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>ML Benchmark</span>
          </button>

          <button
            onClick={() => onSelectView('diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeView === 'diagnostics'
                ? 'bg-[#0b3d91] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Station Systems</span>
          </button>
        </nav>

        {/* Right Status / Telemetry Strip */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {/* Clock */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="font-bold text-slate-900">{currentTime} UTC</span>
          </div>

          {/* DSN Latency */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
            <RadioTower className="w-3 h-3 text-amber-600" />
            <span>DSN: 22m Delay</span>
          </div>

          {/* Database */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs ${
            isOffline
              ? 'bg-rose-50 border-rose-300 text-rose-700'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}>
            <Database className="w-3 h-3" />
            <span>{isOffline ? 'Offline Standalone' : (health?.database_file ? 'SQLite WAL' : 'Online')}</span>
          </div>

          {/* Judge Tour Button */}
          {onOpenJudgeTour && (
            <button
              onClick={onOpenJudgeTour}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition font-sans font-bold"
              title="Launch interactive tour for judges"
            >
              <Compass className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              <span className="hidden sm:inline">Tour</span>
            </button>
          )}

          {/* Data Audit Button */}
          <button
            onClick={onOpenDataQuality}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition font-sans"
            title="Inspect sensor validation audit"
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Audit</span>
            {rejectedAuditCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                {rejectedAuditCount}
              </span>
            )}
          </button>

          {/* Add Astronaut Button */}
          <button
            onClick={() => onSelectView('register')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition font-sans font-semibold"
            title="Enroll new astronaut profile"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">+ Crew</span>
          </button>

          {/* Operator Profile & Logout */}
          {operator && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-800 text-xs font-sans">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold">{operator.callsign}</span>
              </div>
              <button
                onClick={logout}
                className="p-1 rounded bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-700 transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Fast-Switch Bar: Scenarios & Quick Astronaut Switcher */}
      <div className="px-5 py-2 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Quick Astronaut Roster Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
            Quick Crew:
          </span>
          {astronauts.map((astro) => {
            const isSelected = astro.id === selectedAstronautId;
            const hasAlert = astro.active_alert_count > 0;
            return (
              <button
                key={astro.id}
                onClick={() => {
                  if (onSelectAstronaut) {
                    onSelectAstronaut(astro.id);
                  }
                  onSelectView('review');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition shrink-0 border ${
                  isSelected
                    ? 'bg-[#0b3d91] text-white border-[#0b3d91] font-bold shadow-sm'
                    : hasAlert
                    ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    hasAlert
                      ? isSelected
                        ? 'bg-rose-400 animate-pulse'
                        : 'bg-rose-600 animate-ping'
                      : isSelected
                      ? 'bg-emerald-400'
                      : 'bg-emerald-500'
                  }`}
                />
                <span>{astro.callsign}</span>
                {hasAlert && (
                  <span
                    className={`text-[9px] px-1 rounded font-bold uppercase ${
                      isSelected ? 'bg-rose-500 text-white' : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    Alert
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Demo Scenario Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
          <span className="text-[11px] font-sans text-slate-500 px-1.5 flex items-center gap-1 font-bold uppercase tracking-wider">
            {scenarioLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
            ) : (
              <Play className="w-3 h-3 text-blue-600" />
            )}
            <span>Scenarios:</span>
          </span>
          <button
            disabled={scenarioLoading}
            onClick={() => onScenarioSwitch('SCENARIO_A_NOMINAL')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition ${
              activeScenario === 'SCENARIO_A_NOMINAL'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Load Scenario A: All crew healthy over 10 days"
          >
            1. Nominal
          </button>
          <button
            disabled={scenarioLoading}
            onClick={() => onScenarioSwitch('SCENARIO_B_ACUTE_SPIKE')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition ${
              activeScenario === 'SCENARIO_B_ACUTE_SPIKE'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Load Scenario B: Single acute spacewalk spike filtered by engine"
          >
            2. Acute Spacewalk
          </button>
          <button
            disabled={scenarioLoading}
            onClick={() => onScenarioSwitch('SCENARIO_C_SILENT_DETERIORATION')}
            className={`px-2.5 py-1 text-xs rounded font-bold transition ${
              activeScenario === 'SCENARIO_C_SILENT_DETERIORATION'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Load Scenario C: Dr. Elena Vance develops subtle tri-indicator deterioration"
          >
            3. Hero Deterioration
          </button>
        </div>
      </div>
    </header>
  );
}
