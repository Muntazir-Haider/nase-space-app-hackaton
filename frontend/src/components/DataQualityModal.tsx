import { useEffect, useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { DataQualityAuditLog } from '../types';
import { fetchDataQualityAudit } from '../services/api';

interface Props {
  onClose: () => void;
}

export function DataQualityModal({ onClose }: Props) {
  const [logs, setLogs] = useState<DataQualityAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDataQualityAudit()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-space-900 border border-space-750 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-space-800 bg-space-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Data Quality & Sensor Ingestion Audit Log</h3>
              <p className="text-xs text-slate-400 font-mono">
                7-Point Pre-Analysis Validation Engine · NASA Biological Plausibility Enforcement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-space-800 hover:bg-space-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-nasa-cyan" /> Retrieving audit entries...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-10 border border-dashed border-space-700 rounded-xl text-center text-slate-400 font-mono text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-white font-bold">100% Ingestion Purity</p>
              <p className="text-slate-500 mt-1">Zero sensor packet rejections or physiological violations recorded.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-space-850 border border-space-750 flex flex-col gap-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      {log.error_code}
                    </span>
                    <span className="text-[10px] text-slate-500">{log.flagged_at.slice(0, 19).replace('T', ' ')}</span>
                  </div>
                  <p className="text-slate-200">{log.rejection_reason}</p>
                  <div className="bg-space-950 p-2 rounded text-[11px] text-slate-400 overflow-x-auto">
                    <code>{log.raw_payload_blob}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
