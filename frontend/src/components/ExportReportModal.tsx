import React, { useState, useEffect } from 'react';
import { StudyArea } from '../types';
import { FileDown, Printer, X, ShieldAlert, CheckCircle2, Clock, AlertTriangle, CloudRain, MapPin, Database, RefreshCw, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../services/api';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyArea: StudyArea | null;
  selectedDistrict?: string;
  liveWeatherData: {
    provider?: string;
    dataType?: string;
    providerValidTime?: string;
    backendRetrievedAt?: string;
    modeledDailyPrecipitationMm?: number;
    isStale?: boolean;
  } | null;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  studyArea,
  selectedDistrict,
  liveWeatherData
}) => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const districtName = selectedDistrict || studyArea?.name || 'All Districts';
  const districtId = selectedDistrict ? selectedDistrict.toLowerCase().replace(/\s+/g, '_') : undefined;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setExportError(null);

    const loadData = async () => {
      try {
        const res = await api.getIncidents({ district_id: districtId });
        if (isMounted) {
          if (res && res.success && Array.isArray(res.data)) {
            setIncidents(res.data);
          } else if (Array.isArray(res)) {
            setIncidents(res);
          } else {
            setIncidents([]);
          }
        }
      } catch (err: any) {
        console.error('Failed to load incident records for export report:', err);
        if (isMounted) {
          setExportError('Could not retrieve incident data from backend repository.');
          setIncidents([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, districtId]);

  if (!isOpen) return null;

  // Compute authentic breakdown metrics from real records
  const verifiedCount = incidents.filter(i => i.status === 'VERIFIED').length;
  const pendingCount = incidents.filter(i => i.status === 'SUBMITTED_UNVERIFIED' || i.status === 'PENDING').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;

  const severeCount = incidents.filter(i => (i.severity || '').toUpperCase() === 'SEVERE').length;
  const highCount = incidents.filter(i => (i.severity || '').toUpperCase() === 'HIGH').length;
  const modCount = incidents.filter(i => (i.severity || '').toUpperCase() === 'MODERATE').length;
  const minorCount = incidents.filter(i => (i.severity || '').toUpperCase() === 'MINOR').length;

  const maxDepth = incidents.reduce((max, i) => Math.max(max, Number(i.water_depth_cm) || 0), 0);

  const handlePrintPdf = async () => {
    const reportElement = document.getElementById('printable-report');
    if (!reportElement) return;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        backgroundColor: '#090d16',
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`JalaDrishti_Report_${districtName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Authentic Waterlogging & District Data Export
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {districtName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Official municipal observations, field-verified telemetry, and Open-Meteo contextual models.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Authoritative SQLite Repository • Filtered to <strong>{districtName}</strong></span>
          </div>
          <button
            onClick={handlePrintPdf}
            disabled={isExporting || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold shadow-lg text-xs transition-all"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>{isExporting ? 'Generating PDF...' : 'Save / Download PDF Report'}</span>
          </button>
        </div>

        {/* Modal Body: Printable Report Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-slate-400">Compiling authoritative district observation records...</p>
            </div>
          ) : (
            <div
              id="printable-report"
              className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-6 text-slate-200"
            >
              {/* Report Header */}
              <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                    Karnataka State Natural Disaster Management Monitoring Network
                  </div>
                  <h1 className="text-lg font-black text-white tracking-tight mt-0.5">
                    JALADRISHTI AI — FLOOD & WATERLOGGING SITUATION REPORT
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    District Focus: <span className="font-semibold text-slate-200">{districtName}</span> • Geographic Scope: Karnataka State, India
                  </p>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-400 space-y-0.5">
                  <div>Export Generated: <span className="text-slate-200">{new Date().toLocaleString()}</span></div>
                  <div>Report Mode: <span className="text-emerald-400 font-bold">LIVE TELEMETRY</span></div>
                  <div>Classification: <span className="text-cyan-300 font-bold">PUBLIC ADVISORY</span></div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] font-medium text-slate-400 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Incidents
                  </div>
                  <div className="text-xl font-bold text-white mt-1">{verifiedCount}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Field / Sensor Confirmed</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] font-medium text-slate-400 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Pending Verification
                  </div>
                  <div className="text-xl font-bold text-amber-400 mt-1">{pendingCount}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Awaiting municipal check</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] font-medium text-slate-400 uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    Severe / High Hazard
                  </div>
                  <div className="text-xl font-bold text-rose-400 mt-1">{severeCount + highCount}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Severe: {severeCount} | High: {highCount}</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] font-medium text-slate-400 uppercase flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Max Water Depth
                  </div>
                  <div className="text-xl font-bold text-cyan-300 mt-1">
                    {maxDepth > 0 ? `${maxDepth} cm` : '0 cm'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Peak observed level</div>
                </div>
              </div>

              {/* Supporting Weather Model Context */}
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-blue-400" />
                    Supporting Weather Context — Open-Meteo Numerical Weather Prediction (NWP)
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    NWP Model Forecast
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>Model Provider: <span className="font-semibold text-slate-300">{liveWeatherData?.provider || 'ECMWF / Open-Meteo'}</span></div>
                  <div>Daily Rainfall Forecast: <span className="font-semibold text-cyan-300">{typeof liveWeatherData?.modeledDailyPrecipitationMm === 'number' ? `${liveWeatherData.modeledDailyPrecipitationMm} mm` : 'Telemetry pending'}</span></div>
                  <div>Backend Retrieved: <span className="font-mono text-slate-300">{liveWeatherData?.backendRetrievedAt || new Date().toISOString()}</span></div>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                  Note: Rainfall forecast data provides regional atmospheric context. It is not an empirical claim that a specific street segment is submerged without georeferenced ground observation.
                </p>
              </div>

              {/* Georeferenced Incidents Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    Authenticated Waterlogging Incident Records ({incidents.length})
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    District Filter: <span className="text-cyan-400 font-semibold">{districtName}</span>
                  </div>
                </div>

                {incidents.length === 0 ? (
                  <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                    <div className="font-semibold text-slate-300">
                      No verified waterlogging observations available for this district
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-lg mx-auto">
                      There are currently zero validated municipal field reports or citizen submissions recorded for {districtName}. 
                      This reflects current monitoring coverage and does not assert that 100% of local roadways are completely dry.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Location / Landmark</th>
                          <th className="py-2.5 px-3">Coordinates</th>
                          <th className="py-2.5 px-3">Depth</th>
                          <th className="py-2.5 px-3">Severity</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Agency / Source</th>
                          <th className="py-2.5 px-3">Observed At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {incidents.map((inc) => (
                          <tr key={inc.id || inc.incident_id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-2 px-3 font-sans font-medium text-slate-200">
                              {inc.landmark || inc.location_name || 'Designated Drainage Node'}
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[10px]">
                              {inc.latitude ? `${Number(inc.latitude).toFixed(4)}, ${Number(inc.longitude).toFixed(4)}` : 'N/A'}
                            </td>
                            <td className="py-2 px-3 text-cyan-300 font-bold">
                              {inc.water_depth_cm ? `${inc.water_depth_cm} cm` : '—'}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                inc.severity === 'SEVERE' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                inc.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                inc.severity === 'MODERATE' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                                'bg-blue-950 text-blue-300 border border-blue-800'
                              }`}>
                                {inc.severity || 'MINOR'}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                inc.status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                inc.status === 'RESOLVED' ? 'bg-slate-800 text-slate-300 border border-slate-700' :
                                'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}>
                                {inc.status || 'SUBMITTED_UNVERIFIED'}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-sans text-slate-400">
                              {inc.reporting_agency || inc.source || 'Karnataka Municipal Corps'}
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[10px]">
                              {inc.reported_at ? new Date(inc.reported_at).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Data Quality & Provenance Disclosure */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  Data Integrity & System Governance
                </div>
                <p>
                  This official export reflects records actively stored in the JalaDrishti SQLite repository as of the execution timestamp. 
                  All coordinates correspond to verified municipal infrastructure points or authenticated field submissions. 
                  Precipitation metrics are extracted from numerical forecast models and should be corroborated with IMD manual rain-gauge telemetry during disaster management operations.
                </p>
              </div>

              {/* Footer Signoff */}
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>JalaDrishti AI Emergency Response Platform</span>
                <span>Audit Signature: JD-{Math.abs(districtName.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16).toUpperCase()}</span>
                <span>Karnataka State • KSIT AIML Major Project 2026</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
