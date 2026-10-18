import React from 'react';
import { StudyArea } from '../types';
import { FileDown, Printer, X } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyArea: StudyArea | null;
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
  liveWeatherData
}) => {
  if (!isOpen) return null;

  const handlePrintPdf = async () => {
    const reportElement = document.getElementById('printable-report');
    if (!reportElement) return;

    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        backgroundColor: '#0f172a'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Waterlogging_Advisory_Report_${studyArea?.id || 'study_area'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel-glow w-full max-w-3xl rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Data Export
              </h3>
              <p className="text-xs text-slate-400">
                Export currently available source data. This is not an official incident or engineering report.
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

        {/* Modal Body: Printable Report Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Download Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pb-3 border-b border-slate-800">
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-glow-cyan transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Save / Download PDF Report</span>
            </button>
          </div>

          {/* Printable Report Canvas */}
          <div
            id="printable-report"
            className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6 text-slate-200"
          >
            {/* Academic Header Banner */}
            <div className="text-center pb-4 border-b border-slate-700/80 space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
                JalaDrishti AI Systems
              </span>
              <h2 className="text-xs font-bold text-slate-200 tracking-wider">
                FLOOD AND DRAINAGE DATA AVAILABILITY REPORT
              </h2>
              <p className="text-xs font-semibold text-slate-300">
                Currently available external data; no verified spatial analysis is connected
              </p>
              <div className="pt-2 flex justify-center items-center gap-4 text-[10px] text-slate-400 font-mono">
                <span>JalaDrishti AI Platform</span>
                <span>•</span>
                <span>Verified flood-observation feed unavailable</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] space-y-1">
              <div className="font-bold text-amber-200">Spatial analysis unavailable</div>
              <p className="text-slate-300">
                No verified georeferenced flood observations, imagery, or field inputs are connected. Historical generated zones and advisories are excluded from this export.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-[11px] space-y-1">
              <div className="font-bold text-slate-200">Current weather-model data</div>
              {liveWeatherData ? (
                <>
                  <div>District: {studyArea?.name || 'Unavailable'}</div>
                  <div>Provider: {liveWeatherData.provider || 'Open-Meteo / ECMWF NWP'} · Type: {liveWeatherData.dataType || 'Numerical weather model output, not a ground observation'}</div>
                  <div>Model valid time: {liveWeatherData.providerValidTime || 'Unavailable'} · Backend retrieved: {liveWeatherData.backendRetrievedAt || 'Unavailable'}</div>
                  <div>Modelled daily precipitation: {typeof liveWeatherData.modeledDailyPrecipitationMm === 'number' ? `${liveWeatherData.modeledDailyPrecipitationMm} mm` : 'Unavailable'} · Status: {liveWeatherData.isStale ? 'STALE' : 'FORECAST'}</div>
                </>
              ) : (
                <div>Weather-model data is unavailable; no current value or timestamp is substituted.</div>
              )}
            </div>

            {/* Footer Signoff */}
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Report Generated: {new Date().toLocaleDateString()}</span>
              <span>AeroHydro AI • KSIT AIML Major Project 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
