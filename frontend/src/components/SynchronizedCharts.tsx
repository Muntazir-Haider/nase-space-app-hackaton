import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { Heart, Moon, Timer, Wind, AlertCircle } from 'lucide-react';
import { AstronautTimelineResponse, TimelinePoint } from '../types';

interface Props {
  timeline: AstronautTimelineResponse | null;
  onOpenAlert: () => void;
  hasActiveAlert: boolean;
}

export function SynchronizedCharts({ timeline, onOpenAlert, hasActiveAlert }: Props) {
  if (!timeline || timeline.timeline_points.length === 0) {
    return (
      <div className="p-12 border border-dashed border-space-800 rounded-2xl text-center text-slate-500 font-mono">
        No biometric time-series telemetry available for this crew member.
      </div>
    );
  }

  const { baselines, timeline_points } = timeline;
  const rhrBase = baselines['RESTING_HEART_RATE'];
  const sleepBase = baselines['SLEEP_DURATION'];
  const hrrBase = baselines['HEART_RATE_RECOVERY_1MIN'];

  // Format data for Recharts
  const chartData = timeline_points.map((pt: TimelinePoint, idx: number) => ({
    flightDay: `FD${idx + 1}`,
    date: pt.date,
    rhr: pt.rhr_value,
    sleep: pt.sleep_value,
    hrr: pt.hrr_value,
    co2: pt.cabin_co2_ppm,
    events: pt.mission_events,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Active Alert Banner if Present */}
      {hasActiveAlert && (
        <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-red-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 bg-red-900/60 px-2 py-0.5 rounded border border-red-500/30">
                  HIGH PRIORITY ALERT ACTIVE
                </span>
                <span className="text-xs text-slate-400 font-mono">Pattern: Silent Multi-Indicator Deterioration</span>
              </div>
              <p className="text-xs text-slate-200 mt-1">
                Sustained cardiovascular drift, sleep duration deficit, and autonomic recovery delay detected over consecutive cycles.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAlert}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded-lg shadow-md transition flex items-center gap-2"
          >
            Inspect Evidence & Math Breakdown →
          </button>
        </div>
      )}

      {/* Grid of 3 Synchronized Physiological Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Resting Heart Rate */}
        <div className="bg-space-900/90 border border-space-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <h4 className="font-semibold text-xs tracking-wider text-slate-200 uppercase">Resting Heart Rate</h4>
            </div>
            {rhrBase && (
              <span className="text-[11px] font-mono text-slate-400">
                Baseline: {rhrBase.mean} ± {rhrBase.std_dev} bpm
              </span>
            )}
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="flightDay" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#38bdf8' }}
                />
                {rhrBase && (
                  <ReferenceLine y={rhrBase.mean} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Mean', fill: '#10b981', fontSize: 9 }} />
                )}
                <Line
                  type="monotone"
                  dataKey="rhr"
                  name="RHR (bpm)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f43f5e' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">NASA HRP HRR-CV Risk · Early cephalad shift indicator</p>
        </div>

        {/* Chart 2: Sleep Duration */}
        <div className="bg-space-900/90 border border-space-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-sky-400" />
              <h4 className="font-semibold text-xs tracking-wider text-slate-200 uppercase">Sleep Duration</h4>
            </div>
            {sleepBase && (
              <span className="text-[11px] font-mono text-slate-400">
                Baseline: {sleepBase.mean} ± {sleepBase.std_dev} hrs
              </span>
            )}
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="flightDay" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[3, 9]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#38bdf8' }}
                />
                {sleepBase && (
                  <ReferenceLine y={sleepBase.mean} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Mean', fill: '#10b981', fontSize: 9 }} />
                )}
                <Line
                  type="monotone"
                  dataKey="sleep"
                  name="Sleep (hrs)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#38bdf8' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">NASA HRP Sleep Loss Risk · Cumulative sleep debt</p>
        </div>

        {/* Chart 3: Heart Rate Recovery */}
        <div className="bg-space-900/90 border border-space-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-xs tracking-wider text-slate-200 uppercase">HR Recovery (1-Min)</h4>
            </div>
            {hrrBase && (
              <span className="text-[11px] font-mono text-slate-400">
                Baseline: {hrrBase.mean} ± {hrrBase.std_dev} bpm
              </span>
            )}
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="flightDay" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#38bdf8' }}
                />
                {hrrBase && (
                  <ReferenceLine y={hrrBase.mean} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Mean', fill: '#10b981', fontSize: 9 }} />
                )}
                <Line
                  type="monotone"
                  dataKey="hrr"
                  name="HRR Drop (bpm)"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#34d399' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">NASA HRP Exercise Countermeasure · Autonomic tone</p>
        </div>
      </div>

      {/* Synchronized Mission Events & Cabin Stressor Track */}
      <div className="bg-space-900/60 border border-space-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-nasa-cyan" />
            <h4 className="font-semibold text-xs tracking-wider text-slate-300 uppercase">
              Mission Events & Habitat Stressors (Aligned Timeline)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Temporal cross-correlation without causal assertion</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {timeline_points.map((pt, i) => {
            const hasEvent = pt.mission_events.length > 0;
            const hasCO2 = pt.cabin_co2_ppm && pt.cabin_co2_ppm > 2500;
            return (
              <div
                key={pt.date}
                className={`p-2.5 rounded-lg border text-xs font-mono transition ${
                  hasCO2 || hasEvent
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-space-850/60 border-space-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-[11px] text-white">FD{i + 1}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{pt.date.slice(5)}</div>
                {hasCO2 && (
                  <div className="mt-1 text-[10px] text-amber-300 font-bold">
                    CO2: {pt.cabin_co2_ppm} ppm
                  </div>
                )}
                {hasEvent && (
                  <div className="mt-1 text-[9px] text-slate-300 leading-tight">
                    {pt.mission_events[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
