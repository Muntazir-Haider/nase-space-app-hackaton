import { useEffect, useState } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Database, 
  Clock, 
  HeartPulse, 
  CheckCircle2, 
  Play,
  Loader2,
  FileSearch,
  ChevronRight
} from 'lucide-react';
import { 
  AstronautSummary, 
  HealthCheckResponse, 
  AstronautTimelineResponse, 
  DeteriorationAlert, 
  AlertEvidenceDetail 
} from './types';
import { 
  fetchHealth, 
  fetchAstronauts, 
  loadDemoScenario, 
  fetchAstronautTimeline, 
  fetchAlerts, 
  fetchAlertEvidence 
} from './services/api';
import { SynchronizedCharts } from './components/SynchronizedCharts';
import { AlertInspectorModal } from './components/AlertInspectorModal';
import { DataQualityModal } from './components/DataQualityModal';

export function App() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [astronauts, setAstronauts] = useState<AstronautSummary[]>([]);
  const [selectedAstronautId, setSelectedAstronautId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<AstronautTimelineResponse | null>(null);
  const [activeAlert, setActiveAlert] = useState<DeteriorationAlert | null>(null);
  const [evidenceDetail, setEvidenceDetail] = useState<AlertEvidenceDetail | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<string>('SCENARIO_C_SILENT_DETERIORATION');
  const [scenarioLoading, setScenarioLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [showDataQualityModal, setShowDataQualityModal] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAstronautId) {
      loadAstronautDetails(selectedAstronautId);
    }
  }, [selectedAstronautId]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [hData, aData] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchAstronauts().catch(() => []),
      ]);
      setHealth(hData);
      setAstronauts(aData);
      if (aData.length > 0) {
        // Default to Dr. Elena Vance or first astronaut
        const vance = aData.find(a => a.callsign === 'ARTEMIS-01') || aData[0];
        setSelectedAstronautId(vance.id);
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAstronautDetails(astroId: string) {
    setTimelineLoading(true);
    try {
      const [tl, alerts] = await Promise.all([
        fetchAstronautTimeline(astroId).catch(() => null),
        fetchAlerts(astroId).catch(() => []),
      ]);
      setTimeline(tl);
      const openAlert = alerts.find(a => ['NEW', 'UNDER_REVIEW', 'MONITORING'].includes(a.lifecycle_status)) || null;
      setActiveAlert(openAlert);
    } catch (err) {
      console.error('Error fetching astronaut details:', err);
    } finally {
      setTimelineLoading(false);
    }
  }

  async function handleOpenEvidence(alertId: string) {
    try {
      const detail = await fetchAlertEvidence(alertId);
      setEvidenceDetail(detail);
      setShowEvidenceModal(true);
    } catch (err) {
      console.error('Error loading evidence:', err);
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
      if (aData.length > 0) {
        setSelectedAstronautId(aData[0].id);
        await loadAstronautDetails(aData[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Scenario load failed: ${msg}`);
    } finally {
      setScenarioLoading(false);
    }
  }

  const selectedAstro = astronauts.find(a => a.id === selectedAstronautId);

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans">
      {/* Top Mission Control Header */}
      <header className="border-b border-space-800 bg-space-900/90 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
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

        {/* Status Pills */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-space-850 border border-space-700 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-nasa-cyan" />
            <span>FD 14 · Comms Latency: 22m 14s (Mars Sim)</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {health?.offline_storage_ready ? `SQLite (${health.database_file}) WAL OK` : 'Offline Monolith Active'}
            </span>
          </div>

          <button
            onClick={() => setShowDataQualityModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-space-850 hover:bg-space-800 border border-space-700 hover:border-nasa-cyan text-slate-300 transition"
          >
            <FileSearch className="w-3.5 h-3.5 text-amber-400" />
            <span>Data Quality Audit</span>
          </button>
        </div>

        {/* 1-Click Demo Scenario Switcher for Hackathon Judges */}
        <div className="flex items-center gap-1.5 bg-space-850 p-1.5 rounded-xl border border-space-700">
          <span className="text-xs font-mono text-slate-400 px-2 flex items-center gap-1">
            {scenarioLoading ? <Loader2 className="w-3 h-3 text-nasa-amber animate-spin" /> : <Play className="w-3 h-3 text-nasa-amber" />} 
            Demo Scenario:
          </span>
          <button
            disabled={scenarioLoading}
            onClick={() => handleScenarioSwitch('SCENARIO_A_NOMINAL')}
            className={`px-3 py-1.5 text-xs rounded-lg font-mono font-medium transition ${
              activeScenario === 'SCENARIO_A_NOMINAL'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-space-800'
            }`}
          >
            A: Nominal
          </button>
          <button
            disabled={scenarioLoading}
            onClick={() => handleScenarioSwitch('SCENARIO_B_ACUTE_SPIKE')}
            className={`px-3 py-1.5 text-xs rounded-lg font-mono font-medium transition ${
              activeScenario === 'SCENARIO_B_ACUTE_SPIKE'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-space-800'
            }`}
          >
            B: Exertion Spike
          </button>
          <button
            disabled={scenarioLoading}
            onClick={() => handleScenarioSwitch('SCENARIO_C_SILENT_DETERIORATION')}
            className={`px-3 py-1.5 text-xs rounded-lg font-mono font-medium transition ${
              activeScenario === 'SCENARIO_C_SILENT_DETERIORATION'
                ? 'bg-red-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-space-800'
            }`}
          >
            C: Silent Deterioration (Hero)
          </button>
        </div>
      </header>

      {/* Dynamic Status / Feedback Bar */}
      {statusMessage && (
        <div className="bg-space-900 border-b border-space-800 px-6 py-2 text-xs font-mono text-nasa-cyan flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-nasa-cyan animate-ping" /> {statusMessage}
          </span>
          <button onClick={() => setStatusMessage('')} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>
      )}

      {/* Main Medical Review Workspace */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Fleet Roster Grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-nasa-cyan" /> Crew Fleet Roster & Readiness
            </h2>
            <span className="text-xs text-slate-500 font-mono">Role: Crew Medical Officer (CMO) Active</span>
          </div>

          {loading ? (
            <div className="p-10 border border-space-800 rounded-2xl text-center text-slate-400 flex items-center justify-center gap-2 font-mono text-xs">
              <Loader2 className="w-4 h-4 text-nasa-cyan animate-spin" /> Synchronizing local SQLite telemetry...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {astronauts.map((astro) => {
                const isSelected = astro.id === selectedAstronautId;
                const hasAlert = astro.status_indicator === 'REVIEW_ALERT';
                return (
                  <div 
                    key={astro.id}
                    onClick={() => setSelectedAstronautId(astro.id)}
                    className={`rounded-2xl p-4 transition shadow-md flex flex-col justify-between cursor-pointer border ${
                      isSelected
                        ? hasAlert
                          ? 'bg-space-850 border-red-500 shadow-red-950/30'
                          : 'bg-space-850 border-nasa-cyan shadow-nasa-cyan/10'
                        : 'bg-space-900/90 border-space-800 hover:border-space-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-nasa-cyan bg-space-950 px-2 py-0.5 rounded border border-space-750">
                          {astro.callsign}
                        </span>
                        <h3 className="font-bold text-base text-white mt-1.5">{astro.full_name}</h3>
                        <p className="text-xs text-slate-400 font-mono">{astro.mission_role} · {astro.mission_code}</p>
                      </div>

                      {hasAlert ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAstronautId(astro.id);
                            if (activeAlert) handleOpenEvidence(activeAlert.id);
                          }}
                          className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-red-950 text-red-400 border border-red-500/50 hover:bg-red-900 transition font-bold"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> ALERT ({astro.active_alert_count})
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> NOMINAL
                        </span>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-space-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Clearance: {astro.medical_clearance_status}</span>
                      <span className={`flex items-center gap-1 ${isSelected ? 'text-nasa-cyan font-bold' : 'text-slate-500'}`}>
                        {isSelected ? 'Selected Workspace' : 'Inspect Vitals'} <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Selected Astronaut Physiological & Environmental Timeline */}
        {selectedAstro && (
          <section className="bg-space-900 border border-space-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-space-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-white">{selectedAstro.full_name}</h3>
                  <span className="text-xs font-mono text-nasa-cyan bg-space-850 px-2 py-0.5 rounded border border-space-700">
                    {selectedAstro.callsign}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedAstro.mission_role} · {selectedAstro.mission_code}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Synchronized Biometrics vs. 7-Day Rolling Personal Baselines (Bessel&apos;s Correction N-1)
                </p>
              </div>

              {activeAlert && (
                <button
                  onClick={() => handleOpenEvidence(activeAlert.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded-lg shadow-md transition flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" /> Inspect Active Alert Evidence ({activeAlert.review_priority})
                </button>
              )}
            </div>

            {timelineLoading ? (
              <div className="p-16 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-nasa-cyan animate-spin" /> Rendering synchronized time-series charts...
              </div>
            ) : (
              <SynchronizedCharts
                timeline={timeline}
                onOpenAlert={() => {
                  if (activeAlert) handleOpenEvidence(activeAlert.id);
                }}
                hasActiveAlert={Boolean(activeAlert)}
              />
            )}
          </section>
        )}
      </main>

      {/* Explainable Alert Evidence Modal */}
      {showEvidenceModal && (
        <AlertInspectorModal
          evidence={evidenceDetail}
          onClose={() => setShowEvidenceModal(false)}
          onStatusUpdated={async () => {
            const aData = await fetchAstronauts();
            setAstronauts(aData);
            if (selectedAstronautId) {
              await loadAstronautDetails(selectedAstronautId);
              if (activeAlert) {
                const refreshedDetail = await fetchAlertEvidence(activeAlert.id);
                setEvidenceDetail(refreshedDetail);
              }
            }
          }}
        />
      )}

      {/* Data Quality Rejection Audit Modal */}
      {showDataQualityModal && (
        <DataQualityModal onClose={() => setShowDataQualityModal(false)} />
      )}
    </div>
  );
}

export default App;
