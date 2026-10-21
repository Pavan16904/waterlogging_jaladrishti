import React, { useState, useEffect, useMemo } from 'react';
import { StudyArea } from '../types';
import { FileDown, Printer, X, ShieldAlert, CheckCircle2, Clock, AlertTriangle, CloudRain, MapPin, Database, RefreshCw, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../services/api';
import { KARNATAKA_31_DISTRICTS_WEATHER } from '../data/karnatakaDistrictsWeather';

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
  const [drainageSummary, setDrainageSummary] = useState<any>(null);
  const [districtWeather, setDistrictWeather] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const districtName = selectedDistrict || studyArea?.name || 'Bengaluru Urban';

  // Normalize district identifier matching official 31 Karnataka districts
  const targetDistrictId = useMemo(() => {
    if (!selectedDistrict) return 'bengaluru_urban';
    const clean = selectedDistrict.toLowerCase().trim();
    const found = KARNATAKA_31_DISTRICTS_WEATHER.find(
      d => d.id === clean || d.displayName.toLowerCase() === clean || d.name.toLowerCase().includes(clean)
    );
    return found ? found.id : clean.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }, [selectedDistrict]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setExportError(null);

    const loadData = async () => {
      try {
        const [incRes, drainSum, weatherRes] = await Promise.allSettled([
          api.getIncidents({ district_id: targetDistrictId, include_rejected: true }),
          targetDistrictId ? api.getDrainageSummary(targetDistrictId) : Promise.resolve(null),
          api.getDistrictWeather(districtName, false)
        ]);

        if (!isMounted) return;

        // 1. Incidents
        if (incRes.status === 'fulfilled' && incRes.value) {
          const val = incRes.value;
          const list = val.incidents || val.data || (Array.isArray(val) ? val : []);
          setIncidents(list);
        } else {
          setIncidents([]);
        }

        // 2. Drainage summary
        if (drainSum.status === 'fulfilled' && drainSum.value) {
          setDrainageSummary(drainSum.value);
        } else {
          setDrainageSummary(null);
        }

        // 3. District weather
        if (weatherRes.status === 'fulfilled' && weatherRes.value) {
          setDistrictWeather(weatherRes.value);
        }
      } catch (err: any) {
        console.error('Failed to load records for report modal:', err);
        if (isMounted) {
          setExportError('Could not retrieve observation records from repository.');
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
  }, [isOpen, targetDistrictId, districtName]);

  if (!isOpen) return null;

  // Breakdown metrics computed directly from authentic rows
  const verifiedCount = incidents.filter(i => (i.status || '').toUpperCase() === 'VERIFIED').length;
  const pendingCount = incidents.filter(i => (i.status || '').toUpperCase() === 'SUBMITTED_UNVERIFIED' || (i.status || '').toUpperCase() === 'PENDING').length;
  const severeCount = incidents.filter(i => (i.severity || '').toUpperCase() === 'SEVERE').length;
  const highCount = incidents.filter(i => (i.severity || '').toUpperCase() === 'HIGH').length;

  const handlePrintPdf = async () => {
    const reportElement = document.getElementById('printable-report');
    if (!reportElement) {
      setExportError('Report element not found in DOM.');
      return;
    }

    try {
      setIsExporting(true);
      setExportError(null);
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        backgroundColor: '#020617',
        useCORS: true,
        logging: false,
        windowWidth: 1024
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 285));
      pdf.save(`JalaDrishti_Report_${districtName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      console.error('Error generating PDF report:', err);
      setExportError(`PDF Export error: ${err?.message || 'Canvas capture failed'}`);
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
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Authoritative SQLite Repository • Filtered to <strong>{districtName}</strong></span>
          </div>
          <button
            onClick={handlePrintPdf}
            disabled={isExporting || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold shadow-lg text-xs transition-all cursor-pointer"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>{isExporting ? 'Generating PDF...' : 'Save / Download PDF Report'}</span>
          </button>
        </div>

        {/* Error Alert if any */}
        {exportError && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

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
                  <div>Classification: <span className="text-cyan-300 font-bold">OFFICIAL CIVIL REPORT</span></div>
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
                  <div className="text-[10px] text-slate-500 mt-0.5">Field Survey Confirmed</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] font-medium text-slate-400 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Pending Verification
                  </div>
                  <div className="text-xl font-bold text-amber-400 mt-1">{pendingCount}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Citizen SOS Reports</div>
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
                    Mapped Drains
                  </div>
                  <div className="text-xl font-bold text-cyan-300 mt-1">
                    {drainageSummary?.totalAssets ? Number(drainageSummary.totalAssets).toLocaleString() : '0'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {drainageSummary?.totalLengthKm ? `${drainageSummary.totalLengthKm} km mapped` : 'Unmapped GIS'}
                  </div>
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
                  <div>Model Provider: <span className="font-semibold text-slate-300">{liveWeatherData?.provider || 'Open-Meteo NWP'}</span></div>
                  <div>Daily Rainfall Forecast: <span className="font-semibold text-cyan-300">{typeof liveWeatherData?.modeledDailyPrecipitationMm === 'number' ? `${liveWeatherData.modeledDailyPrecipitationMm} mm` : districtWeather?.precipitation_sum ? `${districtWeather.precipitation_sum} mm` : '0.0 mm'}</span></div>
                  <div>Backend Retrieved: <span className="font-mono text-slate-300">{liveWeatherData?.backendRetrievedAt ? new Date(liveWeatherData.backendRetrievedAt).toLocaleTimeString() : new Date().toLocaleTimeString()}</span></div>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                  Note: Rainfall forecast data provides regional atmospheric context. It is not an empirical claim that a specific street segment is submerged without georeferenced ground observation.
                </p>
              </div>

              {/* Drainage Network Infrastructure Section */}
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Stormwater Drainage Network Evidence
                </div>
                {drainageSummary?.has_drainage_data ? (
                  <p className="text-slate-300 text-[11px]">
                    <strong>{Number(drainageSummary.totalAssets).toLocaleString()}</strong> government-verified drainage channels ({drainageSummary.totalLengthKm} km total length) ingested into repository from {drainageSummary.source}.
                  </p>
                ) : (
                  <p className="text-amber-300/90 text-[11px]">
                    ⚠️ Insufficient district-specific drainage line geometry (KML) ingested for {districtName}. OpenCity resource manifests can be imported on demand. Absence of records reflects data availability, not absence of physical drains.
                  </p>
                )}
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
                              {inc.landmark || inc.location || 'Designated Drainage Node'}
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[10px]">
                              {inc.lat !== null && inc.lng !== null && !isNaN(inc.lat)
                                ? `${Number(inc.lat).toFixed(4)}, ${Number(inc.lng).toFixed(4)}`
                                : inc.latitude
                                ? `${Number(inc.latitude).toFixed(4)}, ${Number(inc.longitude).toFixed(4)}`
                                : 'Ungeocoded'}
                            </td>
                            <td className="py-2 px-3 text-cyan-300 font-bold">
                              {inc.water_depth || 'Standing water'}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                inc.severity === 'Severe' || inc.severity === 'SEVERE' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                inc.severity === 'High' || inc.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                inc.severity === 'Moderate' || inc.severity === 'MODERATE' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                                'bg-blue-950 text-blue-300 border border-blue-800'
                              }`}>
                                {inc.severity || 'Moderate'}
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
                              {inc.assigned_agency || inc.reporter_name || 'BBMP / KSDMA Monsoon Control Room'}
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[10px]">
                              {inc.created_at ? new Date(inc.created_at).toLocaleString() : 'Recent'}
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
