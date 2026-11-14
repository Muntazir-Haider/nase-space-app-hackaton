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
  liveVitals?: {
    rhr?: number;
    sleep?: number;
    hrr?: number;
    spo2?: number;
    temp?: number;
  };
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
      <div className="bg-white border border-amber-300 p-3 rounded-md shadow-lg text-xs font-mono">
        <div className="text-amber-700 font-bold">{label} ({data.date})</div>
        <div className="text-slate-600 mt-1">Status: <span className="text-amber-600 font-bold">No Data</span></div>
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
    <div className="bg-white border border-slate-300 p-3 rounded-md shadow-lg text-xs font-mono min-w-[200px]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-2">
        <span className="text-[#0b3d91] font-bold">{label}</span>
        <span className="text-slate-400 text-[10px]">{data.date}</span>
      </div>
      <div className="flex items-center justify-between text-slate-800 font-bold">
        <span>{metricLabel}:</span>
        <span className="text-sm text-[#0b3d91]">{val.toFixed(1)} {unit}</span>
      </div>
      {baseline && (
        <div className="mt-2 pt-1 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
          <div className="flex justify-between text-slate-500">
            <span>7d Baseline:</span>
            <span>{baseline.mean.toFixed(1)} ± {baseline.std_dev.toFixed(1)}</span>
          </div>
          {zScore !== null && (
            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-600">Deviation (z):</span>
              <span className={
                Math.abs(zScore) >= 2.0 
                  ? 'text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200' 
                  : Math.abs(zScore) >= 1.5 
                    ? 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200' 
                    : 'text-emerald-700'
              }>
                {zScore > 0 ? `+${zScore.toFixed(2)}σ` : `${zScore.toFixed(2)}σ`}
              </span>
            </div>
          )}
          {isAdverse && (
            <div className="text-[10px] text-red-700 font-bold bg-red-50 p-1 rounded border border-red-200 mt-1">
              Adverse drift beyond ±1.5σ baseline
            </div>
          )}
        </div>
      )}
      {data.events && data.events.length > 0 && (
        <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-amber-700">
          <span className="font-bold">Event: </span>{data.events[0]}
        </div>
      )}
      {data.co2 && data.co2 > 2500 && (
        <div className="mt-1 text-[10px] text-amber-700">
          <span className="font-bold">CO2: </span>{data.co2} ppm
        </div>
      )}
    </div>
  );
}

export function SynchronizedCharts({ timeline, onOpenAlert, hasActiveAlert, liveVitals }: Props) {
  if (!timeline || timeline.timeline_points.length === 0) {
    return (
      <div className="p-12 border border-dashed border-slate-300 rounded-md text-center text-slate-400 font-mono text-xs bg-white">
        No telemetry available for this crew member.
      </div>
    );
  }

  const { baselines, timeline_points } = timeline;
  const rhrBase = baselines['RESTING_HEART_RATE'];
  const sleepBase = baselines['SLEEP_DURATION'];
  const hrrBase = baselines['HEART_RATE_RECOVERY_1MIN'];

  const chartData = timeline_points.map((pt: TimelinePoint, idx: number) => {
    const isLatest = idx === timeline_points.length - 1;
    return {
      flightDay: `FD${idx + 1}`,
      date: pt.date,
      rhr: isLatest && liveVitals?.rhr !== undefined ? liveVitals.rhr : pt.rhr_value,
      sleep: isLatest && liveVitals?.sleep !== undefined ? liveVitals.sleep : pt.sleep_value,
      hrr: isLatest && liveVitals?.hrr !== undefined ? liveVitals.hrr : pt.hrr_value,
      co2: pt.cabin_co2_ppm,
      events: pt.mission_events,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Active Alert Banner */}
      {hasActiveAlert && (
        <div className="bg-rose-50/90 border border-rose-300 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-rose-900 uppercase tracking-wide">
                  Clinical Alert Active
                </span>
                <span className="text-xs font-semibold text-rose-800">· Multivariate Physiological Drift</span>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                Elevated resting heart rate, sleep deficit, and delayed cardiac recovery detected across consecutive flight days.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAlert}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-[0.98] cursor-pointer"
          >
            Inspect Evidence →
          </button>
        </div>
      )}

      {/* Guide Bar with Live Streaming Pulse */}
      <div className="bg-[#f4f5f8] border border-black/[0.06] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#0b3d91]" />
            <span className="font-bold text-slate-900">Baseline Guide:</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Live Stream (0.45s Cadence)</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded bg-emerald-100 border border-emerald-400 inline-block" />
            <span>Normal Corridor (μ ± 1.5σ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-600 inline-block" />
            <span>7-Day Mean (μ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
            <span>Telemetry Point</span>
          </div>
        </div>
      </div>

      {/* Grid of 3 Synchronized Physiological Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Resting Heart Rate */}
        <div className="bg-white border border-black/[0.09] rounded-2xl p-5 flex flex-col justify-between shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.12)] transition-shadow">
          <div className="flex items-center justify-between mb-3 border-b border-black/[0.05] pb-2.5">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-600" />
              <h4 className="font-extrabold text-xs tracking-wider text-slate-950 uppercase font-mono">Resting Heart Rate</h4>
            </div>
            <div className="flex items-center gap-2">
              {liveVitals?.rhr !== undefined && (
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {liveVitals.rhr.toFixed(1)} bpm
                </span>
              )}
            </div>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="flightDay" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
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
                    fillOpacity={0.12}
                    stroke="#10b981"
                    strokeOpacity={0.3}
                    strokeDasharray="2 2"
                  />
                )}
                {rhrBase && (
                  <ReferenceLine 
                    y={rhrBase.mean} 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                    strokeWidth={1.5}
                    label={{ value: 'Mean', fill: '#059669', fontSize: 9, position: 'right' }} 
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="rhr"
                  name="RHR (bpm)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  connectNulls={false}
                  isAnimationActive={false}
                  dot={(props: any) => {
                    const isLast = props.index === chartData.length - 1;
                    if (isLast) {
                      return (
                        <g key={`rhr-dot-${props.index}`}>
                          <circle cx={props.cx} cy={props.cy} r={7} fill="#ef4444" fillOpacity={0.25} className="animate-ping" />
                          <circle cx={props.cx} cy={props.cy} r={4} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
                        </g>
                      );
                    }
                    return <circle key={`rhr-dot-${props.index}`} cx={props.cx} cy={props.cy} r={3} fill="#ef4444" />;
                  }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Sleep Duration */}
        <div className="bg-white border border-slate-300 rounded-md p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-sky-600" />
              <h4 className="font-bold text-xs tracking-wide text-slate-800 uppercase">Sleep Duration</h4>
            </div>
            <div className="flex items-center gap-2">
              {liveVitals?.sleep !== undefined && (
                <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  Live: {liveVitals.sleep.toFixed(1)}h
                </span>
              )}
              {sleepBase && (
                <span className="text-[11px] font-mono text-slate-500">
                  Base: {sleepBase.mean.toFixed(1)} ± {sleepBase.std_dev.toFixed(2)}h
                </span>
              )}
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="flightDay" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[3.5, 9]} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
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
                    fillOpacity={0.12}
                    stroke="#10b981"
                    strokeOpacity={0.3}
                    strokeDasharray="2 2"
                  />
                )}
                {sleepBase && (
                  <ReferenceLine 
                    y={sleepBase.mean} 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                    strokeWidth={1.5}
                    label={{ value: 'Mean', fill: '#059669', fontSize: 9, position: 'right' }} 
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="sleep"
                  name="Sleep (hrs)"
                  stroke="#0284c7"
                  strokeWidth={2}
                  connectNulls={false}
                  isAnimationActive={false}
                  dot={{ r: 3, fill: '#0284c7' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Heart Rate Recovery */}
        <div className="bg-white border border-slate-300 rounded-md p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-xs tracking-wide text-slate-800 uppercase">HR Recovery (1-Min)</h4>
            </div>
            <div className="flex items-center gap-2">
              {liveVitals?.hrr !== undefined && (
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live: {liveVitals.hrr.toFixed(1)} bpm
                </span>
              )}
              {hrrBase && (
                <span className="text-[11px] font-mono text-slate-500">
                  Base: {hrrBase.mean.toFixed(1)} ± {hrrBase.std_dev.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="flightDay" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
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
                    fillOpacity={0.12}
                    stroke="#10b981"
                    strokeOpacity={0.3}
                    strokeDasharray="2 2"
                  />
                )}
                {hrrBase && (
                  <ReferenceLine 
                    y={hrrBase.mean} 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                    strokeWidth={1.5}
                    label={{ value: 'Mean', fill: '#059669', fontSize: 9, position: 'right' }} 
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="hrr"
                  name="HRR Drop (bpm)"
                  stroke="#10b981"
                  strokeWidth={2}
                  connectNulls={false}
                  isAnimationActive={false}
                  dot={(props: any) => {
                    const isLast = props.index === chartData.length - 1;
                    if (isLast) {
                      return (
                        <g key={`hrr-dot-${props.index}`}>
                          <circle cx={props.cx} cy={props.cy} r={7} fill="#10b981" fillOpacity={0.25} className="animate-ping" />
                          <circle cx={props.cx} cy={props.cy} r={4} fill="#10b981" stroke="#ffffff" strokeWidth={1.5} />
                        </g>
                      );
                    }
                    return <circle key={`hrr-dot-${props.index}`} cx={props.cx} cy={props.cy} r={3} fill="#10b981" />;
                  }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Synchronized Mission Events & Cabin Context */}
      <div className="bg-white border border-slate-300 rounded-md p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-[#0b3d91]" />
            <h4 className="font-bold text-xs tracking-wide text-slate-800 uppercase">
              Mission Events &amp; Habitat Stressors
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {timeline_points.map((pt, i) => {
            const hasEvent = pt.mission_events.length > 0;
            const hasCO2 = pt.cabin_co2_ppm && pt.cabin_co2_ppm > 2500;
            return (
              <div
                key={pt.date}
                className={`p-2 rounded-lg border text-xs font-mono transition ${
                  hasCO2 || hasEvent
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-bold text-[11px] text-slate-800">FD{i + 1}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{pt.date.slice(5)}</div>
                {hasCO2 && (
                  <div className="mt-1 text-[10px] text-amber-800 font-bold">
                    CO2: {pt.cabin_co2_ppm} ppm
                  </div>
                )}
                {hasEvent && (
                  <div className="mt-1 text-[9px] text-slate-700 leading-tight">
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
