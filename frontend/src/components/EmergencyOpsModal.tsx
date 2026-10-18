import React, { useState } from 'react';
import { 
  ShieldAlert, 
  X, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Zap
} from 'lucide-react';
import { LiveAlert } from '../types';

interface EmergencyOpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: LiveAlert[];
}

export const EmergencyOpsModal: React.FC<EmergencyOpsModalProps> = ({
  isOpen,
  onClose,
  alerts,
}) => {
  const [selectedAlert, setSelectedAlert] = useState<LiveAlert | null>(alerts[0] || null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-500/30 overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black tracking-tight">Emergency Operations Center (EOC)</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] uppercase tracking-wider animate-pulse">
                  INCIDENT FEED UNAVAILABLE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No verified official incident or dispatch integration is connected.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Active Inundation Alerts List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span>Verified Incident Queue ({alerts.length})</span>
              <span className="text-amber-500 font-mono">Unavailable</span>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {alerts.map((alert) => {
                const isSelected = selectedAlert?.id === alert.id;
                return (
                  <button
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500 text-rose-400 dark:text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        alert.level === 'CRITICAL'
                          ? 'bg-red-500 text-white'
                          : alert.level === 'WARNING'
                          ? 'bg-amber-500 text-white'
                          : 'bg-cyan-600 text-white'
                      }`}>
                        {alert.level}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {alert.title}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{alert.district}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Incident Detail & Dispatch Generator */}
          <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            {selectedAlert ? (
              <div className="space-y-4 text-xs">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 block mb-0.5">INCIDENT ID: {selectedAlert.id}</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedAlert.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">Target District: {selectedAlert.district}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                {/* Diagnosis & Telemetry */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Telemetry Diagnostic:</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                    {selectedAlert.message}
                  </p>
                </div>

                {/* Mandated Emergency Action */}
                <div className="p-3.5 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <span className="font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" /> Recommended Civil Action:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {selectedAlert.action}
                  </p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span className="font-bold">Lead Agency: </span>{selectedAlert.agency}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Dispatch is unavailable until connected to an authorized operations system.
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No verified incident feed is connected. No dispatch actions or incidents are available.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
