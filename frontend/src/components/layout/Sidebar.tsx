import { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Clock, 
  Users, 
  Activity, 
  Wind, 
  Compass, 
  LogOut,
  UserCheck,
  Cpu,
  Orbit,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  X
} from 'lucide-react';
import { HealthCheckResponse, AstronautSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AstronautAvatar } from '../crew/AstronautAvatar';

export type ActiveView = 'dashboard' | 'review' | 'fleet' | 'spacecraft' | 'benchmark' | 'diagnostics' | 'register';

interface SidebarProps {
  health?: HealthCheckResponse | null;
  isOffline?: boolean;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenDataQuality?: () => void;
  activeScenario: string;
  scenarioLoading: boolean;
  onScenarioSwitch: (scenarioKey: string) => void;
  rejectedAuditCount?: number;
  onOpenJudgeTour?: () => void;
  astronauts?: AstronautSummary[];
  selectedAstronautId?: string | null;
  onSelectAstronaut?: (id: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  health: _health,
  isOffline: _isOffline,
  activeView,
  onSelectView,
  onOpenDataQuality: _onOpenDataQuality,
  activeScenario,
  scenarioLoading,
  onScenarioSwitch,
  rejectedAuditCount: _rejectedAuditCount = 0,
  onOpenJudgeTour,
  astronauts = [],
  selectedAstronautId = null,
  onSelectAstronaut,
  isOpenMobile = false,
  onCloseMobile,
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
    { key: 'dashboard' as ActiveView,  label: 'Mission Dashboard',Icon: LayoutDashboard, desc: 'Whole Station Operations' },
    { key: 'review' as ActiveView,     label: 'Crew Telemetry',   Icon: Activity, desc: 'Real-time Vitals & Alerts' },
    { key: 'fleet' as ActiveView,      label: 'Fleet Roster',     Icon: Users,    desc: 'Excel Grid & Clearances' },
    { key: 'spacecraft' as ActiveView, label: '3D Spacecraft HUD',Icon: Orbit,    desc: 'Cabin Systems & Sensor Mesh' },
    { key: 'benchmark' as ActiveView,  label: 'ML Benchmark',     Icon: Cpu,      desc: 'Early Biomarker Inference' },
    { key: 'diagnostics' as ActiveView,label: 'Station Systems',  Icon: Wind,     desc: 'Environmental Life Support' },
  ];

  const handleNavClick = (view: ActiveView) => {
    onSelectView(view);
    onCloseMobile?.();
  };

  const handleAstronautClick = (id: string) => {
    if (onSelectAstronaut) {
      onSelectAstronaut(id);
    }
    onCloseMobile?.();
  };

  const renderNavBody = () => (
    <div className="flex-1 overflow-y-auto p-3.5 space-y-5">
      {/* SECTION 1: Core Navigation */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 px-2 block mb-1.5 font-mono">
          Navigation
        </span>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ key, label, Icon }) => {
            const active = activeView === key;
            return (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-[0.98] ${
                  active
                    ? 'bg-[#0b3d91] text-white shadow-[0_4px_12px_rgba(11,61,145,0.25)]'
                    : 'bg-transparent text-slate-800 hover:text-slate-950 hover:bg-[#f4f5f8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-600'}`} />
                  <span>{label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* SECTION 2: Active Crew Roster Quick Access */}
      <div>
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 font-mono">
            Active Crew ({astronauts.length})
          </span>
          <button
            onClick={() => handleNavClick('fleet')}
            className="text-[10px] text-blue-700 hover:underline font-bold"
          >
            All
          </button>
        </div>
        <div className="space-y-1">
          {astronauts.map((astro) => {
            const isSelected = selectedAstronautId === astro.id;
            return (
              <button
                key={astro.id}
                onClick={() => handleAstronautClick(astro.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-300 text-blue-950 font-bold'
                    : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AstronautAvatar
                    callsign={astro.callsign}
                    name={astro.full_name}
                    size="sm"
                    hasAlert={astro.active_alert_count > 0}
                  />
                  <div className="truncate text-left">
                    <div className="font-bold text-xs truncate leading-tight">{astro.full_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{astro.callsign}</div>
                  </div>
                </div>
                {astro.active_alert_count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Interactive Judge Tour Button */}
      {onOpenJudgeTour && (
        <div>
          <button
            onClick={() => {
              onOpenJudgeTour();
              onCloseMobile?.();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200/80 text-purple-950 text-xs font-bold transition shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-600 animate-pulse" />
              <span>Judge Interactive Tour</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          </button>
        </div>
      )}

      {/* SECTION 4: Flight Scenarios */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 px-2 block mb-1.5 font-mono">
          Clinical Scenarios
        </span>
        <div className="space-y-1">
          {[
            { key: 'SCENARIO_A_NOMINAL', label: 'Nominal Baseline', desc: 'FD 1-14 healthy corridor' },
            { key: 'SCENARIO_B_ACUTE_HYPOXIA', label: 'ECLSS Scrubber Drift', desc: 'CO2 spike & tachycardia' },
            { key: 'SCENARIO_C_SILENT_DETERIORATION', label: 'Silent Deterioration', desc: 'Multi-indicator divergence' },
          ].map((sc) => (
            <button
              key={sc.key}
              onClick={() => {
                onScenarioSwitch(sc.key);
                onCloseMobile?.();
              }}
              disabled={scenarioLoading}
              className={`w-full text-left p-2.5 rounded-xl border text-xs transition cursor-pointer active:scale-[0.98] ${
                activeScenario === sc.key
                  ? 'bg-amber-50/80 border-amber-400 text-amber-950 font-bold shadow-2xs'
                  : 'bg-white hover:bg-slate-50 border-black/[0.06] text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] truncate">{sc.label}</span>
                {activeScenario === sc.key && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{sc.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
      {operator && (
        <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
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
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-700 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop Static Sidebar (Always visible on lg screens) ── */}
      <aside className="hidden lg:flex w-68 shrink-0 h-screen sticky top-0 bg-white border-r border-black/[0.08] flex-col justify-between shadow-[0_0_24px_rgba(0,0,0,0.03)] z-30 select-none">
        {/* Top Header & Brand */}
        <div className="p-4 border-b border-black/[0.06] bg-[#fbfbfd] shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#0b3d91] flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden">
              <HeartPulse className="w-5 h-5 animate-heart-pulse z-10 text-white" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#fc3d21] rounded-full opacity-90" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-wider text-slate-950 uppercase font-mono">
                  Mission Sentinel
                </span>
                <span className="text-[9px] font-mono uppercase bg-blue-50 text-[#0b3d91] px-1.5 py-0.5 rounded-full border border-blue-200 font-extrabold">
                  FD 14
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-semibold tracking-tight">Orion MPC-V · Lunar Orbit</p>
            </div>
          </div>

          {/* Live Station Telemetry Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 bg-[#f4f5f8] p-2 rounded-xl border border-black/[0.05] shadow-2xs">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-950">{currentTime} UTC</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-800 font-extrabold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ONLINE</span>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        {renderNavBody()}

        {/* Bottom Operator Card */}
        {renderFooter()}
      </aside>

      {/* ── Mobile Sliding Drawer (Visible on < lg when isOpenMobile is true) ── */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Dark Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          {/* Drawer Body */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-white flex flex-col justify-between shadow-2xl z-10 select-none">
            {/* Mobile Header with Close X */}
            <div className="p-4 border-b border-black/[0.06] bg-[#fbfbfd] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0b3d91] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <HeartPulse className="w-4 h-4 animate-heart-pulse text-white" />
                </div>
                <div>
                  <span className="font-extrabold text-xs tracking-wider text-slate-950 uppercase font-mono block">
                    Mission Sentinel
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">FD 14 · Orion MPC-V</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Nav */}
            {renderNavBody()}

            {/* Footer */}
            {renderFooter()}
          </aside>
        </div>
      )}
    </>
  );
}
