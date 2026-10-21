import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  X, 
  Clock, 
  MapPin, 
  Zap,
  CheckCircle2,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { LiveAlert } from '../types';
import { api } from '../services/api';
import { KARNATAKA_31_DISTRICTS_WEATHER } from '../data/karnatakaDistrictsWeather';

interface EmergencyOpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: LiveAlert[];
  selectedDistrict?: string;
  onRefreshAlerts?: () => void;
}

export const EmergencyOpsModal: React.FC<EmergencyOpsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  selectedDistrict,
  onRefreshAlerts,
}) => {
  const [districtFilter, setDistrictFilter] = useState<string>(selectedDistrict || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionMessage, setResolutionMessage] = useState<string | null>(null);

  // Distinct districts actually having incidents in the store
  const districtsWithIncidents = useMemo(() => {
    const s = new Set<string>();
    alerts.forEach((a) => {
      if (a.districtId) s.add(a.districtId.toLowerCase().trim());
      else if (a.district) s.add(a.district.toLowerCase().trim());
    });
    return s.size;
  }, [alerts]);

  // Filter alerts by selected district and status
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // 1. District filter
      if (districtFilter && districtFilter !== 'ALL') {
        const q = districtFilter.toLowerCase().trim();
        const matchesDist =
          (a.districtId && a.districtId.toLowerCase().includes(q)) ||
          (a.district && a.district.toLowerCase().includes(q));
        if (!matchesDist) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'ALL') {
        const st = (a.status || 'SUBMITTED_UNVERIFIED').toUpperCase();
        if (statusFilter === 'VERIFIED' && st !== 'VERIFIED') return false;
        if (statusFilter === 'PENDING' && st !== 'SUBMITTED_UNVERIFIED' && st !== 'PENDING') return false;
        if (statusFilter === 'IN_PROGRESS' && st !== 'IN_PROGRESS') return false;
        if (statusFilter === 'RESOLVED' && st !== 'RESOLVED') return false;
      }

      return true;
    });
  }, [alerts, districtFilter, statusFilter]);

  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const selectedAlert = useMemo(() => {
    if (selectedAlertId) {
      const found = filteredAlerts.find((a) => a.id === selectedAlertId);
      if (found) return found;
    }
    return filteredAlerts[0] || null;
  }, [filteredAlerts, selectedAlertId]);

  if (!isOpen) return null;

  const handleResolveIncident = async (incidentId: string) => {
    setResolvingId(incidentId);
    setResolutionMessage(null);
    try {
      const res = await api.updateIncidentStatus(incidentId, 'RESOLVED');
      if (res && res.success) {
        setResolutionMessage(`Incident ${incidentId} marked as RESOLVED in database.`);
        onRefreshAlerts?.();
      } else {
        setResolutionMessage('Could not update status. Please try again.');
      }
    } catch (err: any) {
      setResolutionMessage(err?.response?.data?.error || err.message || 'Error updating status.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-500/30 overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black tracking-tight">Emergency Operations Center (EOC)</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-extrabold text-[10px] uppercase tracking-wider">
                  Operational Store Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All 31 Karnataka districts available in registry • <strong>{districtsWithIncidents}</strong> districts currently have active field/SOS records ({alerts.length} total incidents).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setSelectedAlertId(null);
                }}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">Verified Only</option>
                <option value="PENDING">Pending Verification</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            {/* District Filter Dropdown with 31 Official Districts */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setSelectedAlertId(null);
                }}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL">All 31 Districts ({alerts.length} Incidents)</option>
                {KARNATAKA_31_DISTRICTS_WEATHER.map((d) => {
                  const q = d.id.toLowerCase();
                  const count = alerts.filter(
                    (a) => (a.districtId && a.districtId.toLowerCase().includes(q)) ||
                           (a.district && a.district.toLowerCase().includes(q))
                  ).length;
                  return (
                    <option key={d.id} value={d.id}>
                      {d.displayName} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Active Inundation Alerts List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span>Incident Queue ({filteredAlerts.length})</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                {districtsWithIncidents} Districts Represented
              </span>
            </div>

            {resolutionMessage && (
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-500" />
                <span>{resolutionMessage}</span>
              </div>
            )}

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredAlerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                  <p className="font-bold text-slate-600 dark:text-slate-300">
                    No active critical incidents for {districtFilter === 'ALL' ? 'selected filter' : districtFilter}.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select "All Karnataka Districts" or switch district filter above.
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const isSelected = selectedAlert?.id === alert.id;
                  return (
                    <button
                      key={alert.id}
                      onClick={() => setSelectedAlertId(alert.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-white shadow-md'
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
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Logged'}
                        </span>
                      </div>

                      <div className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {alert.title}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#1d6fd8] shrink-0" />
                          <span>{alert.district}</span>
                        </div>
                        <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          alert.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/30'
                            : alert.status === 'RESOLVED'
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : alert.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-500/30'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-500/30'
                        }`}>
                          {alert.status === 'VERIFIED' ? '✓ VERIFIED' : alert.status === 'RESOLVED' ? 'RESOLVED' : alert.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'PENDING CHECK'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Incident Detail & Operational Action */}
          <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            {selectedAlert ? (
              <div className="space-y-4 text-xs">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 block mb-0.5">
                      INCIDENT RECORD: {selectedAlert.id}
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedAlert.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      District Jurisdiction: {selectedAlert.district}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                {/* Diagnosis & Telemetry */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Observation Telemetry:</span>
                    <span className="rounded bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Authoritative Field Observation
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                    {selectedAlert.message}
                  </p>
                  <div className="pt-1 text-[11px] text-slate-400 flex flex-wrap gap-4 font-mono">
                    <span>Logged At: {new Date(selectedAlert.timestamp).toLocaleString()}</span>
                    <span>Status: <strong className="text-slate-700 dark:text-slate-200">{selectedAlert.status || 'VERIFIED'}</strong></span>
                  </div>
                </div>

                {/* Mandated Emergency Action */}
                <div className="p-3.5 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <span className="font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" /> Recommended Civil / Drainage Action:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {selectedAlert.action}
                  </p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span className="font-bold">Lead Response Agency: </span>{selectedAlert.agency}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 max-w-sm">
                    Automated CAD dispatch is not connected. Civil protocols must be phoned to field engineers or control room.
                  </p>

                  <button
                    type="button"
                    disabled={resolvingId === selectedAlert.id}
                    onClick={() => handleResolveIncident(selectedAlert.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {resolvingId === selectedAlert.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Status...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Resolved</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300">No Incident Selected</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Select an incident from the left queue to view telemetry and emergency drainage action.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
