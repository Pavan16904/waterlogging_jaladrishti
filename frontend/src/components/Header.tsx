import React, { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  BrainCircuit,
  CloudRain,
  ChevronDown,
  FileText,
  Map,
  Moon,
  Sprout,
  Sun,
  Siren,
  Waves,
  Shield,
  Users,
} from 'lucide-react';
import { api } from '../services/api';

export type MainTabType = 'overview' | 'map' | 'weather' | 'crop-water' | 'drainage';
type HeaderAction = 'eoc' | 'sos' | 'models' | 'reports';

interface HeaderProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  notificationCount?: number;
  alerts?: any[];
  onOpenEoc: () => void;
  onOpenSos: () => void;
  onOpenModels: () => void;
  onOpenReports: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  notificationCount = 0,
  alerts = [],
  onOpenEoc,
  onOpenSos,
  onOpenModels,
  onOpenReports,
}) => {
  const [ageSeconds, setAgeSeconds] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Deduplicate and filter active alerts
  const activeAlerts = useMemo(() => {
    if (!alerts || !Array.isArray(alerts)) return [];
    const seen = new Set<string>();
    return alerts.filter((a: any) => {
      const key = `${a.id || a.title}_${a.districtId || a.district}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return !dismissedIds.has(a.id || key);
    });
  }, [alerts, dismissedIds]);

  const displayCount = activeAlerts.length;

  const actionHandlers: Record<HeaderAction, () => void> = {
    eoc: onOpenEoc,
    sos: onOpenSos,
    models: onOpenModels,
    reports: onOpenReports,
  };

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof window.setTimeout>;
    let isConnected = false; // local mirror to avoid stale closure

    const schedule = () => {
      // 5s retry when disconnected, 30s heartbeat when live
      timer = window.setTimeout(() => void poll(), isConnected ? 30_000 : 5_000);
    };

    const poll = async () => {
      try {
        const statusData = await api.getPipelineStatus();
        const openMeteo = statusData?.sources?.find((source: any) => source.source === 'open_meteo');
        const dataAge = typeof openMeteo?.age_seconds === 'number'
          ? openMeteo.age_seconds
          : openMeteo?.fetched_at
            ? Math.max(0, Math.floor((Date.now() - new Date(openMeteo.fetched_at).getTime()) / 1000))
            : null;
        isConnected = Boolean(statusData?.timestamp || statusData?.summary);
        if (mounted) {
          setConnected(isConnected);
          setAgeSeconds(dataAge);
        }
      } catch {
        isConnected = false;
        if (mounted) {
          setConnected(false);
          setAgeSeconds(null);
        }
      }
      if (mounted) schedule();
    };

    void poll();
    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, []);

  const statusColor = !connected
    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300'
    : ageSeconds === null
      ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300'
      : ageSeconds < 1800
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
        : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300';
  const statusLabel = !connected
    ? 'Disconnected'
    : ageSeconds === null
      ? 'Connected · Syncing'
      : ageSeconds > 3600
        ? `Stale · ${Math.floor(ageSeconds / 3600)}h`
        : `Live · ${Math.max(1, Math.floor(ageSeconds / 60))} min`;

  const tabs = [
    { label: 'Flood Map', Icon: Map, tab: 'map' as const },
    { label: 'Weather & Radar', Icon: CloudRain, tab: 'weather' as const },
    { label: 'Crop Advisor', Icon: Sprout, tab: 'crop-water' as const },
    { label: 'Drainage Actions', Icon: Shield, tab: 'drainage' as const },
    { label: 'Emergency EOC', Icon: Siren, action: 'eoc' as const },
    { label: 'Citizen SOS', Icon: Users, action: 'sos' as const },
    { label: 'AI Models', Icon: BrainCircuit, action: 'models' as const },
    { label: 'Reports', Icon: FileText, action: 'reports' as const },
  ];

  return (
    <header className="jd-topbar sticky top-0 z-40 border-b bg-white dark:bg-[#111a2b]">
      <div className="jd-brand-row mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex min-w-0 shrink-0 items-center gap-3" aria-label="JalaDrishti AI home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d6fd8] text-white">
            <Waves size={22} strokeWidth={2.4} />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="whitespace-nowrap text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">JalaDrishti AI</span>
            </span>
            <span className="hidden text-[10px] leading-4 text-slate-500 dark:text-slate-400 lg:block">
              Urban Inundation Radar &amp; Agricultural Waterlogging Prevention System
            </span>
          </span>
        </a>

        <nav aria-label="Main navigation" className="jd-desktop-nav hidden items-center gap-1 lg:flex">
          {tabs.map(({ label, Icon, tab, action }) => {
            const selected = tab ? activeTab === tab : false;
            return (
              <button
                key={label}
                type="button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => tab ? setActiveTab(tab) : action && actionHandlers[action]()}
                className={`flex min-w-[76px] flex-col items-center gap-1 rounded-xl border px-2.5 py-2 text-[10px] font-semibold leading-tight transition-colors ${
                  selected
                    ? 'border-[#b8d7fa] bg-[#eaf3ff] text-[#1558a8] dark:border-[#285188] dark:bg-[#172e4c] dark:text-[#9bc8ff]'
                    : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={1.9} />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a
            href="/api/status"
            aria-label={`Open data status: ${statusLabel}`}
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold sm:px-3 ${statusColor}`}
          >
            <span className={`h-2 w-2 rounded-full ${!connected || ageSeconds === null || ageSeconds > 3600 ? 'bg-red-500' : ageSeconds < 900 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="hidden sm:inline">{statusLabel}</span>
          </a>

          <div className="relative">
            <button
              type="button"
              aria-label={`Notifications${displayCount > 0 ? `, ${displayCount} unread` : ''}`}
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Bell size={19} />
              {displayCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                  {displayCount > 99 ? '99+' : displayCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-2xl dark:border-slate-700 dark:bg-[#111a2b] text-slate-900 dark:text-slate-100 flex flex-col max-h-[480px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">Active Alerts & Telemetry</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {displayCount > 0 ? `${displayCount} unread incident${displayCount === 1 ? '' : 's'}` : 'All alerts cleared'}
                    </p>
                  </div>
                  {displayCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = new Set<string>(activeAlerts.map((a: any) => String(a.id || a.title)));
                        setDismissedIds(allIds);
                      }}
                      className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
                  {activeAlerts.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No active warnings</p>
                      <p className="text-[10px] mt-1 text-slate-400">All district telemetric queues and citizen SOS logs are clear.</p>
                    </div>
                  ) : (
                    activeAlerts.map((alert: any) => (
                      <div
                        key={alert.id || alert.title}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col gap-1 hover:border-slate-300 dark:hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            alert.level === 'CRITICAL' ? 'bg-rose-500 text-white' :
                            alert.level === 'WARNING' ? 'bg-amber-500 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            {alert.level || 'ALERT'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </span>
                        </div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{alert.title}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                          <span>{alert.district || 'Karnataka State'}</span>
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                            {alert.status === 'VERIFIED' ? 'Field Verified' : 'Citizen SOS (Pending)'}
                          </span>
                        </div>
                        {alert.action && (
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 italic line-clamp-1 mt-0.5">
                            Action: {alert.action}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setNotificationsOpen(false);
                            onOpenEoc();
                          }}
                          className="mt-1 text-left text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          View in Emergency Operations Center →
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Authoritative DB & Telemetry</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      onOpenEoc();
                    }}
                    className="font-bold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                  >
                    Open Full EOC
                  </button>
                </div>
              </div>
            )}
          </div>

          <details className="jd-account-menu relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e293b] text-xs font-bold text-white dark:bg-[#203a5c] dark:text-[#a8d0ff]">AD</span>
              <ChevronDown size={14} className="hidden text-slate-500 sm:block" />
            </summary>
            <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-[#e5ebf3] bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-[#111a2b]">
              <div className="border-b border-slate-100 px-2 pb-3 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">JalaDrishti Operator</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Karnataka operations</p>
              </div>
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Light appearance' : 'Dark appearance'}
              </button>
            </div>
          </details>
        </div>
      </div>

      <nav aria-label="Mobile navigation" className="jd-mobile-nav flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden dark:border-slate-800">
        {tabs.map(({ label, Icon, tab, action }) => {
          const selected = tab ? activeTab === tab : false;
          return (
            <button
              key={label}
              type="button"
              aria-current={selected ? 'page' : undefined}
              onClick={() => tab ? setActiveTab(tab) : action && actionHandlers[action]()}
              className={`flex min-w-[76px] shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-1.5 text-[9px] font-semibold ${
                selected
                  ? 'border-[#b8d7fa] bg-[#eaf3ff] text-[#1558a8] dark:border-[#285188] dark:bg-[#172e4c] dark:text-[#9bc8ff]'
                  : 'border-transparent text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon size={17} />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
