import React, { useState, useEffect } from 'react';
import { 
  Satellite, 
  Map, 
  CloudSun, 
  Sprout, 
  ShieldAlert, 
  FileDown, 
  Sun, 
  Moon,
  Gauge,
  LifeBuoy
} from 'lucide-react';
import { LiveAlert } from '../types';
import { useLanguage } from '../context/LanguageContext';

export type MainTabType = 'map' | 'weather' | 'crop-water' | 'drainage';

interface HeaderProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onOpenExportModal: () => void;
  onOpenModelModal?: () => void;
  onOpenEmergencyOps?: () => void;
  onOpenIoTSensors?: () => void;
  onOpenCitizenLifeline?: () => void;
  alerts?: LiveAlert[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  onOpenExportModal,
  onOpenModelModal,
  onOpenEmergencyOps,
  onOpenIoTSensors,
  onOpenCitizenLifeline,
  alerts = []
}) => {
  const { t } = useLanguage();
  // Rotate through alerts for the live ticker
  const [currentAlertIdx, setCurrentAlertIdx] = useState<number>(0);

  useEffect(() => {
    if (alerts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentAlertIdx((prev) => (prev + 1) % alerts.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [alerts.length]);

  const activeAlert = alerts[currentAlertIdx] || null;

  /* ─── Nav tab helper ──────────────────────────────────────── */
  const tabs = [
    { id: 'map'        as const, label: t('navFloodMap', 'Flood Map'),   Icon: Map,        color: 'text-sky-500  dark:text-sky-400'       },
    { id: 'weather'    as const, label: t('navWeather',  'Weather'),      Icon: CloudSun,   color: 'text-blue-500 dark:text-blue-400'      },
    { id: 'crop-water' as const, label: t('navCropWater','Crop Advisor'), Icon: Sprout,     color: 'text-emerald-500 dark:text-emerald-400' },
    { id: 'drainage'   as const, label: t('navDrainage', 'Drainage'),     Icon: ShieldAlert,color: 'text-rose-500  dark:text-rose-400'     },
  ];

  return (
    <header className="glass-nav flex flex-col sticky top-0 z-50">
      <div className="px-4 lg:px-6 h-14 flex items-center justify-between gap-4">

        {/* ── Brand ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/30">
            <Satellite className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
                {t('platformTitle', 'JalaDrishti AI')}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-500 hidden md:block leading-tight">
              Flood Intelligence &amp; Agro-Hydrology Platform
            </span>
          </div>
        </div>

        {/* ── Navigation ─────────────────────────────────────── */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-0.5">
          {tabs.map(({ id, label, Icon, color }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/8'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? color : 'opacity-60'}`} />
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] rounded-t-full bg-sky-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Right actions ───────────────────────────────────── */}
        <div className="flex items-center gap-1.5">

          {onOpenIoTSensors && (
            <button
              onClick={onOpenIoTSensors}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
              title="Live IoT Sensor Telemetry"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{t('btnIoTSensors', 'IoT Sensors')}</span>
            </button>
          )}

          {onOpenEmergencyOps && (
            <button
              onClick={onOpenEmergencyOps}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/15 border border-rose-200 dark:border-rose-500/20 transition-all"
              title="Emergency Operations Center"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('btnEmergencyEOC', 'Emergency')}</span>
            </button>
          )}

          {onOpenCitizenLifeline && (
            <button
              onClick={onOpenCitizenLifeline}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/15 border border-amber-200 dark:border-amber-500/20 transition-all"
              title="Citizen SOS & Lifeline Hub"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t('btnCitizenLifeline', 'Citizen SOS')}</span>
            </button>
          )}

          <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('btnExportPdf', 'Export')}</span>
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 transition-all"
            title={t('themeSwitch', 'Toggle theme')}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      {/* ── Mobile nav strip ──────────────────────────────────── */}
      <div className="md:hidden flex items-center gap-0.5 px-3 pb-1 overflow-x-auto scrollbar-hide">
        {tabs.map(({ id, label, Icon, color }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/8'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? color : 'opacity-50'}`} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Alert ticker ──────────────────────────────────────── */}
      {activeAlert && (
        <div className="flex items-center justify-between gap-3 px-4 py-1.5 bg-red-950/80 dark:bg-red-950/60 border-t border-red-800/40 text-[11px]">
          <div className="flex items-center gap-2 truncate text-red-200">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
              activeAlert.level === 'CRITICAL'
                ? 'bg-red-500 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {activeAlert.level}
            </span>
            <span className="font-semibold text-red-300">{activeAlert.district}:</span>
            <span className="truncate">{activeAlert.title} — {activeAlert.message}</span>
          </div>
          <button
            onClick={onOpenEmergencyOps}
            className="shrink-0 text-red-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
          >
            {t('emergencyCenterTitle', 'View')} →
          </button>
        </div>
      )}
    </header>
  );
};
