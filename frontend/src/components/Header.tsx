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
import { SupportedLanguage } from '../i18n/translations';

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

const LANG_OPTIONS: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'hi', label: 'हि', flag: '🇮🇳' }
];

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
  const { lang, setLang, t } = useLanguage();
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

  return (
    <header className="glass-nav border-b flex flex-col sticky top-0 z-50 backdrop-blur-2xl transition-all shadow-md">
      <div className="px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Platform Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40">
            <Satellite className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                {t('platformTitle', 'JalaDrishti AI')}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {t('liveWarningBadge', 'Live Flood Early Warning')}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-tight hidden md:block">
              {t('platformSubtitle', 'Urban Inundation Radar & Agricultural Waterlogging Prevention System')}
            </span>
          </div>
        </div>

        {/* Spacious Segmented 4-Page Navigation */}
        <nav aria-label="Main Navigation" className="flex items-center p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-inner">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
              activeTab === 'map'
                ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Map className="w-4 h-4 text-cyan-400" />
            <span>{t('navFloodMap', 'Flood Map')}</span>
          </button>

          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
              activeTab === 'weather'
                ? 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-400 border border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.25)]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CloudSun className="w-4 h-4 text-sky-400" />
            <span>{t('navWeather', 'Weather & Radar')}</span>
          </button>

          <button
            onClick={() => setActiveTab('crop-water')}
            className={`flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
              activeTab === 'crop-water'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span>{t('navCropWater', 'Crop Advisor')}</span>
          </button>

          <button
            onClick={() => setActiveTab('drainage')}
            className={`flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
              activeTab === 'drainage'
                ? 'bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{t('navDrainage', 'Drainage Actions')}</span>
          </button>
        </nav>

        {/* Right Controls & Real-Time Action Triggers */}
        <div className="flex items-center gap-2 text-xs">
          
          {/* IoT Telemetry Drawer Button */}
          {onOpenIoTSensors && (
            <button
              onClick={onOpenIoTSensors}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30 transition-all shadow-[0_0_12px_rgba(14,165,233,0.15)]"
              title="Open Live IoT Sump & Water Level Telemetry"
            >
              <Gauge className="w-3.5 h-3.5 text-sky-400" />
              <span>{t('btnIoTSensors', 'IoT Telemetry')}</span>
            </button>
          )}

          {/* Emergency Operations Button */}
          {onOpenEmergencyOps && (
            <button
              onClick={onOpenEmergencyOps}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-bold border border-rose-500/40 transition-all shadow-[0_0_12px_rgba(244,63,94,0.2)] animate-pulse"
              title="Open Emergency Operations Center & Incident Dispatch"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">{t('btnEmergencyEOC', 'Emergency EOC')}</span>
            </button>
          )}

          {/* Citizen Lifeline & Public SOS Hub */}
          {onOpenCitizenLifeline && (
            <button
              onClick={onOpenCitizenLifeline}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 dark:text-amber-200 font-black border border-amber-500/40 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:scale-105"
              title="Citizen Lifeline: Crowdsourced Waterlogging SOS, Relief Shelters & Farmer Support"
            >
              <LifeBuoy className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden md:inline">{t('btnCitizenLifeline', 'Citizen SOS')}</span>
            </button>
          )}

          {/* Export PDF */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-white/10 transition-all shadow-sm"
          >
            <FileDown className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">{t('btnExportPdf', 'Export PDF')}</span>
          </button>

          {/* Global Language Switcher */}
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm" title="Change Language / ಭಾಷೆ ಬದಲಾಯಿಸಿ / भाषा बदलें">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                onClick={() => setLang(opt.code)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all duration-150 ${
                  lang === opt.code
                    ? 'bg-cyan-500 text-white shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 transition-colors shadow-sm"
            title={t('themeSwitch', 'Switch Theme')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>

      </div>

      {/* Live Emergency Ticker Ribbon */}
      {activeAlert && (
        <div className="flex items-center justify-between gap-3 px-3 py-1.5 bg-slate-900/95 dark:bg-slate-950 border-t border-red-500/20 text-[11px] text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
              activeAlert.level === 'CRITICAL' ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-white'
            }`}>
              {activeAlert.level} ALERT
            </span>
            <span className="font-bold text-cyan-300">{activeAlert.district}:</span>
            <span className="truncate text-slate-200">{activeAlert.title} &mdash; {activeAlert.message}</span>
          </div>

          <button
            onClick={onOpenEmergencyOps}
            className="shrink-0 font-bold text-cyan-400 hover:text-cyan-300 underline text-[10px] flex items-center gap-1"
          >
            <span>{t('emergencyCenterTitle', 'View Incident Brief')}</span> &rarr;
          </button>
        </div>
      )}
    </header>
  );
};
