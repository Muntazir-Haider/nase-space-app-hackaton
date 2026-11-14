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
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { HealthCheckResponse, AstronautSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';

export type ActiveView = 'fleet' | 'review' | 'register' | 'diagnostics' | 'benchmark' | 'spacecraft';

interface SidebarProps {
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

export function Sidebar({
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
}: SidebarProps) {
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

  const NAV_ITEMS = [
    { key: 'review' as ActiveView,     label: 'Crew Telemetry',   Icon: Activity, desc: 'Real-time Vitals & Alerts' },
    { key: 'fleet' as ActiveView,      label: 'Fleet Roster',     Icon: Users,    desc: 'Excel Grid & Clearances' },
    { key: 'spacecraft' as ActiveView, label: '3D Spacecraft HUD',Icon: Orbit,    desc: 'Cabin Systems & Sensor Mesh' },
    { key: 'benchmark' as ActiveView,  label: 'ML Benchmark',     Icon: Cpu,      desc: 'Early Biomarker Inference' },
    { key: 'diagnostics' as ActiveView,label: 'Station Systems',  Icon: Wind,     desc: 'Environmental Life Support' },
  ];

  return (
    <aside className="w-64 sm:w-72 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col justify-between shadow-xs z-30 select-none">
      
      {/* ── Top Header & Brand ── */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-md bg-[#0b3d91] flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden">
            <HeartPulse className="w-4 h-4 animate-heart-pulse z-10" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#fc3d21] rounded-full opacity-80" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-wider text-slate-900 uppercase">
                Mission Sentinel
              </span>
              <span className="text-[9px] font-mono uppercase bg-blue-50 text-[#0b3d91] px-1 py-0.2 rounded-sm border border-blue-200 font-bold">
                FD 14
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight">Orion MPC-V · Lunar Orbit</p>
          </div>
        </div>

        {/* Live Station Telemetry Bar */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 bg-white p-1.5 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-slate-800">{currentTime} UTC</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-700 font-bold">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>ONLINE</span>
          </div>
        </div>
      </div>

      {/* ── Scrollable Navigation Sections ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* SECTION 1: Core Navigation */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 block mb-1 font-mono">
            Navigation
          </span>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(({ key, label, Icon }) => {
              const active = activeView === key;
              return (
                <button
                  key={key}
                  onClick={() => onSelectView(key)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer border ${
                    active
                      ? 'bg-[#0b3d91] text-white border-[#0b3d91] shadow-xs'
                      : 'bg-transparent text-slate-700 border-transparent hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-500'}`} />
                    <span>{label}</span>
                  </div>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* SECTION 2: Active Crew Telemetry */}
        <div>
          <div className="flex items-center justify-between px-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Crew Roster ({astronauts.length})
            </span>
            <button
              onClick={() => onSelectView('register')}
              className="text-[10px] text-blue-700 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
              title="Enroll new astronaut"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ Add</span>
            </button>
          </div>
          <div className="space-y-1">
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
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        hasAlert
                          ? isSelected
                            ? 'bg-rose-500 animate-pulse'
                            : 'bg-rose-600 animate-ping'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div className="truncate text-left">
                      <span className="block truncate leading-tight font-mono text-[11px] font-semibold">
                        {astro.callsign}
                      </span>
                      <span className="block text-[9px] text-slate-500 truncate leading-tight">
                        {astro.full_name.split(' ')[0]} · {astro.mission_role}
                      </span>
                    </div>
                  </div>

                  {hasAlert ? (
                    <span className="px-1 py-0.2 rounded-sm bg-rose-100 text-rose-800 text-[9px] font-bold uppercase border border-rose-300 shrink-0 font-mono">
                      Alert
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-700 font-mono font-bold shrink-0">
                      NOMINAL
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: Demo Scenarios Switcher */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 block mb-1 font-mono">
            Clinical Scenarios
          </span>
          <div className="space-y-1">
            {[
              { key: 'SCENARIO_A_NOMINAL',              label: '1. Nominal Cruise',       color: 'bg-emerald-600 border-emerald-700' },
              { key: 'SCENARIO_B_ACUTE_SPIKE',          label: '2. Acute Spacewalk',      color: 'bg-amber-600 border-amber-700'   },
              { key: 'SCENARIO_C_SILENT_DETERIORATION',  label: '3. Hero Deterioration',   color: 'bg-rose-600 border-rose-700'    },
            ].map(({ key, label, color }) => {
              const active = activeScenario === key;
              return (
                <button
                  key={key}
                  disabled={scenarioLoading}
                  onClick={() => onScenarioSwitch(key)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition border cursor-pointer flex items-center justify-between ${
                    active
                      ? `${color} text-white font-bold shadow-xs`
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {scenarioLoading && active ? (
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : (
                      <Play className={`w-3 h-3 ${active ? 'text-white' : 'text-slate-400'}`} />
                    )}
                    <span className="font-semibold">{label}</span>
                  </div>
                  {active && <span className="text-[9px] uppercase tracking-wider opacity-90 font-mono">Active</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: System Tools & Compliance */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 block mb-1 font-mono">
            System & Compliance
          </span>
          <div className="space-y-1">
            {/* Interactive Tour */}
            {onOpenJudgeTour && (
              <button
                onClick={onOpenJudgeTour}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                  <span>Interactive Tour</span>
                </div>
                <Sparkles className="w-3 h-3 text-purple-500" />
              </button>
            )}

            {/* Data Quality Audit */}
            <button
              onClick={onOpenDataQuality}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileSearch className="w-3.5 h-3.5 text-slate-500" />
                <span>Sensor Validation Audit</span>
              </div>
              {rejectedAuditCount > 0 && (
                <span className="px-1 py-0.2 rounded-sm bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 font-mono">
                  {rejectedAuditCount}
                </span>
              )}
            </button>

            {/* Offline Database Status */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs bg-slate-50 border border-slate-200 text-slate-700">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Local Storage</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${isOffline ? 'text-rose-600' : 'text-emerald-700'}`}>
                {isOffline ? 'Offline' : (health?.database_file ? 'SQLite WAL' : 'Active')}
              </span>
            </div>

            {/* DSN Latency Simulation */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs bg-slate-50 border border-slate-200 text-slate-700">
              <div className="flex items-center gap-2">
                <RadioTower className="w-3.5 h-3.5 text-amber-600" />
                <span>DSN Uplink</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">22m Delay</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Bottom Operator Card & Sign Out ── */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        {operator && (
          <div className="flex items-center justify-between bg-white p-2 rounded-md border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                  {operator.callsign}
                </span>
                <span className="text-[10px] text-slate-500 block truncate leading-tight font-medium">
                  {operator.role_display}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-md bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-700 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

    </aside>
  );
}
