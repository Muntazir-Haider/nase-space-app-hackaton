import { useEffect, useState } from 'react';
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
  fetchAlertEvidence,
  fetchDataQualityAudit,
} from './services/api';
import { Sidebar, ActiveView } from './components/layout/Sidebar';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { FleetOverview } from './components/crew/FleetOverview';
import { AstronautProfileDetail } from './components/crew/AstronautProfileDetail';
import { ProfileRegistrationModal } from './components/crew/ProfileRegistrationModal';
import { SystemStatusView } from './components/system/SystemStatusView';
import { MLBenchmarkView } from './components/system/MLBenchmarkView';
import { AlertInspectorModal } from './components/AlertInspectorModal';
import { DataQualityModal } from './components/DataQualityModal';
import { JudgeTourModal } from './components/JudgeTourModal';
import { NASASpacecraftHologram } from './components/nasa/NASASpacecraftHologram';
import { AnatomicalScanner } from './components/nasa/AnatomicalScanner';
import { StationUnifiedDashboard } from './components/dashboard/StationUnifiedDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { WelcomeGuideModal } from './components/WelcomeGuideModal';
import { HeartPulse, Menu, BookOpen } from 'lucide-react';

function StationBootScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-800 font-sans">
      <div className="w-12 h-12 rounded-xl bg-[#0b3d91] flex items-center justify-center shadow mb-3">
        <HeartPulse className="w-6 h-6 text-white animate-heart-pulse" />
      </div>
      <h2 className="text-sm font-bold tracking-wider uppercase font-mono text-slate-800">Mission Sentinel</h2>
    </div>
  );
}

function StationDashboard() {
  const { isAuthenticated, isLoading, operator } = useAuth();

  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [retrying, setRetrying] = useState<boolean>(false);

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
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
  const [rejectedAuditCount, setRejectedAuditCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [showDataQualityModal, setShowDataQualityModal] = useState<boolean>(false);
  const [showJudgeTour, setShowJudgeTour] = useState<boolean>(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mission_sentinel_suppress_welcome_guide') !== 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!isOffline) return;
    const retryTimer = setInterval(() => {
      loadInitialData();
    }, 2500);
    return () => clearInterval(retryTimer);
  }, [isOffline]);

  useEffect(() => {
    if (selectedAstronautId) {
      loadAstronautDetails(selectedAstronautId);
    }
  }, [selectedAstronautId]);

  async function loadInitialData() {
    setLoading(true);
    setRetrying(true);
    try {
      const [hData, aData, auditLogs] = await Promise.all([
        fetchHealth(),
        fetchAstronauts(),
        fetchDataQualityAudit().catch(() => []),
      ]);
      setHealth(hData);
      setAstronauts(aData);
      setRejectedAuditCount(auditLogs.length);
      setIsOffline(false);
      if (aData.length > 0 && !selectedAstronautId) {
        const heroAstro = aData.find(a => a.callsign === 'ARTEMIS-01') || aData[0];
        setSelectedAstronautId(heroAstro.id);
      }
    } catch (err) {
      console.warn('Backend connection failed:', err);
      setIsOffline(true);
    } finally {
      setLoading(false);
      setRetrying(false);
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
      setIsOffline(false);
    } catch (err) {
      console.error('Error fetching astronaut details:', err);
      setIsOffline(true);
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
    setStatusMessage(`Loaded: ${scenarioKey}`);
    try {
      const res = await loadDemoScenario(scenarioKey);
      setStatusMessage(res.message);
      setIsOffline(false);
      const aData = await fetchAstronauts();
      setAstronauts(aData);
      if (aData.length > 0) {
        const targetAstro = aData.find(a => a.id === res.astronaut_id) || aData[0];
        setSelectedAstronautId(targetAstro.id);
        await loadAstronautDetails(targetAstro.id);
      }
      setActiveView('review');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Scenario failed: ${msg}`);
      setIsOffline(true);
    } finally {
      setScenarioLoading(false);
    }
  }

  function handleProfileRegistered(newAstroId: string) {
    loadInitialData().then(() => {
      setSelectedAstronautId(newAstroId);
      setActiveView('review');
    });
  }

  if (isLoading) {
    return <StationBootScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const selectedAstro = astronauts.find(a => a.id === selectedAstronautId) || null;

  return (
    <div className="min-h-screen bg-[#ebedf2] text-slate-900 flex font-sans">
      {/* Left Navigation Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        health={health}
        isOffline={isOffline}
        activeView={activeView}
        onSelectView={(v) => {
          if (v === 'register') {
            setShowRegisterModal(true);
          } else {
            setActiveView(v);
          }
        }}
        onOpenDataQuality={() => setShowDataQualityModal(true)}
        activeScenario={activeScenario}
        scenarioLoading={scenarioLoading}
        onScenarioSwitch={handleScenarioSwitch}
        rejectedAuditCount={rejectedAuditCount}
        onOpenJudgeTour={() => setShowJudgeTour(true)}
        onOpenWelcomeGuide={() => setShowWelcomeGuide(true)}
        astronauts={astronauts}
        selectedAstronautId={selectedAstronautId}
        onSelectAstronaut={(id) => {
          setSelectedAstronautId(id);
          setActiveView('review');
        }}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Right View Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Navigation Header (visible only on < lg) */}
        <header className="lg:hidden flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-black/[0.08] sticky top-0 z-20 shadow-2xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition active:scale-95 cursor-pointer shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-slate-900" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#0b3d91] flex items-center justify-center text-white shrink-0 shadow-2xs">
                <HeartPulse className="w-4 h-4 animate-heart-pulse" />
              </div>
              <span className="font-extrabold text-xs font-mono tracking-tight text-slate-950 uppercase truncate">
                Mission Sentinel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowWelcomeGuide(true)}
              className="px-2 py-1 rounded-lg bg-blue-50 text-[#0b3d91] border border-blue-200 hover:bg-blue-100 transition active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
              title="Open Operator Guide"
            >
              <BookOpen className="w-3 h-3" />
              <span>Guide</span>
            </button>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0b3d91] border border-blue-200">
              FD 14
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
              ONLINE
            </span>
          </div>
        </header>

        {/* Offline Banner */}
        {isOffline && (
          <OfflineBanner
            onRetry={loadInitialData}
            retrying={retrying}
          />
        )}

        {/* Status Alert Bar */}
        {statusMessage && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 text-xs font-mono text-blue-800 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> {statusMessage}
            </span>
            <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 w-full flex flex-col gap-4 sm:gap-6">
        {activeView === 'dashboard' && (
          <StationUnifiedDashboard
            astronauts={astronauts}
            selectedAstronaut={selectedAstro}
            onSelectAstronaut={(id) => {
              setSelectedAstronautId(id);
            }}
            timeline={timeline}
            activeAlert={activeAlert}
            onOpenEvidence={handleOpenEvidence}
            onOpenRegisterModal={() => setShowRegisterModal(true)}
            onOpenDataQuality={() => setShowDataQualityModal(true)}
            onOpenJudgeTour={() => setShowJudgeTour(true)}
            onLoadScenario={handleScenarioSwitch}
            scenarioLoading={scenarioLoading}
            activeScenario={activeScenario}
            onRefreshTimeline={() => {
              if (selectedAstronautId) {
                loadAstronautDetails(selectedAstronautId);
              }
            }}
            onNavigateToTelemetry={(astroId) => {
              if (astroId) setSelectedAstronautId(astroId);
              setActiveView('review');
            }}
          />
        )}

        {activeView === 'fleet' && (
          <FleetOverview
            astronauts={astronauts}
            selectedAstronautId={selectedAstronautId}
            onSelectAstronaut={(id) => {
              setSelectedAstronautId(id);
              setActiveView('review');
            }}
            onOpenRegisterModal={() => setShowRegisterModal(true)}
            onInspectAlert={(alertId) => handleOpenEvidence(alertId)}
            loading={loading}
            onLoadDemoScenario={handleScenarioSwitch}
            scenarioLoading={scenarioLoading}
          />
        )}

        {activeView === 'review' && (
          <AstronautProfileDetail
            astronaut={selectedAstro}
            timeline={timeline}
            activeAlert={activeAlert}
            timelineLoading={timelineLoading}
            onOpenEvidence={handleOpenEvidence}
            onOpenRegisterModal={() => setShowRegisterModal(true)}
            onRefreshTimeline={() => {
              if (selectedAstronautId) {
                loadAstronautDetails(selectedAstronautId);
              }
            }}
            onLoadScenario={handleScenarioSwitch}
            scenarioLoading={scenarioLoading}
          />
        )}

        {activeView === 'spacecraft' && (
          <div className="flex flex-col gap-6">
            <NASASpacecraftHologram
              activeMission={selectedAstro?.mission_code || 'ARTEMIS-III'}
              flightDay={14}
            />
            {selectedAstro && (
              <AnatomicalScanner
                astronaut={selectedAstro}
                activeAlert={activeAlert}
                latestVitals={{
                  rhr: activeAlert ? 68.9 : 62.4,
                  sleep: activeAlert ? 5.2 : 7.6,
                  hrr: activeAlert ? 24.5 : 34.0,
                  spo2: 98.4,
                  temp: 36.8,
                }}
              />
            )}
          </div>
        )}

        {activeView === 'diagnostics' && (
          <SystemStatusView onRefreshHealth={loadInitialData} />
        )}

        {activeView === 'benchmark' && (
          <MLBenchmarkView />
        )}
      </main>
      </div>

      {/* Modals */}
      {showRegisterModal && (
        <ProfileRegistrationModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={handleProfileRegistered}
        />
      )}

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

      {showDataQualityModal && (
        <DataQualityModal 
          onClose={() => setShowDataQualityModal(false)} 
          onTelemetryIngested={async () => {
            if (selectedAstronautId) {
              await loadAstronautDetails(selectedAstronautId);
            }
            const aData = await fetchAstronauts();
            setAstronauts(aData);
            const logs = await fetchDataQualityAudit().catch(() => []);
            setRejectedAuditCount(logs.length);
          }}
        />
      )}

      {showJudgeTour && (
        <JudgeTourModal
          onClose={() => setShowJudgeTour(false)}
          onNavigateView={(v) => setActiveView(v)}
          onScenarioLoaded={async (scenarioKey) => {
            setActiveScenario(scenarioKey);
            const aData = await fetchAstronauts();
            setAstronauts(aData);
            if (aData.length > 0) {
              const target = aData.find(a => a.callsign === 'ARTEMIS-01') || aData[0];
              setSelectedAstronautId(target.id);
              await loadAstronautDetails(target.id);
            }
          }}
        />
      )}

      {/* Operator Welcome Guide & Walkthrough Popup */}
      <WelcomeGuideModal
        isOpen={showWelcomeGuide}
        onClose={() => setShowWelcomeGuide(false)}
        onNavigateView={(v) => {
          if (v === 'register') {
            setShowRegisterModal(true);
          } else {
            setActiveView(v);
          }
        }}
        onLoadScenario={handleScenarioSwitch}
        operatorCallsign={operator?.callsign}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <StationDashboard />
    </AuthProvider>
  );
}

export default App;
