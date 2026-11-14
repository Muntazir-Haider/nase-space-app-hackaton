import { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  ChevronRight, 
  AlertTriangle,
  Play,
  Loader2,
  Search,
  Filter,
  X
} from 'lucide-react';
import { AstronautSummary } from '../../types';

interface FleetOverviewProps {
  astronauts: AstronautSummary[];
  selectedAstronautId: string | null;
  onSelectAstronaut: (astronautId: string) => void;
  onOpenRegisterModal: () => void;
  onInspectAlert: (alertId: string) => void;
  loading: boolean;
  onLoadDemoScenario: (scenarioKey: string) => void;
  scenarioLoading: boolean;
}

export function FleetOverview({
  astronauts,
  selectedAstronautId,
  onSelectAstronaut,
  onOpenRegisterModal,
  loading,
  onLoadDemoScenario,
  scenarioLoading,
}: FleetOverviewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ALERTS_ONLY' | 'NOMINAL' | 'OBSERVATION'>('ALL');

  // Aggregate readiness statistics
  const totalCount = astronauts.length;
  const nominalCount = astronauts.filter(a => a.status_indicator === 'NOMINAL').length;
  const alertCount = astronauts.filter(a => a.status_indicator === 'REVIEW_ALERT').length;
  const observationCount = astronauts.filter(a => a.status_indicator === 'OBSERVATION').length;

  // Filtered astronaut list
  const filteredAstronauts = astronauts.filter((a) => {
    const matchesSearch = 
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.mission_role.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'ALERTS_ONLY') return a.status_indicator === 'REVIEW_ALERT';
    if (statusFilter === 'NOMINAL') return a.status_indicator === 'NOMINAL';
    if (statusFilter === 'OBSERVATION') return a.status_indicator === 'OBSERVATION';
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Fleet Readiness Summary KPI Cards (Clickable Filters) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`bg-space-900 border rounded-2xl p-4 shadow cursor-pointer transition ${
            statusFilter === 'ALL' ? 'border-nasa-cyan ring-1 ring-nasa-cyan/40 bg-space-850' : 'border-space-800 hover:border-space-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Total Crew</span>
            <Users className="w-4 h-4 text-nasa-cyan" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">{totalCount}</div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Active Spaceflight Roster</p>
        </div>

        <div 
          onClick={() => setStatusFilter('NOMINAL')}
          className={`bg-space-900 border rounded-2xl p-4 shadow cursor-pointer transition ${
            statusFilter === 'NOMINAL' ? 'border-emerald-500 ring-1 ring-emerald-500/40 bg-space-850' : 'border-space-800 hover:border-space-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Nominal Clearance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">{nominalCount}</div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Full flight status</p>
        </div>

        <div 
          onClick={() => setStatusFilter('OBSERVATION')}
          className={`bg-space-900 border rounded-2xl p-4 shadow cursor-pointer transition ${
            statusFilter === 'OBSERVATION' ? 'border-amber-500 ring-1 ring-amber-500/40 bg-space-850' : 'border-space-800 hover:border-space-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Observation / Restricted</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">{observationCount}</div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Restricted mission duties</p>
        </div>

        <div 
          onClick={() => setStatusFilter('ALERTS_ONLY')}
          className={`bg-space-900 border rounded-2xl p-4 shadow cursor-pointer transition ${
            statusFilter === 'ALERTS_ONLY' ? 'border-red-500 ring-1 ring-red-500/40 bg-space-850' : 'border-space-800 hover:border-space-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Active Review Alerts</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-2">{alertCount}</div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Requiring CMO evaluation</p>
        </div>
      </div>

      {/* Fleet Roster Header & Search/Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-nasa-cyan" /> Crew Fleet Roster &amp; Operational Readiness
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Deep-space crew vitals monitoring under 22m communication latency constraints
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search callsign, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-space-900 border border-space-750 rounded-xl pl-8 pr-7 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-nasa-cyan w-48 sm:w-56"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 bg-space-900 p-1 rounded-xl border border-space-800 text-[11px] font-mono">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'ALL' ? 'bg-nasa-blue text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('ALERTS_ONLY')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'ALERTS_ONLY' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Alerts ({alertCount})
            </button>
            <button
              onClick={() => setStatusFilter('NOMINAL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'NOMINAL' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nominal ({nominalCount})
            </button>
          </div>

          <button
            onClick={onOpenRegisterModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nasa-blue hover:bg-nasa-blue/80 text-white font-mono text-xs font-bold transition shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5 text-nasa-cyan" />
            <span>+ Register Crew</span>
          </button>
        </div>
      </div>

      {/* Roster Cards Grid */}
      {loading ? (
        <div className="p-16 border border-space-800 rounded-2xl text-center text-slate-400 flex items-center justify-center gap-2 font-mono text-xs">
          <Loader2 className="w-4 h-4 text-nasa-cyan animate-spin" /> Synchronizing local SQLite telemetry...
        </div>
      ) : astronauts.length === 0 ? (
        <div className="p-12 border border-dashed border-space-800 rounded-2xl text-center flex flex-col items-center justify-center gap-4 bg-space-900/40">
          <div className="w-12 h-12 rounded-full bg-space-850 flex items-center justify-center text-slate-400 border border-space-750">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No Astronaut Profiles Active in Database</h3>
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-md">
              The local SQLite database currently contains zero astronaut profiles. Register a new crew member or load a pre-calibrated NASA Space Apps demo scenario.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onOpenRegisterModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-nasa-blue hover:bg-nasa-blue/80 text-white font-mono text-xs font-bold transition"
            >
              <UserPlus className="w-3.5 h-3.5" /> Register First Astronaut
            </button>
            <button
              disabled={scenarioLoading}
              onClick={() => onLoadDemoScenario('SCENARIO_C_SILENT_DETERIORATION')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-space-800 hover:bg-space-750 text-slate-200 border border-space-700 font-mono text-xs transition"
            >
              <Play className="w-3.5 h-3.5 text-nasa-amber" /> Load Scenario C (Hero Scenario)
            </button>
          </div>
        </div>
      ) : filteredAstronauts.length === 0 ? (
        <div className="p-12 border border-dashed border-space-800 rounded-2xl text-center flex flex-col items-center justify-center gap-3 bg-space-900/40">
          <Filter className="w-8 h-8 text-slate-500" />
          <h3 className="text-sm font-bold text-white">No Astronauts Match Filter</h3>
          <p className="text-xs text-slate-400 font-mono">
            No crew records found for query &ldquo;{searchQuery || statusFilter}&rdquo;.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
            className="px-3 py-1.5 rounded-lg bg-space-800 text-nasa-cyan border border-space-700 font-mono text-xs hover:bg-space-750 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAstronauts.map((astro) => {
            const isSelected = astro.id === selectedAstronautId;
            const hasAlert = astro.status_indicator === 'REVIEW_ALERT';
            return (
              <div
                key={astro.id}
                onClick={() => onSelectAstronaut(astro.id)}
                className={`rounded-2xl p-5 transition shadow-lg flex flex-col justify-between cursor-pointer border ${
                  isSelected
                    ? hasAlert
                      ? 'bg-space-850 border-red-500 shadow-red-950/40 ring-1 ring-red-500'
                      : 'bg-space-850 border-nasa-cyan shadow-nasa-cyan/20 ring-1 ring-nasa-cyan'
                    : 'bg-space-900 border-space-800 hover:border-space-700 hover:bg-space-850/60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-nasa-cyan bg-space-950 px-2 py-0.5 rounded border border-space-750">
                        {astro.callsign}
                      </span>
                      <h3 className="font-bold text-base text-white mt-1.5">{astro.full_name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{astro.mission_role} · {astro.mission_code}</p>
                    </div>

                    {hasAlert ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-red-950 text-red-400 border border-red-500/50 font-bold">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> ALERT ({astro.active_alert_count})
                      </span>
                    ) : astro.medical_clearance_status !== 'FULL_FLIGHT_CLEARANCE' ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/40">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> OBSERVATION
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> NOMINAL
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-space-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Clearance: {astro.medical_clearance_status}</span>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 text-[11px]">
                    {astro.last_reading_time 
                      ? `Last: ${new Date(astro.last_reading_time).toISOString().substring(11, 16)} UTC` 
                      : 'No readings yet'}
                  </span>
                  <span className={`flex items-center gap-1 font-bold ${
                    isSelected ? 'text-nasa-cyan' : 'text-slate-400 hover:text-white'
                  }`}>
                    Inspect Review Workspace <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
