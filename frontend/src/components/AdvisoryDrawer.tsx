import React, { useState } from 'react';
import { DrainageAdvisory } from '../types';
import { 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle, 
  Wrench, 
  ShieldAlert, 
  CheckCircle2, 
  Droplet, 
  ArrowRight,
  Zap
} from 'lucide-react';

interface AdvisoryDrawerProps {
  advisories: DrainageAdvisory[];
  onSelectZoneByName: (zoneName: string) => void;
}

export const AdvisoryDrawer: React.FC<AdvisoryDrawerProps> = ({
  advisories,
  onSelectZoneByName
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Group advisories by priority
  const criticalList = advisories.filter((a) => a.priority.includes('Priority 1') || a.urgency_score >= 85);
  const highList = advisories.filter((a) => a.priority.includes('Priority 2') || (a.urgency_score >= 60 && a.urgency_score < 85));
  const moderateList = advisories.filter((a) => a.priority.includes('Priority 3') || a.urgency_score < 60);

  return (
    <div
      className={`glass-nav border-t transition-all duration-300 z-30 flex flex-col ${
        isOpen ? 'h-72' : 'h-12'
      }`}
    >
      {/* Header bar / toggle */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 transition-colors"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-extrabold text-sm">
            <Wrench className="w-4 h-4" />
            <span>Rule-Based Drainage Advisory & Action Matrix</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-bold flex items-center gap-1.5 border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              {criticalList.length} Critical P1
            </span>
            <span className="px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-semibold border border-amber-500/30">
              {highList.length} High P2
            </span>
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-semibold border border-emerald-500/30">
              {moderateList.length} Routine P3
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
          <span>{isOpen ? 'Minimize Matrix' : 'Expand Matrix'}</span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Content Drawer: Horizontal scrollable cards */}
      {isOpen && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-4 items-stretch">
          {advisories.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              No active drainage advisories. Click "Run AI Detection" above to generate decision support rules.
            </div>
          ) : (
            advisories.map((adv) => {
              const isCritical = adv.priority.includes('Priority 1') || adv.urgency_score >= 85;
              const isHigh = adv.priority.includes('Priority 2') || (adv.urgency_score >= 60 && adv.urgency_score < 85);

              return (
                <div
                  key={adv.id}
                  className={`w-96 min-w-[24rem] max-w-[24rem] rounded-2xl p-4 flex flex-col justify-between transition-all border shadow-sm ${
                    isCritical
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/40 hover:border-rose-400'
                      : isHigh
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/40 hover:border-amber-400'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/40 hover:border-emerald-400'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Badge & Urgency Score */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-500 text-white'
                            : isHigh
                            ? 'bg-amber-500 text-slate-900'
                            : 'bg-emerald-500 text-slate-900'
                        }`}
                      >
                        {adv.priority}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px]">Urgency:</span>
                        <span className={`font-extrabold ${isCritical ? 'text-rose-600 dark:text-rose-400' : isHigh ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {adv.urgency_score}/100
                        </span>
                      </div>
                    </div>

                    {/* Zone & Title */}
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">{adv.title}</h4>
                      <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold line-clamp-1 flex items-center gap-1 mt-0.5">
                        <Zap className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                        <span>{adv.zone_name}</span>
                      </p>
                    </div>

                    {/* Diagnosis */}
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-white/70 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <strong className="text-slate-800 dark:text-slate-200">Diagnosis: </strong>
                      {adv.diagnosis}
                    </p>

                    {/* Recommended Action */}
                    <p className="text-[11px] text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed bg-white dark:bg-slate-850 p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium">
                      <strong className="text-cyan-600 dark:text-cyan-400">Action: </strong>
                      {adv.action_recommendation}
                    </p>
                  </div>

                  {/* Footer / Focus button */}
                  <div className="pt-2.5 mt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      Est. Volume: {((adv.estimated_volume_m3 || 0) / 1000).toFixed(1)}k m³
                    </span>
                    <button
                      onClick={() => onSelectZoneByName(adv.zone_name)}
                      className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Focus on Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
