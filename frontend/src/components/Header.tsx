import React from 'react';
import { 
  Satellite, 
  Map, 
  CloudSun, 
  Sprout, 
  ShieldAlert, 
  FileDown, 
  Sun, 
  Moon,
  CheckCircle2,
  BrainCircuit,
  Radio,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export type MainTabType = 'map' | 'weather' | 'crop-water' | 'drainage';

interface HeaderProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onOpenExportModal: () => void;
  onOpenModelModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  onOpenExportModal,
  onOpenModelModal
}) => {
  const tabs = [
    { id: 'map' as MainTabType, label: 'Flood Map', icon: Map, color: 'from-cyan-500 to-blue-600' },
    { id: 'weather' as MainTabType, label: 'Weather', icon: CloudSun, color: 'from-sky-500 to-indigo-600' },
    { id: 'crop-water' as MainTabType, label: 'Crop Advisor', icon: Sprout, color: 'from-emerald-500 to-teal-600' },
    { id: 'drainage' as MainTabType, label: 'Drainage Actions', icon: ShieldAlert, color: 'from-rose-500 to-amber-600' }
  ];

  return (
    <header className="nav-glass border-b px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-50 transition-all">
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40">
          <Satellite className="w-5 h-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950"></span>
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
              JalaDrishti AI
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full badge-cyan uppercase tracking-wider">
              Karnataka SAR
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-tight hidden md:block">
            Autonomous Satellite Radar & Precision Agro-Hydrology Platform
          </span>
        </div>
      </div>

      {/* Floating Segmented Modern Navigation */}
      <nav aria-label="Main Navigation" className="flex items-center p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activePill"
                  className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color} shadow-lg`}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls: AI Badge, Export, Theme Toggle */}
      <div className="flex items-center gap-2.5 text-xs">
        {onOpenModelModal && (
          <button
            onClick={onOpenModelModal}
            className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/25 transition-all shadow-sm active:scale-95"
            title="View ML Model Architecture & ROC/Ablation Metrics"
          >
            <BrainCircuit className="w-4 h-4 text-purple-500" />
            <span>AI Ensemble (99.9%)</span>
          </button>
        )}

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-white/10 transition-all shadow-sm active:scale-95"
        >
          <FileDown className="w-4 h-4 text-cyan-500" />
          <span className="hidden sm:inline">Export PDF</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-all shadow-sm active:scale-95"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>
    </header>
  );
};
