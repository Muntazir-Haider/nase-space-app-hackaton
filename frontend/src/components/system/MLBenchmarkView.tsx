import { useEffect, useState } from 'react';
import { 
  BrainCircuit, 
  Play, 
  Loader2, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine
} from 'recharts';
import { BenchmarkEvaluationReport, DailyAnomalyScore } from '../../types';
import { fetchMLBenchmark, runMLBenchmark } from '../../services/api';

export function MLBenchmarkView() {
  const [report, setReport] = useState<BenchmarkEvaluationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [activeScenarioTab, setActiveScenarioTab] = useState<'scenario_c' | 'scenario_b'>('scenario_c');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBenchmark();
  }, []);

  async function loadBenchmark() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchMLBenchmark();
      setReport(data);
    } catch (err: unknown) {
      console.error('Failed to load ML benchmark:', err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleTriggerRun() {
    setRunning(true);
    setErrorMsg(null);
    try {
      const freshData = await runMLBenchmark();
      setReport(freshData);
    } catch (err: unknown) {
      console.error('Failed to run ML benchmark:', err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  const chartData = activeScenarioTab === 'scenario_c'
    ? report?.daily_progression_scenario_c || []
    : report?.daily_progression_scenario_b || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-space-900 border border-space-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Aerospace Clinical Intelligence Benchmark
                </h2>
                <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                  Experimental ML vs. Rules
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Comparative evaluation of Deterministic OLS Rules vs. Unsupervised Machine Learning (Isolation Forest & LOF)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerRun}
            disabled={running || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50 transition"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Evaluating Models...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Live Benchmark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Benchmark Evaluation Error: {errorMsg}</span>
          </div>
          <button onClick={loadBenchmark} className="underline hover:text-white">Retry</button>
        </div>
      )}

      {loading && !report ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <span>Executing local Scikit-Learn Isolation Forest & LOF algorithms...</span>
        </div>
      ) : report ? (
        <>
          {/* 3-Way Model Comparison Matrix Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {report.comparison_matrix.map((model, idx) => {
              const isRuleBased = model.model_name.includes('Rule-Based');
              const isIsoForest = model.model_name.includes('Isolation Forest');

              return (
                <div 
                  key={idx}
                  className={`rounded-2xl p-5 border flex flex-col justify-between transition ${
                    isRuleBased
                      ? 'bg-space-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                      : isIsoForest
                        ? 'bg-space-900/90 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                        : 'bg-space-900/90 border-space-800'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Top Pill & Title */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold border ${
                          isRuleBased
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isIsoForest
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {isRuleBased ? 'PRIMARY OPERATIONAL STANDARD' : isIsoForest ? 'EARLY-WARNING COMPANION' : 'EXPERIMENTAL RESEARCH'}
                        </span>
                        <h3 className="font-bold text-sm text-white mt-1.5">{model.model_name}</h3>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{model.model_family}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[10px] text-slate-400 block">Latency</span>
                        <span className="text-xs font-bold text-slate-200">{model.computational_latency_ms} ms</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed border-t border-space-800/80 pt-3">
                      {model.description}
                    </p>

                    {/* Performance Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-space-950/60 p-3 rounded-xl border border-space-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Scenario C Detection</span>
                        <span className="font-bold text-white text-xs">
                          {model.detection_day_scenario_c ? `Flight Day ${model.detection_day_scenario_c}` : 'Not Detected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Scenario B False Alarms</span>
                        <span className={`font-bold text-xs ${model.scenario_b_false_positives === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {model.scenario_b_false_positives} Spurious Alarms
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Explainability Score</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`font-bold text-xs ${model.explainability_score_out_of_10 >= 8 ? 'text-emerald-400' : 'text-cyan-300'}`}>
                            {model.explainability_score_out_of_10}/10
                          </span>
                          <div className="w-12 h-1.5 bg-space-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${model.explainability_score_out_of_10 >= 8 ? 'bg-emerald-500' : 'bg-cyan-500'}`} 
                              style={{ width: `${model.explainability_score_out_of_10 * 10}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Nominal False Alarms</span>
                        <span className="font-bold text-emerald-400 text-xs">
                          {model.scenario_a_false_positives} (Scenario A)
                        </span>
                      </div>
                    </div>

                    {/* Explainability Rationale */}
                    <div className="text-[11px] text-slate-400 leading-snug space-y-1">
                      <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Explainability & Audit Rationale:
                      </span>
                      <p className="italic">{model.explainability_rationale}</p>
                    </div>
                  </div>

                  {/* Flight Surgeon Verdict Footer */}
                  <div className="mt-4 pt-3 border-t border-space-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Flight Surgeon Clinical Verdict:
                    </span>
                    <p className={`text-[11px] font-mono font-medium leading-relaxed ${
                      isRuleBased ? 'text-emerald-300' : isIsoForest ? 'text-cyan-300' : 'text-amber-300'
                    }`}>
                      {model.nasa_flight_surgeon_verdict}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Anomaly Progression Visualizer */}
          <div className="bg-space-900 border border-space-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-space-800 pb-4">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Daily Multi-Model Anomaly Progression Timeline</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Compare continuous anomaly probabilities from Isolation Forest and LOF against the discrete Rule-Based Alert Trigger.
                </p>
              </div>

              {/* Scenario Toggle Tabs */}
              <div className="flex items-center gap-1 bg-space-950 p-1 rounded-xl border border-space-800 text-xs font-mono">
                <button
                  onClick={() => setActiveScenarioTab('scenario_c')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeScenarioTab === 'scenario_c'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Scenario C: Silent Deterioration (Hero)
                </button>
                <button
                  onClick={() => setActiveScenarioTab('scenario_b')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeScenarioTab === 'scenario_b'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Scenario B: Isolated Spike (False Alarm Test)
                </button>
              </div>
            </div>

            {/* Recharts Anomaly Curves */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#64748b" 
                    tickFormatter={(val) => `FD ${val}`}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    domain={[0, 1.05]} 
                    stroke="#64748b" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                  />
                  <Tooltip content={<CustomMLTooltip />} />
                  
                  {/* Alert Threshold Guideline */}
                  <ReferenceLine y={0.5} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'ML Anomaly Threshold (50%)', fill: '#eab308', fontSize: 10, position: 'right' }} />

                  {/* Isolation Forest Curve */}
                  <Line 
                    type="monotone" 
                    dataKey="isolation_forest_score" 
                    stroke="#06b6d4" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#06b6d4', r: 4 }}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    name="Isolation Forest Anomaly Probability"
                  />

                  {/* Local Outlier Factor Curve */}
                  <Line 
                    type="monotone" 
                    dataKey="lof_score" 
                    stroke="#a855f7" 
                    strokeWidth={2} 
                    strokeDasharray="4 4"
                    dot={{ fill: '#a855f7', r: 3 }}
                    name="LOF Outlier Factor"
                  />

                  {/* Rule-Based Trigger Step Indicator */}
                  <Line 
                    type="stepAfter" 
                    dataKey={(d: DailyAnomalyScore) => d.rule_based_alert ? 1.0 : 0.0} 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={false}
                    name="Rule-Based Alert Trigger (1.0 = Active)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend & Guidance */}
            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-space-800">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" />
                  <span className="text-slate-300">Isolation Forest (Continuous Probability)</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-purple-500 inline-block" />
                  <span className="text-slate-300">LOF Density Factor</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-1 bg-emerald-500 inline-block" />
                  <span className="text-slate-300">Rule-Based OLS Alert Active</span>
                </span>
              </div>
              <span className="text-slate-400">
                Evaluation Window: {chartData.length} Flight Days
              </span>
            </div>
          </div>

          {/* NASA Flight Surgeon & Clinical Engineering Takeaways */}
          <div className="bg-space-900 border border-space-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>NASA Spaceflight Clinical Synthesis & System Recommendations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.synthesis_conclusions.map((conc, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-space-950 border border-space-800/80 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{conc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function CustomMLTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data: DailyAnomalyScore = payload[0].payload;

    return (
      <div className="bg-space-900/95 backdrop-blur border border-space-700 p-3.5 rounded-xl shadow-2xl font-mono text-xs max-w-xs">
        <div className="flex items-center justify-between border-b border-space-700/60 pb-1.5 mb-2">
          <span className="font-bold text-white">Flight Day {data.day}</span>
          <span className="text-[10px] text-slate-400">{data.date}</span>
        </div>

        {data.context_event && (
          <div className="mb-2 p-1.5 rounded bg-space-800/60 text-[10px] text-cyan-300">
            Context: {data.context_event}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-emerald-400">
            <span>Rule-Based Engine:</span>
            <span className="font-bold">{data.rule_based_alert ? 'ALERT TRIGGERED' : 'NOMINAL'}</span>
          </div>

          <div className="flex justify-between items-center text-cyan-400">
            <span>Isolation Forest Prob:</span>
            <span className="font-bold">{(data.isolation_forest_score * 100).toFixed(1)}%</span>
          </div>

          <div className="flex justify-between items-center text-purple-400">
            <span>LOF Outlier Factor:</span>
            <span className="font-bold">{(data.lof_score * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
