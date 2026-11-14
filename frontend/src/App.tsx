import { useEffect, useState } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Database, 
  Clock, 
  HeartPulse, 
  CheckCircle2, 
  Play,
  Loader2
} from 'lucide-react';
import { AstronautSummary, HealthCheckResponse } from './types';
import { fetchHealth, fetchAstronauts, loadDemoScenario } from './services/api';

export function App() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [astronauts, setAstronauts] = useState<AstronautSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeScenario, setActiveScenario] = useState<string>('SCENARIO_C_SILENT_DETERIORATION');
  const [scenarioLoading, setScenarioLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [hData, aData] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchAstronauts().catch(() => []),
      ]);
      setHealth(hData);
      setAstronauts(aData);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleScenarioSwitch(scenarioKey: string) {
    setActiveScenario(scenarioKey);
    setScenarioLoading(true);
    setStatusMessage(`Triggering ${scenarioKey}...`);
    try {
      const res = await loadDemoScenario(scenarioKey);
      setStatusMessage(res.message);
      const aData = await fetchAstronauts();
      setAstronauts(aData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Scenario load failed: ${msg}`);
    } finally {
      setScenarioLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col">
      {/* Top Mission Control Header */}
      <header className="border-b border-space-800 bg-space-900/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nasa-blue to-nasa-cyan flex items-center justify-center shadow-lg shadow-nasa-cyan/10">
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

        {/* Mid Stats & Status Pills */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-space-850 border border-space-700 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-nasa-cyan" />
            <span>MET Day 14 · Comms Latency: 22m 14s (Mars Sim)</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {health?.offline_storage_ready ? `SQLite (${health.database_file}) OK` : 'Local Storage Active'}
            </span>
          </div>
        </div>

        {/* 1-Click Demo Scenario Switcher for Hackathon Judges */}
        <div className="flex items-center gap-2 bg-space-850 p-1.5 rounded-lg border border-space-700">
          <span className="text-xs font-mono text-slate-400 px-2 flex items-center gap-1">
            {scenarioLoading ? <Loader2 className="w-3 h-3 text-nasa-amber animate-spin" /> : <Play className="w-3 h-3 text-nasa-amber" />} 
            Demo Scenario:
          </span>
          <button
            disabled={scenarioLoading}
            onClick={() => handleScenarioSwitch('SCENARIO_A_NOMINAL')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition ${
              activeScenario === 'SCENARIO_A_NOMINAL'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-space-800'
            }`}
          >
            A: Nominal
          </button>
          <button
            disabled={scenarioLoading}
            onClick={() => handleScenarioSwitch('SCENARIO_B_ACUTE_SPIKE')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition ${
              activeScenario === 'SCENARIO_B_ACUTE_SPIKE'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-space-800'
            }`}
          >
            B: Exertion Spike
          </button>
          <button
            disabled={scenarioLoading}
            onClick={() => handleScenarioSwitch('SCENARIO_C_SILENT_DETERIORATION')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition ${
              activeScenario === 'SCENARIO_C_SILENT_DETERIORATION'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-space-800'
            }`}
          >
            C: Silent Deterioration (Hero)
          </button>
        </div>
      </header>

      {/* Status Bar */}
      {statusMessage && (
        <div className="bg-space-900 border-b border-space-800 px-6 py-2 text-xs font-mono text-nasa-cyan flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>
      )}

      {/* Main Medical Workstation Body */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Fleet Overview Banner */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-nasa-cyan" /> Crew Fleet Roster & Readiness
            </h2>
            <span className="text-xs text-slate-500 font-mono">Role: Crew Medical Officer (CMO)</span>
          </div>

          {loading ? (
            <div className="p-8 border border-space-800 rounded-xl text-center text-slate-400 flex items-center justify-center gap-2 font-mono text-sm">
              <Loader2 className="w-5 h-5 text-nasa-cyan animate-spin" /> Synchronizing local crew telemetry...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {astronauts.length === 0 ? (
                <div className="col-span-3 p-8 border border-dashed border-space-700 rounded-xl text-center text-slate-500">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-mono text-sm">No astronaut profiles active in database.</p>
                  <p className="text-xs mt-1 text-slate-600">Select a demo scenario above or ingest flight data.</p>
                </div>
              ) : (
                astronauts.map((astro) => (
                  <div 
                    key={astro.id}
                    className="bg-space-900 border border-space-800 hover:border-space-700 rounded-xl p-4 transition shadow-md flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-nasa-cyan bg-space-850 px-2 py-0.5 rounded border border-space-700">
                          {astro.callsign}
                        </span>
                        <h3 className="font-bold text-base text-white mt-1.5">{astro.full_name}</h3>
                        <p className="text-xs text-slate-400 font-mono">{astro.mission_role} · {astro.mission_code}</p>
                      </div>

                      {astro.status_indicator === 'REVIEW_ALERT' ? (
                        <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/40">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> ALERT ({astro.active_alert_count})
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> NOMINAL
                        </span>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-space-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Clearance: {astro.medical_clearance_status}</span>
                      <span className="text-nasa-cyan cursor-pointer hover:underline">Inspect Vitals →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* System Foundation Operational Status Banner */}
        <div className="bg-space-900/60 border border-nasa-blue/40 rounded-xl p-6 text-center max-w-2xl mx-auto my-auto flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-nasa-blue/20 border border-nasa-cyan/40 flex items-center justify-center text-nasa-cyan">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">System Foundations Operational (Phases 1–3)</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            FastAPI local workstation active · 13-table SQLite WAL relational schema initialized with strict foreign keys · 
            7-point telemetry data quality &amp; audit logging operational · 7-day rolling personal baseline engine with Bessel&apos;s correction active.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              ✓ 13 Tables Verified
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              ✓ 7-Point Quality Pipeline
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              ✓ N≥4 Baseline Engine
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-nasa-blue/40 text-nasa-cyan border border-nasa-cyan/30">
              Ready for Phase 4 Deterioration Engine
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
