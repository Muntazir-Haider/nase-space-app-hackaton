import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import { Heart, Moon, Timer, Wind, AlertCircle, Info } from 'lucide-react';
import { AstronautTimelineResponse, TimelinePoint, TimelineBaselineInfo } from '../types';

interface Props {
  timeline: AstronautTimelineResponse | null;
  onOpenAlert: () => void;
  hasActiveAlert: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number | null; payload: any }>;
  label?: string;
  metricLabel: string;
  unit: string;
  baseline?: TimelineBaselineInfo | null;
  adverseDirection: 'high' | 'low';
}

function CustomBiometricTooltip({
  active,
  payload,
  label,
  metricLabel,
  unit,
  baseline,
  adverseDirection,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const val = payload[0].value;

  if (val === null || val === undefined) {
    return (
      <div className="bg-space-950/95 border border-amber-500/60 p-3 rounded-xl shadow-2xl text-xs font-mono">
        <div className="text-amber-400 font-bold">{label} ({data.date})</div>
        <div className="text-slate-300 mt-1">Status: <span className="text-amber-400 font-bold">MISSING OBSERVATION GAP</span></div>
        <p className="text-[10px] text-slate-400 mt-1">No sensor packet recorded for this flight day.</p>
      </div>
    );
  }

  let zScore: number | null = null;
  if (baseline && baseline.std_dev > 0) {
    zScore = (val - baseline.mean) / baseline.std_dev;
  }

  const isAdverse = 
    zScore !== null && 
    ((adverseDirection === 'high' && zScore >= 1.5) || (adverseDirection === 'low' && zScore <= -1.5));

  return (
    <div className="bg-space-950/95 border border-space-700 p-3 rounded-xl shadow-2xl text-xs font-mono min-w-[210px]">
      <div className="flex items-center justify-between border-b border-space-800 pb-1.5 mb-2">
        <span className="text-nasa-cyan font-bold">{label}</span>
        <span className="text-slate-400 text-[10px]">{data.date}</span>
      </div>
      <div className="flex items-center justify-between text-white font-bold">
        <span>{metricLabel}:</span>
        <span className="text-sm text-nasa-cyan">{val.toFixed(1)} {unit}</span>
      </div>
      {baseline && (
        <div className="mt-2 pt-1.5 border-t border-space-800/80 flex flex-col gap-1 text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>7d Baseline:</span>
            <span>{baseline.mean.toFixed(1)} ± {baseline.std_dev.toFixed(1)} {unit}</span>
          </div>
          {zScore !== null && (
            <div className="flex justify-between items-center font-bold">
              <span>Deviation (z):</span>
              <span className={
                Math.abs(zScore) >= 2.0 
                  ? 'text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/40' 
                  : Math.abs(zScore) >= 1.5 
                    ? 'text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40' 
                    : 'text-emerald-400'
              }>
                {zScore > 0 ? `+${zScore.toFixed(2)}σ` : `${zScore.toFixed(2)}σ`}
              </span>
            </div>
          )}
          {isAdverse && (
            <div className="text-[10px] text-red-400 font-bold bg-red-950/40 p-1 rounded border border-red-500/30 mt-1">
              Adverse drift beyond ±1.5σ baseline
            </div>
          )}
        </div>
      )}
      {data.events && data.events.length > 0 && (
        <div className="mt-2 pt-1.5 border-t border-space-800/80 text-[10px] text-amber-300">
          <span className="font-bold">Mission Event: </span>{data.events[0]}
        </div>
      )}
      {data.co2 && data.co2 > 2500 && (
        <div className="mt-1 text-[10px] text-amber-400">
          <span className="font-bold">Cabin CO2: </span>{data.co2} ppm
        </div>
      )}
    </div>
  );
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
            Inspect Evidence &amp; Math Breakdown →
          </button>
        </div>
      )}

      {/* Visual Guide Bar for CMO Chart Interpretation */}
      <div className="bg-space-950/80 border border-space-800 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-nasa-cyan" />
          <span className="text-slate-300 font-bold">Chart Interpretation Guide:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
            <span>Normal Baseline Corridor (μ ± 1.5σ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t border-dashed border-emerald-400 inline-block" />
            <span>7-Day Rolling Mean (μ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span>Flight Day Reading Point</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">Gaps = Missing Data</span>
          </div>
        </div>
      </div>

      {/* Grid of 3 Synchronized Physiological Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Resting Heart Rate */}
        <div className="bg-space-900/90 border border-space-800 rounded-xl p-4 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <h4 className="font-semibold text-xs tracking-wider text-slate-200 uppercase">Resting Heart Rate</h4>
            </div>
            {rhrBase && (
              <span className="text-[11px] font-mono text-slate-400">
                Baseline: {rhrBase.mean.toFixed(1)} ± {rhrBase.std_dev.toFixed(1)} bpm
              </span>
            )}
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="flightDay" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  content={
                    <CustomBiometricTooltip 
                      metricLabel="Resting HR" 
                      unit="bpm" 
                      baseline={rhrBase}
                      adverseDirection="high"
                    />
                  }
                />
                {rhrBase && (
                  <ReferenceArea
                    y1={Math.max(0, rhrBase.mean - 1.5 * rhrBase.std_dev)}
                    y2={rhrBase.mean + 1.5 * rhrBase.std_dev}
                    fill="#10b981"
                    fillOpacity={0.09}
                    stroke="#10b981"
                    strokeOpacity={0.25}
                    strokeDasharray="2 2"
                  />
                )}
                {rhrBase && (
                  <ReferenceLine 
                    y={rhrBase.mean} 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                    strokeWidth={1.5}
                    label={{ value: 'Mean', fill: '#10b981', fontSize: 9, position: 'right' }} 
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="rhr"
                  name="RHR (bpm)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={{ r: 3.5, fill: '#f43f5e' }}
                  activeDot={{ r: 5.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">NASA HRP HRR-CV Risk · Cephalad fluid shift biomarker</p>
        </div>

        {/* Chart 2: Sleep Duration */}
        <div className="bg-space-900/90 border border-space-800 rounded-xl p-4 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-sky-400" />
              <h4 className="font-semibold text-xs tracking-wider text-slate-200 uppercase">Sleep Duration</h4>
            </div>
            {sleepBase && (
              <span className="text-[11px] font-mono text-slate-400">
                Baseline: {sleepBase.mean.toFixed(1)} ± {sleepBase.std_dev.toFixed(2)} hrs
              </span>
            )}
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="flightDay" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[3.5, 9]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  content={
                    <CustomBiometricTooltip 
                      metricLabel="Sleep Duration" 
                      unit="hrs" 
                      baseline={sleepBase}
                      adverseDirection="low"
                    />
                  }
                />
                {sleepBase && (
                  <ReferenceArea
                    y1={Math.max(0, sleepBase.mean - 1.5 * sleepBase.std_dev)}
                    y2={sleepBase.mean + 1.5 * sleepBase.std_dev}
                    fill="#10b981"
                    fillOpacity={0.09}
                    stroke="#10b981"
                    strokeOpacity={0.25}
                    strokeDasharray="2 2"
                  />
                )}
                {sleepBase && (
                  <ReferenceLine 
                    y={sleepBase.mean} 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                    strokeWidth={1.5}
                    label={{ value: 'Mean', fill: '#10b981', fontSize: 9, position: 'right' }} 
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="sleep"
                  name="Sleep (hrs)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={{ r: 3.5, fill: '#38bdf8' }}
                  activeDot={{ r: 5.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">NASA HRP Sleep Loss Risk · Cumulative sleep debt</p>
        </div>

        {/* Chart 3: Heart Rate Recovery */}
        <div className="bg-space-900/90 border border-space-800 rounded-xl p-4 flex flex-col justify-between shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-xs tracking-wider text-slate-200 uppercase">HR Recovery (1-Min)</h4>
            </div>
            {hrrBase && (
              <span className="text-[11px] font-mono text-slate-400">
                Baseline: {hrrBase.mean.toFixed(1)} ± {hrrBase.std_dev.toFixed(1)} bpm
              </span>
            )}
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="flightDay" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  content={
                    <CustomBiometricTooltip 
                      metricLabel="HR Recovery (1m)" 
                      unit="bpm drop" 
                      baseline={hrrBase}
                      adverseDirection="low"
                    />
                  }
                />
                {hrrBase && (
                  <ReferenceArea
                    y1={Math.max(0, hrrBase.mean - 1.5 * hrrBase.std_dev)}
                    y2={hrrBase.mean + 1.5 * hrrBase.std_dev}
                    fill="#10b981"
                    fillOpacity={0.09}
                    stroke="#10b981"
                    strokeOpacity={0.25}
                    strokeDasharray="2 2"
                  />
                )}
                {hrrBase && (
                  <ReferenceLine 
                    y={hrrBase.mean} 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                    strokeWidth={1.5}
                    label={{ value: 'Mean', fill: '#10b981', fontSize: 9, position: 'right' }} 
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="hrr"
                  name="HRR Drop (bpm)"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={{ r: 3.5, fill: '#34d399' }}
                  activeDot={{ r: 5.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">NASA HRP Exercise Countermeasure · Autonomic tone</p>
        </div>
      </div>

      {/* Synchronized Mission Events & Cabin Stressor Track */}
      <div className="bg-space-900/60 border border-space-800 rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-nasa-cyan" />
            <h4 className="font-semibold text-xs tracking-wider text-slate-300 uppercase">
              Mission Events &amp; Habitat Stressors (Aligned Timeline)
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
