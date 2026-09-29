import React, { useState } from 'react';
import { 
  ShieldAlert, 
  X, 
  AlertTriangle, 
  Radio, 
  PhoneCall, 
  Send, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Truck, 
  Users, 
  FileText, 
  Printer, 
  Download,
  Flame,
  Droplets,
  Zap
} from 'lucide-react';
import { LiveAlert, IoTSensor } from '../types';

interface EmergencyOpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: LiveAlert[];
  sensors: IoTSensor[];
}

export const EmergencyOpsModal: React.FC<EmergencyOpsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  sensors
}) => {
  const [selectedAlert, setSelectedAlert] = useState<LiveAlert | null>(alerts[0] || null);
  const [dispatchedAlerts, setDispatchedAlerts] = useState<Set<string>>(new Set());
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDispatch = (alertId: string) => {
    setDispatchedAlerts(prev => new Set(prev).add(alertId));
    setDispatchSuccess(`Emergency Crew & Mobile 150HP Pumps Dispatched to ${selectedAlert?.district || 'Sector'}!`);
    setTimeout(() => setDispatchSuccess(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

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
                  STATE DISASTER LEVEL 2
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Karnataka State Natural Disaster Monitoring Centre (KSNDMC) & SDRF Incident Response
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

        {/* Dispatch Notification Banner */}
        {dispatchSuccess && (
          <div className="px-6 py-2.5 bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{dispatchSuccess}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Active Inundation Alerts List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span>Active Incident Queue ({alerts.length})</span>
              <span className="text-cyan-400 font-mono">Live Sync</span>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {alerts.map((alert) => {
                const isSelected = selectedAlert?.id === alert.id;
                const isDispatched = dispatchedAlerts.has(alert.id);

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
                      {isDispatched && (
                        <span className="ml-auto text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Dispatched
                        </span>
                      )}
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

                {/* Required Resources Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Equipment Allocated</span>
                      <span className="font-bold text-slate-800 dark:text-white font-mono">2x 150HP Pumps + Jetter</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Response Crew</span>
                      <span className="font-bold text-slate-800 dark:text-white font-mono">SDRF Team 4 (8 Personnel)</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Dispatch Order</span>
                  </button>

                  <button
                    disabled={dispatchedAlerts.has(selectedAlert.id)}
                    onClick={() => handleDispatch(selectedAlert.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
                      dispatchedAlerts.has(selectedAlert.id)
                        ? 'bg-emerald-600 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/30 active:scale-95'
                    }`}
                  >
                    {dispatchedAlerts.has(selectedAlert.id) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Crew Dispatched</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Deploy Emergency Crew</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Select an alert from the incident queue to view details.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
