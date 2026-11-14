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
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-md bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 tracking-wide">
                  Clinical Intelligence Benchmark
                </h2>
                <span className="text-[10px] font-mono uppercase bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-bold">
                  ML vs. Rules
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Comparative evaluation of Deterministic Rules vs. Isolation Forest &amp; LOF
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerRun}
            disabled={running || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#0b3d91] hover:bg-blue-800 text-white text-xs font-mono font-semibold shadow-sm disabled:opacity-50 transition"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Benchmark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Benchmark Error: {errorMsg}</span>
          </div>
          <button onClick={loadBenchmark} className="underline hover:text-red-950">Retry</button>
        </div>
      )}

      {loading && !report ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0b3d91] animate-spin" />
          <span>Running Isolation Forest &amp; LOF models...</span>
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
                  className={`bg-white rounded-md p-5 border flex flex-col justify-between shadow-sm transition ${
                    isRuleBased
                      ? 'border-emerald-300 ring-1 ring-emerald-200'
                      : isIsoForest
                        ? 'border-blue-300'
                        : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Pill & Title */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold border ${
                          isRuleBased
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isIsoForest
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isRuleBased ? 'PRIMARY STANDARD' : isIsoForest ? 'EARLY-WARNING' : 'EXPERIMENTAL'}
                        </span>
                        <h3 className="font-bold text-sm text-slate-800 mt-1.5">{model.model_name}</h3>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">{model.model_family}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[10px] text-slate-400 block">Latency</span>
                        <span className="text-xs font-bold text-slate-700">{model.computational_latency_ms} ms</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                      {model.description}
                    </p>

                    {/* Performance Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-md border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Detection Day</span>
                        <span className="font-bold text-slate-800 text-xs">
                          {model.detection_day_scenario_c ? `Day ${model.detection_day_scenario_c}` : 'Not Detected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Spike False Alarms</span>
                        <span className={`font-bold text-xs ${model.scenario_b_false_positives === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {model.scenario_b_false_positives} Spurious
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Explainability</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold text-xs text-slate-800">
                            {model.explainability_score_out_of_10}/10
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Nominal Alarms</span>
                        <span className="font-bold text-emerald-700 text-xs">
                          {model.scenario_a_false_positives} (0%)
                        </span>
                      </div>
                    </div>

                    {/* Flight Surgeon Verdict Footer */}
                    <div className="text-[11px] font-mono text-slate-600 pt-2 border-t border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Verdict:</span>
                      <p className="mt-0.5 font-medium">{model.nasa_flight_surgeon_verdict}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Excel Model Comparison Scorecard */}
          <div className="excel-grid-container">
            <div className="excel-formula-bar">
              <div className="bg-white border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded">
                A1:G{report.comparison_matrix.length}
              </div>
              <div className="text-slate-400 font-serif italic text-xs font-bold">fx</div>
              <div className="text-slate-700 text-[11px] truncate flex-1">
                =EVALUATION_SCORECARD(MODELS=report.comparison_matrix, METRICS=["DETECTION_DAY", "FALSE_ALARMS", "EXPLAINABILITY", "LATENCY"])
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="excel-table">
                <thead>
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
                  <tr>
                    <th className="excel-th w-9 min-w-9 text-center">Row</th>
                    <th className="excel-th">Model Name ▼</th>
                    <th className="excel-th">Model Architecture ▼</th>
                    <th className="excel-th">Early Detection (Scenario C) ▼</th>
                    <th className="excel-th">Spike False Positives ▼</th>
                    <th className="excel-th">Explainability (/10) ▼</th>
                    <th className="excel-th">Latency (ms) ▼</th>
                    <th className="excel-th">Flight Surgeon Clinical Verdict ▼</th>
                  </tr>
                </thead>
                <tbody>
                  {report.comparison_matrix.map((model, idx) => (
                    <tr key={idx} className="excel-row">
                      <td className="excel-row-num">{idx + 1}</td>
                      <td className="excel-td font-bold text-slate-900">{model.model_name}</td>
                      <td className="excel-td text-slate-600 font-mono text-[11px]">{model.model_family}</td>
                      <td className="excel-td font-bold text-[#0b3d91]">
                        {model.detection_day_scenario_c ? `Day ${model.detection_day_scenario_c}` : 'Not Detected'}
                      </td>
                      <td className="excel-td">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          model.scenario_b_false_positives === 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {model.scenario_b_false_positives} Spurious
                        </span>
                      </td>
                      <td className="excel-td font-bold text-slate-800">
                        {model.explainability_score_out_of_10} / 10
                      </td>
                      <td className="excel-td text-slate-600 font-mono">
                        {model.computational_latency_ms} ms
                      </td>
                      <td className="excel-td text-slate-700 max-w-xs truncate" title={model.nasa_flight_surgeon_verdict}>
                        {model.nasa_flight_surgeon_verdict}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="excel-status-bar">
              <span>READY | Sheet: Model_Benchmark_Scorecard | Certified by: NASA Medical Informatics</span>
              <span>Evaluated Models: <strong className="text-slate-800">{report.comparison_matrix.length}</strong></span>
            </div>
          </div>

          {/* Anomaly Progression Visualizer */}
          <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0b3d91]" />
                  <span>Daily Anomaly Progression</span>
                </h3>
              </div>

              {/* Scenario Toggle Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-mono">
                <button
                  onClick={() => setActiveScenarioTab('scenario_c')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeScenarioTab === 'scenario_c'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Scenario C: Silent Deterioration
                </button>
                <button
                  onClick={() => setActiveScenarioTab('scenario_b')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeScenarioTab === 'scenario_b'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Scenario B: Exertion Spike
                </button>
              </div>
            </div>

            {/* Recharts Anomaly Curves */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#94a3b8" 
                    tickFormatter={(val) => `FD ${val}`}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis 
                    domain={[0, 1.05]} 
                    stroke="#94a3b8" 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                  />
                  <Tooltip content={<CustomMLTooltip />} />
                  
                  {/* Alert Threshold Guideline */}
                  <ReferenceLine y={0.5} stroke="#d97706" strokeDasharray="4 4" label={{ value: 'ML Threshold (50%)', fill: '#d97706', fontSize: 10, position: 'right' }} />

                  {/* Isolation Forest Curve */}
                  <Line 
                    type="monotone" 
                    dataKey="isolation_forest_score" 
                    stroke="#0284c7" 
                    strokeWidth={2} 
                    dot={{ fill: '#0284c7', r: 3 }}
                    name="Isolation Forest Probability"
                  />

                  {/* Local Outlier Factor Curve */}
                  <Line 
                    type="monotone" 
                    dataKey="lof_score" 
                    stroke="#9333ea" 
                    strokeWidth={2} 
                    strokeDasharray="4 4"
                    dot={{ fill: '#9333ea', r: 3 }}
                    name="LOF Outlier Factor"
                  />

                  {/* Rule-Based Trigger Step Indicator */}
                  <Line 
                    type="stepAfter" 
                    dataKey={(d: DailyAnomalyScore) => d.rule_based_alert ? 1.0 : 0.0} 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={false}
                    name="Rule-Based Alert Active"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
                  <span>Isolation Forest</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-purple-600 inline-block" />
                  <span>LOF Density</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 bg-emerald-600 inline-block" />
                  <span>Rule-Based Alert</span>
                </span>
              </div>
              <span>
                Window: {chartData.length} Flight Days
              </span>
            </div>
          </div>

          {/* NASA Recommendations */}
          <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Synthesis &amp; Recommendations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.synthesis_conclusions.map((conc, i) => (
                <div key={i} className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 leading-relaxed">{conc}</p>
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
      <div className="bg-white border border-slate-200 p-3 rounded-md shadow-lg font-mono text-xs max-w-xs text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1.5">
          <span className="font-bold">Flight Day {data.day}</span>
          <span className="text-[10px] text-slate-400">{data.date}</span>
        </div>

        {data.context_event && (
          <div className="mb-1.5 text-[10px] text-[#0b3d91] font-semibold">
            {data.context_event}
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between items-center text-emerald-700">
            <span>Rule-Based:</span>
            <span className="font-bold">{data.rule_based_alert ? 'ALERT' : 'NOMINAL'}</span>
          </div>

          <div className="flex justify-between items-center text-sky-700">
            <span>Iso Forest:</span>
            <span className="font-bold">{(data.isolation_forest_score * 100).toFixed(1)}%</span>
          </div>

          <div className="flex justify-between items-center text-purple-700">
            <span>LOF Score:</span>
            <span className="font-bold">{(data.lof_score * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
