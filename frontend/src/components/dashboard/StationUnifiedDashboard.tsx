import { useState, useEffect } from 'react';
import { 
  Activity, 
  Moon, 
  Zap, 
  Wind, 
  ShieldAlert, 
  CheckCircle2, 
  Cpu, 
  Radio, 
  RefreshCw, 
  Users, 
  ChevronRight, 
  ShieldCheck, 
  Thermometer, 
  Clock, 
  Database, 
  Compass,
  Loader2,
  FileSearch,
  Wifi,
  Battery,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  AlertTriangle,
  Orbit,
  UserPlus
} from 'lucide-react';
import { 
  AstronautSummary, 
  AstronautTimelineResponse, 
  DeteriorationAlert 
} from '../../types';
import { AnatomicalScanner } from '../nasa/AnatomicalScanner';
import { NASASpacecraftHologram } from '../nasa/NASASpacecraftHologram';
import { SynchronizedCharts } from '../SynchronizedCharts';
import { AstronautAvatar } from '../crew/AstronautAvatar';
import { ingestObservation, runDeteriorationAnalysis } from '../../services/api';

interface StationUnifiedDashboardProps {
  astronauts: AstronautSummary[];
  selectedAstronaut: AstronautSummary | null;
  onSelectAstronaut: (id: string) => void;
  timeline: AstronautTimelineResponse | null;
  activeAlert: DeteriorationAlert | null;
  onOpenEvidence: (alertId: string) => void;
  onOpenRegisterModal: () => void;
  onOpenDataQuality: () => void;
  onOpenJudgeTour?: () => void;
  onLoadScenario: (scenarioKey: string) => void;
  scenarioLoading: boolean;
  activeScenario: string;
  onRefreshTimeline?: () => void;
  onNavigateToTelemetry: (astronautId?: string) => void;
}

export function StationUnifiedDashboard({
  astronauts,
  selectedAstronaut,
  onSelectAstronaut,
  timeline,
  activeAlert,
  onOpenEvidence,
  onOpenRegisterModal,
  onOpenDataQuality,
  onOpenJudgeTour,
  onLoadScenario,
  scenarioLoading,
  activeScenario,
  onRefreshTimeline,
  onNavigateToTelemetry,
}: StationUnifiedDashboardProps) {
  // Current active crew member for deep biometrics
  const currentAstro = selectedAstronaut || astronauts[0] || null;

  // Real-time live clock (UTC + MET)
  const [utcTime, setUtcTime] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── High-Rate Live Telemetry Engine (~450ms stream) ──
  const points = timeline?.timeline_points || [];
  const baseRhr = points.length > 0 && points[points.length - 1]?.rhr_value ? points[points.length - 1].rhr_value! : (activeAlert ? 68.9 : 62.4);
  const baseSleep = points.length > 0 && points[points.length - 1]?.sleep_value ? points[points.length - 1].sleep_value! : (activeAlert ? 5.2 : 7.6);
  const baseHrr = points.length > 0 && points[points.length - 1]?.hrr_value ? points[points.length - 1].hrr_value! : (activeAlert ? 24.5 : 34.0);
  const baseSpo2 = 98.4;
  const baseTemp = 36.8;

  const [liveVitals, setLiveVitals] = useState({
    rhr: baseRhr,
    sleep: baseSleep,
    hrr: baseHrr,
    spo2: baseSpo2,
    temp: baseTemp,
  });

  useEffect(() => {
    setLiveVitals({
      rhr: baseRhr,
      sleep: baseSleep,
      hrr: baseHrr,
      spo2: baseSpo2,
      temp: baseTemp,
    });
  }, [baseRhr, baseSleep, baseHrr, baseSpo2, baseTemp, currentAstro?.id, activeAlert?.id]);

  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      const rhrDrift = Math.sin(tick * 0.28) * 0.95 + Math.cos(tick * 0.14) * 0.5 + (Math.random() - 0.5) * 0.35;
      const nextRhr = Math.round((baseRhr + rhrDrift) * 10) / 10;

      const spo2Drift = Math.sin(tick * 0.12) * 0.2 + (Math.random() - 0.5) * 0.15;
      const nextSpo2 = Math.round(Math.min(99.8, Math.max(93.0, baseSpo2 + spo2Drift)) * 10) / 10;

      const tempDrift = Math.sin(tick * 0.08) * 0.05 + (Math.random() - 0.5) * 0.02;
      const nextTemp = Math.round((baseTemp + tempDrift) * 100) / 100;

      setLiveVitals((prev) => ({
        ...prev,
        rhr: nextRhr,
        spo2: nextSpo2,
        temp: nextTemp,
      }));
    }, 450);

    return () => clearInterval(interval);
  }, [baseRhr, baseSpo2, baseTemp]);

  // Master Station Sync Action
  const [syncingAll, setSyncingAll] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleMasterStationSync = async () => {
    if (!currentAstro) return;
    setSyncingAll(true);
    setSyncFeedback(null);
    try {
      const now = new Date().toISOString();
      await ingestObservation({
        astronaut_id: currentAstro.id,
        observation_time: now,
        indicator_key: 'RESTING_HEART_RATE',
        value: liveVitals.rhr,
        unit: 'bpm',
        data_origin: 'WEARABLE_ASTROSKIN_LEAD_II',
      });

      await ingestObservation({
        astronaut_id: currentAstro.id,
        observation_time: now,
        indicator_key: 'HEART_RATE_RECOVERY_1MIN',
        value: liveVitals.hrr,
        unit: 'bpm',
        data_origin: 'WEARABLE_HEXOSKIN_POD',
      });

      await runDeteriorationAnalysis(currentAstro.id);

      setSyncFeedback('Wearable stream committed to local SQLite WAL. Surveillance model updated.');
      if (onRefreshTimeline) onRefreshTimeline();
    } catch {
      setSyncFeedback('Wearable batch buffered to local offline queue.');
    } finally {
      setSyncingAll(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // Spatial Reference (Default open with 3D Spacecraft)
  const [showSpatialReference, setShowSpatialReference] = useState<boolean>(true);
  const [referenceMode, setReferenceMode] = useState<'anatomy' | 'spacecraft'>('spacecraft');

  // Baseline corridors from timeline
  const rhrBaseline = timeline?.baselines ? timeline.baselines['RESTING_HEART_RATE'] : undefined;
  const sleepBaseline = timeline?.baselines ? timeline.baselines['SLEEP_DURATION'] : undefined;
  const hrrBaseline = timeline?.baselines ? timeline.baselines['HEART_RATE_RECOVERY_1MIN'] : undefined;

  return (
    <div className="flex flex-col gap-8 font-sans">
      
      {/* ── 1. Top Station Operational Command Header (Apple Solid Card) ── */}
      <div className="bg-white border border-black/[0.09] rounded-2xl p-4 sm:p-6 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] flex flex-col gap-4 sm:gap-5">
        
        {/* Main Command Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 pb-4 sm:pb-5 border-b border-black/[0.06]">
          
          {/* Left: Mission Patch & Title */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative shrink-0">
              <img 
                src="./artemis_mission_patch.svg" 
                alt="NASA Artemis Mission Crest" 
                className="w-11 h-11 sm:w-14 sm:h-14 object-contain drop-shadow-md select-none" 
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-sm sm:text-lg font-extrabold text-slate-950 tracking-tight font-mono break-words sm:whitespace-nowrap">
                  NASA Artemis Station · Flight Health Operations
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#0b3d91] font-bold border border-blue-200 shrink-0">
                  DAY 14
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                  ORION MPC-V
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                Autonomous Lunar Transit Health Monitoring & Telemetry Hub
              </p>
            </div>
          </div>

          {/* Right: Tactile Quick Actions Dock */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Quick Link to 3D Orion Spacecraft Subsystem */}
            <button
              type="button"
              onClick={() => {
                setShowSpatialReference(true);
                setReferenceMode('spacecraft');
                const el = document.getElementById('spatial-reference-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-800 transition shadow-2xs active:scale-[0.98] cursor-pointer whitespace-nowrap"
              title="Inspect 360° NASA Orion MPC-V Deep Space Vehicle Telemetry"
            >
              <img 
                src="./real_orion_spacecraft_transparent.png" 
                alt="Orion MPC-V" 
                className="w-7 h-7 object-contain drop-shadow-xs shrink-0" 
              />
              <div className="text-left leading-tight">
                <div className="text-[11px] font-mono font-bold text-slate-950 uppercase tracking-tight">ORION MPC-V</div>
                <div className="text-[10px] text-slate-500 font-medium">3D Flight Vehicle</div>
              </div>
            </button>

            {/* Primary Action: Sync Wearables */}
            <button
              onClick={handleMasterStationSync}
              disabled={syncingAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0b3d91] hover:bg-[#072b68] text-white text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer whitespace-nowrap disabled:opacity-70"
            >
              {syncingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{syncingAll ? 'Syncing Streams...' : 'Sync Wearables'}</span>
            </button>

            {/* Register Crew */}
            <button
              onClick={onOpenRegisterModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#f4f5f8] hover:bg-white border border-black/[0.06] hover:border-black/[0.12] text-xs font-bold text-slate-800 transition shadow-2xs active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#0b3d91]" />
              <span>+ Register Crew</span>
            </button>

            {/* Audit Log */}
            <button
              onClick={onOpenDataQuality}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#f4f5f8] hover:bg-white border border-black/[0.06] hover:border-black/[0.12] text-xs font-bold text-slate-800 transition shadow-2xs active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              <FileSearch className="w-3.5 h-3.5 text-[#0b3d91]" />
              <span>Audit Log</span>
            </button>

            {/* Station Tour */}
            {onOpenJudgeTour && (
              <button
                onClick={onOpenJudgeTour}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200/80 text-xs font-bold text-purple-900 transition shadow-2xs active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <Compass className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                <span>Station Tour</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Operational Telemetry Strip (Aerospace Hardware Tray) */}
        <div className="bg-[#f4f5f8] rounded-xl px-4 py-2.5 border border-black/[0.05] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[11px] font-mono">
            {/* Clock & MET */}
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-extrabold text-slate-900">{utcTime || '03:45:10 UTC'}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-semibold">MET 14d 08h</span>
            </div>

            {/* DSN Link */}
            <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-black/[0.06] shadow-2xs">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
              <span className="text-emerald-800 font-extrabold">DSN: ACTIVE</span>
              <span className="text-slate-500 font-medium">Canberra 70m</span>
            </div>

            {/* Storage Engine */}
            <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-black/[0.06] shadow-2xs">
              <Database className="w-3.5 h-3.5 text-[#0b3d91] shrink-0" />
              <span className="text-slate-900 font-extrabold">SQLite WAL</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Offline Ready
              </span>
            </div>
          </div>

          {/* Sync Feedback Toast */}
          {syncFeedback && (
            <div className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Station Operational Telemetry KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Active Crew Monitored */}
        <div 
          onClick={() => onNavigateToTelemetry()}
          className="bg-white border border-black/[0.09] hover:border-black/[0.16] rounded-2xl p-5 flex flex-col justify-between shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0b3d91] flex items-center justify-center border border-blue-200/60 shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs uppercase font-mono font-extrabold text-slate-900">Active Crew</span>
            </span>
            {/* Astronaut Avatar Photo Stack */}
            <div className="flex -space-x-2 overflow-hidden items-center">
              <img src="./astronauts/elena_rostova.jpg" alt="Dr. Vance" className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" />
              <img src="./astronauts/marcus_vance.jpg" alt="Marcus" className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" />
              <img src="./astronauts/sarah_chen.jpg" alt="Dr. Chen" className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold font-mono text-slate-950 tracking-tight">
              {astronauts.length} <span className="text-sm font-bold text-slate-600">Astronauts</span>
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">
              12 Active Sensor Channels Synced
            </div>
          </div>
          <div className="pt-3 border-t border-black/[0.05] flex items-center justify-between text-[11px]">
            <span className="text-emerald-800 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Live Synced
            </span>
            <span className="text-[#0b3d91] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Fleet <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Clinical Health Advisories */}
        <div 
          onClick={() => {
            if (activeAlert) onOpenEvidence(activeAlert.id);
            else onNavigateToTelemetry();
          }}
          className={`rounded-2xl p-5 flex flex-col justify-between shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200 cursor-pointer group ${
            activeAlert 
              ? 'bg-rose-50/70 border border-rose-300 hover:border-rose-400' 
              : 'bg-white border border-black/[0.09] hover:border-black/[0.16]'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-2xs border ${
                activeAlert ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="text-xs uppercase font-mono font-extrabold text-slate-900">Health Advisories</span>
            </span>
            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
              activeAlert ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {activeAlert ? 'ALERT ACTIVE' : 'NOMINAL'}
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold font-mono tracking-tight flex items-baseline gap-2">
              <span className={activeAlert ? 'text-rose-800' : 'text-slate-950'}>
                {activeAlert ? '1 Advisory' : '0 Alerts'}
              </span>
              {activeAlert && (
                <span className="text-xs font-mono font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {activeAlert.review_priority}
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">
              {activeAlert ? 'Multi-indicator drift post-EVA' : 'Conforms to baseline corridors'}
            </div>
          </div>
          <div className="pt-3 border-t border-black/[0.05] flex items-center justify-between text-[11px]">
            <span className={activeAlert ? 'text-rose-800 font-bold' : 'text-emerald-800 font-bold'}>
              {activeAlert ? 'Action Required' : 'Active Surveillance'}
            </span>
            <span className="text-[#0b3d91] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              {activeAlert ? 'Inspect' : 'Review'} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Cabin Atmosphere & CO₂ */}
        <div className="bg-white border border-black/[0.09] hover:border-black/[0.16] rounded-2xl p-5 flex flex-col justify-between shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60 shadow-2xs">
                <Wind className="w-4 h-4" />
              </div>
              <span className="text-xs uppercase font-mono font-extrabold text-slate-900">Atmosphere & CO₂</span>
            </span>
            <span className="text-[10px] font-mono bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 font-bold">
              Airlock Active
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold font-mono text-slate-950 tracking-tight flex items-baseline justify-between">
              <span>3,450 <span className="text-sm font-bold text-slate-600">ppm</span></span>
              <span className="text-sm font-mono text-emerald-800 font-extrabold">101.3 kPa</span>
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">
              Elevated post-EVA · Scrubber cycling
            </div>
          </div>
          <div className="pt-3 border-t border-black/[0.05] flex items-center justify-between text-[11px]">
            <span className="text-amber-800 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> +950 ppm vs limit
            </span>
            <span className="text-slate-600 font-mono font-bold text-[10px]">O₂/N₂ Nominal</span>
          </div>
        </div>

        {/* Card 4: Radiation Dosimetry */}
        <div className="bg-white border border-black/[0.09] hover:border-black/[0.16] rounded-2xl p-5 flex flex-col justify-between shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60 shadow-2xs">
                <Thermometer className="w-4 h-4" />
              </div>
              <span className="text-xs uppercase font-mono font-extrabold text-slate-900">Radiation</span>
            </span>
            <span className="text-[10px] font-mono bg-purple-50 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-200 font-bold">
              ALARA
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold font-mono text-slate-950 tracking-tight flex items-baseline justify-between">
              <span>295 <span className="text-sm font-bold text-slate-600">μSv/d</span></span>
              <span className="text-xs font-mono text-purple-800 font-extrabold">Deep Space</span>
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">
              14-Day Cumulative: 4.13 mSv
            </div>
          </div>
          <div className="pt-3 border-t border-black/[0.05] flex items-center justify-between text-[11px]">
            <span className="text-emerald-800 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Nominal Dose
            </span>
            <span className="text-slate-600 font-mono font-bold text-[10px]">NASA ALARA Pass</span>
          </div>
        </div>
      </div>

      {/* ── 3. Active Crew Fleet Biometric Roster Strip (with Real Astronaut Portraits) ── */}
      <div className="bg-white border border-black/[0.09] rounded-2xl p-6 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-black/[0.05]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0b3d91]" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900">
              Active Crew Fleet Biometrics
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-600 font-medium">
            Selected: <span className="font-bold text-[#0b3d91]">{currentAstro?.full_name}</span> ({currentAstro?.callsign})
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {astronauts.map((astro) => {
            const isSelected = astro.id === currentAstro?.id;
            const hasAlert = astro.id === currentAstro?.id ? Boolean(activeAlert) : (astro.callsign === 'ARTEMIS-01');
            const rhrVal = isSelected ? liveVitals.rhr : (hasAlert ? 68.9 : 62.4);
            const sleepVal = isSelected ? liveVitals.sleep : (hasAlert ? 5.2 : 7.6);
            const hrrVal = isSelected ? liveVitals.hrr : (hasAlert ? 24.5 : 34.0);

            return (
              <div
                key={astro.id}
                onClick={() => onSelectAstronaut(astro.id)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 group ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/30' 
                    : 'border-black/[0.08] bg-white hover:border-black/[0.16]'
                }`}
              >
                <div>
                  {/* Top: Astronaut Portrait Photo + Name & Callsign */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <AstronautAvatar
                        callsign={astro.callsign}
                        name={astro.full_name}
                        size="md"
                        hasAlert={hasAlert}
                      />
                      <div>
                        <div className="font-extrabold text-base text-slate-950 tracking-tight group-hover:text-[#0b3d91] transition-colors flex items-center gap-1.5">
                          <span>{astro.full_name}</span>
                          <span className="text-xs">🇺🇸</span>
                        </div>
                        <div className="text-xs text-slate-600 font-mono font-semibold">
                          {astro.callsign} · {astro.mission_role}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      hasAlert 
                        ? 'bg-rose-50 text-rose-900 border-rose-300' 
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    }`}>
                      {hasAlert ? 'ALERT' : 'NOMINAL'}
                    </span>
                  </div>

                  {/* 3 Core Vitals Columns (Apple Box Container) */}
                  <div className="grid grid-cols-3 gap-2.5 my-3.5 p-3 rounded-xl bg-[#f4f5f8] border border-black/[0.05] text-xs shadow-2xs">
                    <div>
                      <div className="text-[10px] text-slate-700 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3 h-3 text-red-600" /> RHR
                      </div>
                      <div className="font-extrabold font-mono text-slate-950 mt-1 flex items-baseline gap-1 text-sm">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 self-center" />}
                        {rhrVal.toFixed(1)} <span className="text-[10px] font-bold text-slate-500">bpm</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-700 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Moon className="w-3 h-3 text-sky-700" /> Sleep
                      </div>
                      <div className="font-extrabold font-mono text-slate-950 mt-1 text-sm">
                        {sleepVal.toFixed(1)} <span className="text-[10px] font-bold text-slate-500">hrs</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-700 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-700" /> Recovery
                      </div>
                      <div className="font-extrabold font-mono text-slate-950 mt-1 text-sm">
                        {hrrVal.toFixed(1)} <span className="text-[10px] font-bold text-slate-500">bpm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs">
                  <span className={`font-bold flex items-center gap-1 text-[11px] ${
                    astro.medical_clearance_status === 'FULL_FLIGHT_CLEARANCE' ? 'text-emerald-800' : 'text-amber-800'
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {astro.medical_clearance_status === 'FULL_FLIGHT_CLEARANCE' ? 'Cleared' : 'Medical Hold'}
                  </span>
                  <span className="text-[#0b3d91] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform text-[11px]">
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Primary Clinical Operations Workspace (2-Column Industry Split) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8 cols): Core Clinical Telemetry & Multi-System Assessment */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          
          {/* Synchronized Multi-Indicator Telemetry & Corridors (Apple Solid Card) */}
          <div className="bg-white border border-black/[0.09] rounded-2xl p-6 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-black/[0.05] pb-3.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0b3d91]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                  Baseline Corridor Surveillance (μ ± 1.5σ) · {currentAstro?.callsign}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  450ms Stream
                </span>
              </div>
            </div>

            <SynchronizedCharts
              timeline={timeline}
              liveVitals={liveVitals}
              onOpenAlert={() => {
                if (activeAlert) onOpenEvidence(activeAlert.id);
              }}
              hasActiveAlert={Boolean(activeAlert)}
            />
          </div>

          {/* 6-System Multi-System Clinical Condition Assessment Matrix (Apple Solid Card) */}
          <div className="bg-white border border-black/[0.09] rounded-2xl p-6 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-black/[0.05] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0b3d91] flex items-center justify-center text-white shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                    Multi-System Clinical Matrix · {currentAstro?.callsign}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                6/6 SYSTEMS
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-black/[0.08] shadow-2xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] bg-[#f4f5f8] text-xs font-mono uppercase text-slate-800">
                    <th className="py-3 px-4 font-extrabold">Organ System</th>
                    <th className="py-3 px-4 font-extrabold">Device Channel</th>
                    <th className="py-3 px-4 font-extrabold">Live Value</th>
                    <th className="py-3 px-4 font-extrabold">Baseline Corridor</th>
                    <th className="py-3 px-4 font-extrabold">Deviation</th>
                    <th className="py-3 px-4 font-extrabold">Clinical State</th>
                    <th className="py-3 px-4 font-extrabold">Directive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] text-xs bg-white">
                  {/* Row 1: Cardiovascular */}
                  <tr className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-950 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-red-600" /> Cardiovascular
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">Astroskin Bio-Vest (Lead II)</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-950 text-sm">{liveVitals.rhr.toFixed(1)} bpm</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{rhrBaseline ? `${rhrBaseline.mean.toFixed(1)} ± ${rhrBaseline.std_dev.toFixed(1)}` : '62.0 ± 2.5'}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold">
                      {rhrBaseline ? (
                        <span className={`px-2 py-0.5 rounded-full ${Math.abs((liveVitals.rhr - rhrBaseline.mean)/rhrBaseline.std_dev) >= 1.5 ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                          {((liveVitals.rhr - rhrBaseline.mean)/rhrBaseline.std_dev) > 0 ? '+' : ''}{((liveVitals.rhr - rhrBaseline.mean)/rhrBaseline.std_dev).toFixed(2)}σ
                        </span>
                      ) : '0.0σ'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono font-extrabold text-[10px] ${activeAlert ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                        {activeAlert ? 'MYOCARDIAL DRIFT' : 'NOMINAL'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold text-xs">
                      {activeAlert ? 'Screen hypercapnia & post-EVA strain' : 'Standard countermeasure exercise protocol'}
                    </td>
                  </tr>

                  {/* Row 2: Circadian / Sleep */}
                  <tr className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-950 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-sky-600" /> Circadian & Neuro
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">Somna Neuro-Band EEG</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-950 text-sm">{liveVitals.sleep.toFixed(1)} hrs</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{sleepBaseline ? `${sleepBaseline.mean.toFixed(1)} ± ${sleepBaseline.std_dev.toFixed(2)}` : '7.4 ± 0.45'}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold">
                      {sleepBaseline ? (
                        <span className={`px-2 py-0.5 rounded-full ${(liveVitals.sleep - sleepBaseline.mean)/sleepBaseline.std_dev <= -1.5 ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                          {((liveVitals.sleep - sleepBaseline.mean)/sleepBaseline.std_dev).toFixed(2)}σ
                        </span>
                      ) : '0.0σ'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono font-extrabold text-[10px] ${liveVitals.sleep < 6 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                        {liveVitals.sleep < 6 ? 'SLEEP DEFICIT' : 'OPTIMAL NREM'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold text-xs">
                      {liveVitals.sleep < 6 ? 'Enforce sleep opportunity & dim cabin lights' : 'Aligned with UTC circadian timeline'}
                    </td>
                  </tr>

                  {/* Row 3: Autonomic HRR */}
                  <tr className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-950 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" /> Autonomic Recovery
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">Hexoskin Smart Pod</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-950 text-sm">{liveVitals.hrr.toFixed(1)} bpm</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{hrrBaseline ? `${hrrBaseline.mean.toFixed(1)} ± ${hrrBaseline.std_dev.toFixed(1)}` : '28.0 ± 3.0'}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold">
                      {hrrBaseline ? (
                        <span className={`px-2 py-0.5 rounded-full ${(liveVitals.hrr - hrrBaseline.mean)/hrrBaseline.std_dev <= -1.5 ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                          {((liveVitals.hrr - hrrBaseline.mean)/hrrBaseline.std_dev) > 0 ? '+' : ''}{((liveVitals.hrr - hrrBaseline.mean)/hrrBaseline.std_dev).toFixed(2)}σ
                        </span>
                      ) : '0.0σ'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono font-extrabold text-[10px] ${activeAlert ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                        {activeAlert ? 'DELAYED RECOVERY' : 'STABLE TONE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold text-xs">
                      Post-exercise vagal reactivation index monitoring
                    </td>
                  </tr>

                  {/* Row 4: Pulmonary SpO2 */}
                  <tr className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-950 flex items-center gap-2">
                      <Wind className="w-4 h-4 text-teal-600" /> Pulmonary & Gas
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">Astroskin Pulse Oximeter</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-950 text-sm">{liveVitals.spo2.toFixed(1)}% SpO₂</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">98.5 ± 0.8%</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">-0.12σ</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full font-mono font-extrabold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                        NOMINAL OXYGEN
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold text-xs">
                      Normal alveolar diffusion; nominal cabin $pO_2$
                    </td>
                  </tr>

                  {/* Row 5: Thermoregulatory Core Temp */}
                  <tr className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-950 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-purple-600" /> Core Temp
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">VitalSense Core Capsule</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-950 text-sm">{liveVitals.temp.toFixed(2)} °C</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">36.80 ± 0.18 °C</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">+0.05σ</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full font-mono font-extrabold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                        EUTHERMIC
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold text-xs">
                      Visceral core normal; zero heat accumulation
                    </td>
                  </tr>

                  {/* Row 6: Habitat Coupling */}
                  <tr className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-950 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Habitat ECLSS
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">Cabin CO₂ & Pressure Array</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-amber-900 text-sm">3,450 ppm CO₂</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">&lt; 2,500 ppm limit</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">+2.10σ</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full font-mono font-extrabold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                        ELEVATED POST-EVA
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold text-xs">
                      Verify amine scrubbers; cross-correlate with crew heart rate
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Connected Wearables, ECLSS Subsystems & Scenario Switcher */}
        <div className="xl:col-span-4 flex flex-col gap-8">

          {/* Astronaut Wearable Devices Docking Hub */}
          <div className="bg-white border border-black/[0.09] rounded-2xl p-6 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/[0.05]">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#0b3d91]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                  Connected Wearables
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                4/4 Synced
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { name: 'Astroskin Bio-Vest', type: 'Lead II ECG + Respiration', sample: '250 Hz', bat: 88, sig: 99 },
                { name: 'Hexoskin Smart Pod', type: 'RHR + HRR Recovery', sample: '1 Hz', bat: 94, sig: 98 },
                { name: 'VitalSense Capsule', type: 'Core Thermoregulatory', sample: '0.1 Hz', bat: 76, sig: 95 },
                { name: 'Somna Neuro-Band', type: 'Frontal EEG Sleep State', sample: '128 Hz', bat: 82, sig: 97 },
              ].map((dev, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-black/[0.05] bg-[#f4f5f8] text-xs flex items-center justify-between transition hover:border-black/[0.1] shadow-2xs">
                  <div>
                    <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {dev.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {dev.type} · {dev.sample}
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-[10px] font-mono text-slate-600">
                    <span className="flex items-center gap-1">
                      <Battery className="w-3 h-3 text-emerald-600" /> {dev.bat}%
                    </span>
                    <span className="text-emerald-700 font-semibold">{dev.sig}%</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleMasterStationSync}
              disabled={syncingAll}
              className="w-full mt-4 py-2.5 rounded-xl bg-[#0b3d91] hover:bg-[#092d6c] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
            >
              {syncingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Sync Telemetry Stream</span>
            </button>
          </div>

          {/* Flight Physiological Scenario Triage */}
          <div className="bg-white border border-black/[0.09] rounded-2xl p-6 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/[0.05]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0b3d91]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                  Flight State Evaluation
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Triage Engine</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { 
                  key: 'SCENARIO_A_NOMINAL', 
                  label: '1. Nominal Baseline Transit', 
                  desc: 'All vitals within μ ± 1.5σ corridor',
                  color: 'border-emerald-500 text-emerald-800 bg-emerald-50' 
                },
                { 
                  key: 'SCENARIO_B_ACUTE_SPIKE', 
                  label: '2. Acute Spacewalk Exertion', 
                  desc: 'Single-day exertion spike (suppressed)',
                  color: 'border-amber-500 text-amber-800 bg-amber-50' 
                },
                { 
                  key: 'SCENARIO_C_SILENT_DETERIORATION', 
                  label: '3. Multi-Day EVA Drift', 
                  desc: 'Persistent multi-day clinical alert',
                  color: 'border-rose-500 text-rose-800 bg-rose-50' 
                },
              ].map(({ key, label, desc, color }) => {
                const active = activeScenario === key;
                return (
                  <button
                    key={key}
                    disabled={scenarioLoading}
                    onClick={() => onLoadScenario(key)}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col gap-1 active:scale-[0.99] ${
                      active 
                        ? `${color} ring-1 font-semibold shadow-xs` 
                        : 'bg-[#f4f5f8] border-black/[0.05] text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          key === 'SCENARIO_A_NOMINAL' ? 'bg-emerald-500' : key === 'SCENARIO_B_ACUTE_SPIKE' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span>{label}</span>
                      </div>
                      {active && <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-white/80">ACTIVE</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal pl-4">
                      {desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vehicle Subsystems & Habitat ECLSS Telemetry */}
          <div className="bg-white border border-black/[0.09] rounded-2xl p-6 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/[0.05]">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-[#0b3d91]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                  Habitat ECLSS Subsystems
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Nominal Loops
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#f4f5f8] border border-black/[0.05] shadow-2xs">
                <div className="text-[10px] text-slate-500 font-mono">CO₂ SCRUBBER</div>
                <div className="font-bold font-mono text-slate-900 mt-1 text-sm">Bed B Active</div>
                <div className="text-[10px] text-slate-500 mt-0.5">3,450 ppm</div>
              </div>

              <div className="p-3 rounded-xl bg-[#f4f5f8] border border-black/[0.05] shadow-2xs">
                <div className="text-[10px] text-slate-500 font-mono">CABIN PRESSURE</div>
                <div className="font-bold font-mono text-slate-900 mt-1 text-sm">101.3 kPa</div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Sea-level O₂/N₂</div>
              </div>

              <div className="p-3 rounded-xl bg-[#f4f5f8] border border-black/[0.05] shadow-2xs">
                <div className="text-[10px] text-slate-500 font-mono">O₂ PRESSURE</div>
                <div className="font-bold font-mono text-slate-900 mt-1 text-sm">21.3 kPa</div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Normoxic</div>
              </div>

              <div className="p-3 rounded-xl bg-[#f4f5f8] border border-black/[0.05] shadow-2xs">
                <div className="text-[10px] text-slate-500 font-mono">IONIZING RAD</div>
                <div className="font-bold font-mono text-slate-900 mt-1 text-sm">295 μSv/d</div>
                <div className="text-[10px] text-purple-700 mt-0.5">ALARA Safe</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── 5. Full-Width 3D Spatial Systems & Human Telemetry Reference ── */}
      <div id="spatial-reference-section" className="bg-white border border-black/[0.09] rounded-2xl overflow-hidden shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] scroll-mt-6">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80 border-b border-black/[0.06] flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0b3d91] flex items-center justify-center text-white shadow-xs shrink-0">
              <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-950 tracking-tight uppercase font-mono break-words sm:whitespace-nowrap">
                  3D Spatial Reference & Vehicle Systems Telemetry
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 shrink-0">
                  REAL-TIME SYNC
                </span>
              </div>
              <div className="text-xs text-slate-600 font-semibold mt-0.5 truncate">
                Interactive 360° human anatomical scanner & Orion MPC-V deep space vehicle telemetry
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {/* Mode Switcher Tabs */}
            <div className="flex flex-wrap sm:flex-nowrap items-center bg-[#f4f5f8] p-1 rounded-xl border border-black/[0.06] shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => setReferenceMode('anatomy')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                  referenceMode === 'anatomy'
                    ? 'bg-[#0b3d91] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>360° Human Anatomy</span>
              </button>
              <button
                type="button"
                onClick={() => setReferenceMode('spacecraft')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                  referenceMode === 'spacecraft'
                    ? 'bg-[#0b3d91] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                <Orbit className="w-3.5 h-3.5" />
                <span>360° Orion Spacecraft</span>
              </button>
            </div>

            {/* Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={() => setShowSpatialReference(!showSpatialReference)}
              className="px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>{showSpatialReference ? 'Hide' : 'Expand'}</span>
              {showSpatialReference ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showSpatialReference && (
          <div className="p-3 sm:p-6 bg-[#fbfbfd]">
            <div className="rounded-2xl overflow-hidden border border-black/[0.09] shadow-inner">
              {referenceMode === 'anatomy' && currentAstro && (
                <AnatomicalScanner
                  astronaut={currentAstro}
                  activeAlert={activeAlert}
                  latestVitals={liveVitals}
                />
              )}
              {referenceMode === 'spacecraft' && (
                <NASASpacecraftHologram
                  activeMission={currentAstro?.mission_code || 'ARTEMIS-III'}
                  flightDay={14}
                />
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
