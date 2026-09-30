import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  Droplets, 
  Zap, 
  Radio, 
  Clock, 
  CheckSquare, 
  Square, 
  Printer, 
  Download, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrecautionProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  earlyWarningData: any;
  districtName: string;
}

export const PrecautionProtocolModal: React.FC<PrecautionProtocolModalProps> = ({
  isOpen,
  onClose,
  earlyWarningData,
  districtName
}) => {
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const earlyWarning = earlyWarningData?.earlyWarning || {};
  const precautions: any[] = earlyWarningData?.precautions || [];

  const toggleAction = (key: string) => {
    setCheckedActions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/30 shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border-b border-cyan-500/20 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-black uppercase tracking-wider border border-cyan-500/30">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Pre-Flood Action Matrix
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {districtName} Catchment
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Advance Waterlogging Precaution Protocol</span>
            </h2>
            <p className="text-xs text-slate-300">
              Prioritized preventative engineering actions to execute <strong className="text-cyan-400 font-bold">BEFORE</strong> storm rainfall accumulates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="Print Action Order"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Print Work Order</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Predictive Early Warning Alert Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            earlyWarning.alertLevel?.includes('RED')
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : earlyWarning.alertLevel?.includes('AMBER')
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-white/10 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-black/40">
                    {earlyWarning.alertLevel || 'EARLY WARNING ACTIVE'}
                  </span>
                  <span className="text-[11px] font-semibold text-white">
                    Peak Storm Expected in: <strong className="text-cyan-400">{earlyWarning.hoursUntilPeak || 2} Hour(s)</strong>
                  </span>
                </div>
                <p className="text-sm font-bold text-white mt-1">
                  {earlyWarning.earlyWarningHeadline || 'Heavy rainfall cell tracked on Doppler Radar.'}
                </p>
                <p className="text-[11px] text-slate-300">
                  Anticipated Inundation Depth at Lowland Sumps: <strong className="text-white">{earlyWarning.predictedInundationDepthCm || '25 - 50 cm'}</strong>
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-white/10 sm:pl-4 self-stretch flex sm:flex-col justify-between items-end">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Peak Downpour Rate</span>
                <span className="font-mono font-black text-base text-cyan-300">
                  {earlyWarning.peakRateMmH || 14.5} mm/h
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">24h Anticipated Total</span>
                <span className="font-mono font-black text-sm text-white">
                  {earlyWarning.total24hPrecipMm || 38.0} mm
                </span>
              </div>
            </div>
          </div>

          {/* Action Checklist Categories */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center justify-between">
              <span>Standard Operating Precautions (Prioritized by Authority)</span>
              <span className="text-[10px] font-normal text-slate-400">
                Check off items as field response teams deploy
              </span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {precautions.map((cat, catIdx) => (
                <div 
                  key={catIdx}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <h4 className="font-extrabold text-sm text-white">{cat.category}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase font-mono">
                        {cat.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {cat.timeframe}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {cat.actions.map((act: string, actIdx: number) => {
                      const itemKey = `${catIdx}_${actIdx}`;
                      const isChecked = checkedActions[itemKey];

                      return (
                        <div
                          key={actIdx}
                          onClick={() => toggleAction(itemKey)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                            isChecked
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                              : 'bg-slate-900/60 hover:bg-slate-900 border-white/5 text-slate-300'
                          }`}
                        >
                          <button className="mt-0.5 text-cyan-400 focus:outline-none flex-shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                          <span className={`text-xs leading-relaxed ${isChecked ? 'line-through opacity-75' : ''}`}>
                            {act}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Helpline Quick Reference */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <span className="font-bold text-slate-200 text-xs border-b border-slate-800 pb-2 block">
              📞 Emergency Helpline Numbers — Share with Affected Residents
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[9px] uppercase font-bold mb-1">BBMP Control Room</span>
                <p className="font-black text-cyan-300 text-base">1533</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[9px] uppercase font-bold mb-1">NDRF Disaster</span>
                <p className="font-black text-amber-300 text-base">1078</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[9px] uppercase font-bold mb-1">Fire & Rescue</span>
                <p className="font-black text-rose-300 text-base">101</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[9px] uppercase font-bold mb-1">Police Emergency</span>
                <p className="font-black text-emerald-300 text-base">100</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Generated: {new Date().toLocaleString('en-IN')} &bull; District: {districtName}
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Source: IMD Radar Synthesis + Open-Meteo 48h Meteorological Forecast
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all"
          >
            Acknowledge & Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
