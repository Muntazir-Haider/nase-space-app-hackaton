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
  X,
  LayoutGrid,
  Table,
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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
    <div className="flex flex-col gap-6 sm:gap-8 font-sans">
      {/* Fleet Readiness Summary Cards (Apple Solid Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 cursor-pointer transition-all duration-200 ${
            statusFilter === 'ALL' ? 'border-[#0b3d91] ring-2 ring-blue-500/30' : 'border-black/[0.09] hover:border-black/[0.16]'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">All Crew</span>
            <Users className="w-4 h-4 text-[#0b3d91]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-2">{totalCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Active Crew</p>
        </div>

        <div 
          onClick={() => setStatusFilter('NOMINAL')}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 cursor-pointer transition-all duration-200 ${
            statusFilter === 'NOMINAL' ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-black/[0.09] hover:border-black/[0.16]'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">Fit for Duty</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 mt-2">{nominalCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Cleared</p>
        </div>

        <div 
          onClick={() => setStatusFilter('OBSERVATION')}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 cursor-pointer transition-all duration-200 ${
            statusFilter === 'OBSERVATION' ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-black/[0.09] hover:border-black/[0.16]'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">Observation</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-700 mt-2">{observationCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Monitoring</p>
        </div>

        <div 
          onClick={() => setStatusFilter('ALERTS_ONLY')}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 cursor-pointer transition-all duration-200 ${
            statusFilter === 'ALERTS_ONLY' ? 'border-red-500 ring-2 ring-red-500/30' : 'border-black/[0.09] hover:border-black/[0.16]'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">Review Needed</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-red-700 mt-2">{alertCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Alerts Active</p>
        </div>
      </div>

      {/* Fleet Roster Header & Search/Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0b3d91]" /> Astronaut Fleet Roster
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search callsign, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0b3d91] w-48 sm:w-56"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Filter Buttons & View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setStatusFilter('ALERTS_ONLY')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  statusFilter === 'ALERTS_ONLY' ? 'bg-red-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Alerts ({alertCount})
              </button>
              <button
                onClick={() => setStatusFilter('NOMINAL')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  statusFilter === 'NOMINAL' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nominal ({nominalCount})
              </button>
            </div>

            {/* View Mode Toggle: Excel Table vs Cards */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('table')}
                title="Spreadsheet Excel View"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition ${
                  viewMode === 'table' ? 'bg-white text-[#0b3d91] font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Excel Sheet</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Card Grid View"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition active:scale-[0.98] ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
            </div>
          </div>

          <button
            onClick={onOpenRegisterModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b3d91] hover:bg-blue-800 text-white text-xs font-bold transition shadow-xs active:scale-[0.98]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Astronaut</span>
          </button>
        </div>
      </div>

      {/* Roster Cards Grid */}
      {loading ? (
        <div className="p-16 border border-black/[0.08] rounded-2xl text-center text-slate-400 flex items-center justify-center gap-2 text-xs font-mono bg-white shadow-xs">
          <Loader2 className="w-4 h-4 text-[#0b3d91] animate-spin" /> Loading crew...
        </div>
      ) : astronauts.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-300 rounded-2xl text-center flex flex-col items-center justify-center gap-3 bg-white shadow-xs">
          <Users className="w-8 h-8 text-slate-300" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Crew Profiles Found</h3>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={onOpenRegisterModal}
              className="px-4 py-2 rounded-xl bg-[#0b3d91] text-white text-xs font-bold transition active:scale-[0.98] shadow-xs"
            >
              + Register Astronaut
            </button>
            <button
              disabled={scenarioLoading}
              onClick={() => onLoadDemoScenario('SCENARIO_C_SILENT_DETERIORATION')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5f5f7] hover:bg-slate-200 text-slate-800 border border-black/[0.06] text-xs font-semibold transition active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 text-amber-600" /> Load Scenario C
            </button>
          </div>
        </div>
      ) : filteredAstronauts.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-300 rounded-2xl text-center flex flex-col items-center justify-center gap-2 bg-white shadow-xs">
          <Filter className="w-6 h-6 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800">No Match Found</h3>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
            className="px-3.5 py-1.5 rounded-xl bg-[#f5f5f7] text-slate-700 text-xs hover:bg-slate-200 transition font-medium active:scale-[0.98]"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ─── EXCEL PROFESSIONAL DATA GRID VIEW ─── */
        <div className="excel-grid-container rounded-2xl overflow-hidden border border-black/[0.08] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)]">
          {/* Excel Formula Bar */}
          <div className="excel-formula-bar bg-slate-50/80 border-b border-black/[0.06] px-4 py-2 flex items-center gap-2">
            <div className="bg-white border border-black/[0.08] px-2.5 py-0.5 text-[10px] font-bold text-slate-600 rounded-md shadow-2xs">
              A1:G{filteredAstronauts.length}
            </div>
            <div className="text-slate-400 font-serif italic text-xs font-bold">fx</div>
            <div className="text-slate-700 text-[11px] truncate flex-1 font-mono">
              =FILTER(CREW_ROSTER, MISSION="ARTEMIS-III", STATUS="{statusFilter}")
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="excel-table">
              <thead>
                {/* Excel Column Letters */}
                <tr>
                  <th className="excel-col-letter w-9 min-w-9">#</th>
                  <th className="excel-col-letter">A</th>
                  <th className="excel-col-letter">B</th>
                  <th className="excel-col-letter">C</th>
                  <th className="excel-col-letter">D</th>
                  <th className="excel-col-letter">E</th>
                  <th className="excel-col-letter">F</th>
                  <th className="excel-col-letter">G</th>
                </tr>
                {/* Column Titles */}
                <tr>
                  <th className="excel-th w-9 min-w-9 text-center">Row</th>
                  <th className="excel-th">Callsign ▼</th>
                  <th className="excel-th">Astronaut Name ▼</th>
                  <th className="excel-th">Mission Role ▼</th>
                  <th className="excel-th">Medical Clearance ▼</th>
                  <th className="excel-th">Clinical Status ▼</th>
                  <th className="excel-th">Active Alerts ▼</th>
                  <th className="excel-th">Telemetry Updated ▼</th>
                </tr>
              </thead>
              <tbody>
                {filteredAstronauts.map((astro, idx) => {
                  const isSelected = astro.id === selectedAstronautId;
                  const hasAlert = astro.status_indicator === 'REVIEW_ALERT';

                  return (
                    <tr
                      key={astro.id}
                      onClick={() => onSelectAstronaut(astro.id)}
                      className={`excel-row cursor-pointer transition ${
                        isSelected 
                          ? 'bg-blue-50/80 font-medium' 
                          : hasAlert 
                            ? 'bg-red-50/40' 
                            : idx % 2 === 1 
                              ? 'bg-[#fcfdfd]' 
                              : 'bg-white'
                      }`}
                    >
                      {/* Row Number */}
                      <td className={`excel-row-num ${isSelected ? 'bg-blue-100 text-[#0b3d91] font-bold' : ''}`}>
                        {idx + 1}
                      </td>

                      {/* Column A: Callsign */}
                      <td className="excel-td font-bold text-[#0b3d91] flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          hasAlert ? 'bg-red-600 animate-ping' : 'bg-emerald-500'
                        }`} />
                        <span>{astro.callsign}</span>
                      </td>

                      {/* Column B: Full Name */}
                      <td className="excel-td font-bold text-slate-900">
                        {astro.full_name}
                      </td>

                      {/* Column C: Mission Role */}
                      <td className="excel-td text-slate-600">
                        {astro.mission_role}
                      </td>

                      {/* Column D: Medical Clearance */}
                      <td className="excel-td">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {astro.medical_clearance_status}
                        </span>
                      </td>

                      {/* Column E: Clinical Status Indicator */}
                      <td className="excel-td">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          hasAlert
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : astro.status_indicator === 'OBSERVATION'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {hasAlert ? 'REVIEW REQUIRED' : astro.status_indicator}
                        </span>
                      </td>

                      {/* Column F: Active Alerts */}
                      <td className="excel-td font-mono">
                        {astro.active_alert_count > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            {astro.active_alert_count} Alert{astro.active_alert_count > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">0 Alerts</span>
                        )}
                      </td>

                      {/* Column G: Last Telemetry */}
                      <td className="excel-td text-slate-500 text-[11px] font-mono">
                        {astro.last_reading_time
                          ? `${new Date(astro.last_reading_time).toISOString().substring(11, 16)} UTC`
                          : 'No readings'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Excel Status Bar */}
          <div className="excel-status-bar">
            <div className="flex items-center gap-3">
              <span className="font-bold text-emerald-700">READY</span>
              <span className="text-slate-400">|</span>
              <span>Sheet1: Crew_Fleet_Roster</span>
              <span className="text-slate-400">|</span>
              <span>Mission: ARTEMIS-III</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Total Crew: <strong className="text-slate-800">{totalCount}</strong></span>
              <span>Nominal: <strong className="text-emerald-700">{nominalCount}</strong></span>
              <span>Alerts: <strong className="text-red-700">{alertCount}</strong></span>
              <span className="text-slate-400">|</span>
              <span>Mode: Real-Time Sync</span>
            </div>
          </div>
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
                className={`bg-white rounded-2xl p-5 transition-all duration-200 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04),0_2px_6px_-1px_rgba(0,0,0,0.02)] flex flex-col justify-between cursor-pointer border hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] active:scale-[0.99] ${
                  isSelected
                    ? hasAlert
                      ? 'border-red-500 ring-2 ring-red-500/20'
                      : 'border-[#0b3d91] ring-2 ring-blue-500/20'
                    : 'border-black/[0.08] hover:border-black/[0.16]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {/* Astronaut Avatar / Initial Badge */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-xs ${
                        hasAlert
                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-blue-50 border-blue-200 text-[#0b3d91]'
                      }`}>
                        {astro.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#0b3d91] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/80">
                          {astro.callsign}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 mt-1">{astro.full_name}</h3>
                        <p className="text-xs text-slate-500">{astro.mission_role} · <span className="font-semibold text-slate-700">{astro.mission_code}</span></p>
                      </div>
                    </div>

                    {hasAlert ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                        <span>ALERT</span>
                      </span>
                    ) : astro.medical_clearance_status !== 'FULL_FLIGHT_CLEARANCE' ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>WATCH</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>NOMINAL</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-3.5 p-3 rounded-xl bg-[#f5f5f7] border border-black/[0.04] flex items-center justify-between text-xs text-slate-600">
                    <span>Clinical Clearance</span>
                    <span className={hasAlert ? 'text-red-600 font-bold' : 'text-emerald-700 font-semibold'}>
                      {hasAlert ? 'Review Required' : 'Cleared for Duty'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between text-xs border-t border-black/[0.04]">
                  <span className="text-slate-400 text-[11px] font-mono">
                    {astro.last_reading_time 
                      ? `Telemetry: ${new Date(astro.last_reading_time).toISOString().substring(11, 16)} UTC` 
                      : 'Synced'}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-[#0b3d91] hover:underline text-xs">
                    View Workstation <ChevronRight className="w-3.5 h-3.5" />
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
