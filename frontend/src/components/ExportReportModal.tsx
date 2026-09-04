import React from 'react';
import { AnalysisRun, SeverityZone, DrainageAdvisory, StudyArea } from '../types';
import { 
  X, 
  FileDown, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  Building2, 
  Users, 
  Calendar,
  AlertTriangle
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyArea: StudyArea | null;
  run: AnalysisRun | null;
  zones: SeverityZone[];
  advisories: DrainageAdvisory[];
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  studyArea,
  run,
  zones,
  advisories
}) => {
  if (!isOpen) return null;

  const runId = run?.id || 'run_blr_postmonsoon_2026';

  const handleDownloadCsv = () => {
    window.open(`/api/reports/csv/${runId}`, '_blank');
  };

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
                Official Engineering & Academic Report Exporter
              </h3>
              <p className="text-xs text-slate-400">
                Export municipal flood mitigation schedules, GIS layers, and project viva documentation
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
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Download CSV Dataset</span>
            </button>
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
                SATELLITE-BASED FLOOD INUNDATION & DRAINAGE ADVISORY SYSTEM
              </h2>
              <p className="text-xs font-semibold text-slate-300">
                AI-Based Waterlogging Detection Using Multi-Source Satellite Imagery
              </p>
              <div className="pt-2 flex justify-center items-center gap-4 text-[10px] text-slate-400 font-mono">
                <span>JalaDrishti AI Platform</span>
                <span>•</span>
                <span>Sentinel-1 SAR + Sentinel-2 Optical + DEM</span>
              </div>
            </div>

            {/* Event Summary Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
              <div>
                <span className="text-slate-400 block text-[10px]">Study Catchment Basin:</span>
                <p className="font-bold text-white text-sm">{studyArea?.name} ({studyArea?.state_region})</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Analysis Time Window:</span>
                <p className="font-mono text-cyan-300">{run?.pre_event_date || '2026-06-10'} to {run?.post_event_date || '2026-08-25'}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Event Rainfall Recorded:</span>
                <p className="font-mono font-bold text-blue-300">{run?.rainfall_mm || 78.5} mm</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Primary AI Classifier:</span>
                <p className="font-semibold text-purple-300 uppercase">{run?.model_type || 'Random Forest'}</p>
              </div>
            </div>

            {/* Inundation Statistics Table */}
            <div className="space-y-2">
              <span className="font-bold text-slate-100 text-xs uppercase tracking-wider block">
                Spatial Inundation & Hydrologic Metrics
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Total Area Analyzed</span>
                  <span className="text-base font-bold text-slate-200 font-mono">{(run?.total_area_km2 || 42.5).toFixed(1)} km²</span>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Waterlogged Area</span>
                  <span className="text-base font-bold text-cyan-400 font-mono">{(run?.waterlogged_area_km2 || 9.4).toFixed(1)} km²</span>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Critical P1 Severity Zones</span>
                  <span className="text-base font-bold text-rose-400 font-mono">{run?.severe_count || 3} zones</span>
                </div>
              </div>
            </div>

            {/* Actionable Drainage Advisories */}
            <div className="space-y-2">
              <span className="font-bold text-slate-100 text-xs uppercase tracking-wider block">
                Priority Remediation & Engineering Advisories
              </span>
              <div className="space-y-2">
                {advisories.slice(0, 4).map((adv) => (
                  <div key={adv.id} className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-100">{adv.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {adv.priority}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]"><span className="text-slate-400 font-semibold">Action:</span> {adv.action_recommendation}</p>
                  </div>
                ))}
              </div>
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
