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
  fetchAlertEvidence 
} from './services/api';
import { Navbar, ActiveView } from './components/layout/Navbar';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { FleetOverview } from './components/crew/FleetOverview';
import { AstronautProfileDetail } from './components/crew/AstronautProfileDetail';
import { ProfileRegistrationModal } from './components/crew/ProfileRegistrationModal';
import { SystemStatusView } from './components/system/SystemStatusView';
import { AlertInspectorModal } from './components/AlertInspectorModal';
import { DataQualityModal } from './components/DataQualityModal';

export function App() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [retrying, setRetrying] = useState<boolean>(false);

  const [activeView, setActiveView] = useState<ActiveView>('fleet');
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
  
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
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
    setRetrying(true);
    try {
      const [hData, aData] = await Promise.all([
        fetchHealth(),
        fetchAstronauts(),
      ]);
      setHealth(hData);
      setAstronauts(aData);
      setIsOffline(false);
      if (aData.length > 0 && !selectedAstronautId) {
        // Default to Dr. Elena Vance (ARTEMIS-01) or first astronaut
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
    setStatusMessage(`Triggering ${scenarioKey}...`);
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
      setActiveView('review'); // Switch to review view to inspect the scenario effect immediately
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Scenario load failed: ${msg}`);
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

  const selectedAstro = astronauts.find(a => a.id === selectedAstronautId) || null;

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans selection:bg-nasa-blue selection:text-white">
      {/* Top Mission Control Header with Navigation */}
      <Navbar
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
      />

      {/* Offline Standalone Mode Warning Banner */}
      {isOffline && (
        <OfflineBanner
          onRetry={loadInitialData}
          retrying={retrying}
        />
      )}

      {/* Dynamic Status / Feedback Bar */}
      {statusMessage && (
        <div className="bg-space-900 border-b border-space-800 px-6 py-2 text-xs font-mono text-nasa-cyan flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-nasa-cyan animate-ping" /> {statusMessage}
          </span>
          <button onClick={() => setStatusMessage('')} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>
      )}

      {/* Main Workspace Router */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
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
          />
        )}

        {activeView === 'diagnostics' && (
          <SystemStatusView onRefreshHealth={loadInitialData} />
        )}
      </main>

      {/* Register New Crew Member Modal */}
      {showRegisterModal && (
        <ProfileRegistrationModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={handleProfileRegistered}
        />
      )}

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
