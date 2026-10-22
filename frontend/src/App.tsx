import React, { useState, useEffect, useRef } from 'react';
import { api } from './services/api';
import { StudyArea, SeverityZone, DrainageAdvisory, AnalysisRun, IoTSensor, RadarMeta, LiveAlert } from './types';
import { Header, MainTabType } from './components/Header';
import { PageHeader, getTodayInKolkata } from './components/PageHeader';
import { FloodMapPage } from './components/FloodMapPage';
import { WeatherPage } from './components/WeatherPage';
import { CropWaterPage } from './components/CropWaterPage';
import { DrainageActionsPage } from './components/DrainageActionsPage';
import { ModelEvaluationModal } from './components/ModelEvaluationModal';
import { ExportReportModal } from './components/ExportReportModal';
import { LiveIoTSensorsDrawer } from './components/LiveIoTSensorsDrawer';
import { EmergencyOpsModal } from './components/EmergencyOpsModal';
import { CitizenLifelineModal } from './components/CitizenLifelineModal';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from './context/LanguageContext';
import { ProjectOverviewPage } from './components/ProjectOverviewPage';
import { NotFoundPage } from './components/NotFoundPage';
import { usePageMeta, useHashRouter, HASH_TO_TAB } from './hooks/usePageMeta';
import { useLive, LiveEvent } from './hooks/useLive';

export function App() {
  const { t } = useLanguage();
  // Theme State (Dark / Light) — default to bright, clean light theme matching visual reference
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('jd-theme') as 'dark' | 'light') || 'light';
    }
    return 'light';
  });

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('jd-theme', theme);
  }, [theme]);

  // Main 4-Page Navigation
  const [activeTab, setActiveTab] = useState<MainTabType>('map');

  // ── SEO: per-tab page titles, meta descriptions, canonical-friendly URL hashes ──
  // (criticalAlertCount is derived below after liveAlerts state is declared)
  useHashRouter(activeTab, setActiveTab);

  // ── 404 detection: unknown hash fragment renders NotFoundPage ──
  const [isUnknownRoute, setIsUnknownRoute] = useState<boolean>(false);
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase().trim();
      const knownHashes = Object.keys(HASH_TO_TAB);
      setIsUnknownRoute(!!hash && !knownHashes.includes(hash));
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Study Areas State
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('bengaluru_urban');
  const [currentArea, setCurrentArea] = useState<StudyArea | null>(null);

  // Analysis Parameters — always start with today as post-event, 7 days ago as pre-event
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getPreEventStr = () => new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [preEventDate, setPreEventDate] = useState<string>(getPreEventStr);
  const [postEventDate, setPostEventDate] = useState<string>(getTodayStr);
  const [rainfallMm, setRainfallMm] = useState<number>(0);

  // Results State
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [zones, setZones] = useState<SeverityZone[]>([]);
  const [advisories, setAdvisories] = useState<DrainageAdvisory[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Modelled precipitation from Open-Meteo; not a ground-gauge observation.
  const [liveRainfallData, setLiveRainfallData] = useState<any>(null);

  // Map real-time state
  const [mapLastUpdated, setMapLastUpdated] = useState<Date | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(false);

  // Real-Time Telemetry State
  const [radarMeta, setRadarMeta] = useState<RadarMeta | null>(null);
  const [iotSensors, setIoTSensors] = useState<IoTSensor[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const areaRequestSequence = useRef(0);

  // Cross-Page Selected District
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Bengaluru Urban');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayInKolkata);
  const [highlightDrainageActionId, setHighlightDrainageActionId] = useState<string | null>(null);
  const [highlightDrainageLocation, setHighlightDrainageLocation] = useState<string | null>(null);
  const [highlightDrainageDistrictId, setHighlightDrainageDistrictId] = useState<string | null>(null);

  // Modals & Drawers
  const [isModelOpen, setIsModelOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isIoTDrawerOpen, setIsIoTDrawerOpen] = useState<boolean>(false);
  const [isEmergencyOpsOpen, setIsEmergencyOpsOpen] = useState<boolean>(false);
  const [isCitizenLifelineOpen, setIsCitizenLifelineOpen] = useState<boolean>(false);

  // Phase 4: live update timestamp — drives the Header freshness chip
  const [liveLastEventTime, setLiveLastEventTime] = useState<string | null>(null);
  // Key incremented on scores-updated so map/overview re-fetch only the data layer
  const [scoresKey, setScoresKey] = useState<number>(0);

  // SSE subscription — no page reload needed, no map reset
  useLive((event: LiveEvent) => {
    if (event.type === 'heartbeat' || event.type === 'status-changed') {
      setLiveLastEventTime(event.ts);
    }
    if (event.type === 'scores-updated') {
      setLiveLastEventTime(event.valid_time);
      setScoresKey((k) => k + 1); // triggers data-only refresh in map/overview
    }
  });

  // ── Live page title: reflect critical alert count and active district in browser tab ──
  const criticalAlertCount = liveAlerts.filter(
    (a: any) => a.severity === 'critical' || a.level === 'critical' || a.status === 'critical'
  ).length;
  usePageMeta(activeTab, {
    criticalAlerts: criticalAlertCount,
    activeDistrict:
      activeTab === 'map'
        ? (currentArea?.name?.split('(')[0].trim() ?? 'Bengaluru Urban')
        : currentArea?.name,
  });

  // Initial Load: Fetch Study Areas, Radar metadata, IoT Telemetry & Alerts
  useEffect(() => {
    loadStudyAreas();
    loadRadarMeta();
    loadRealtimeTelemetry();

    // Refresh dates to today on mount (handles overnight sessions staying open)
    setPostEventDate(getTodayStr());
    setPreEventDate(getPreEventStr());

    // RainViewer radar metadata updates approximately every ten minutes.
    const radarInterval = setInterval(() => {
      loadRadarMeta();
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(radarInterval);
    };
  }, []);

  // When selectedAreaId changes, fetch latest analysis AND live rainfall
  // for the selected district. A weather-provider update is not itself a flood observation.
  useEffect(() => {
    if (selectedAreaId) {
      const requestId = ++areaRequestSequence.current;
      const area = studyAreas.find((a) => a.id === selectedAreaId) || null;
      setCurrentArea(area);
      if (area) {
        setSelectedDistrict(area.name.split('(')[0].trim());
      }
      // Clear previous district's zones so they do not bleed into the new district
      setZones([]);
      setLiveRainfallData(null);
      setMapLastUpdated(null);
      setRainfallMm(0);
      loadLatestAnalysis(selectedAreaId, requestId);
      if (area) {
        void fetchLiveRainfall(area, requestId);
        const weatherRefreshInterval = window.setInterval(() => {
          void fetchLiveRainfall(area, requestId);
        }, 60 * 60 * 1000);
        return () => window.clearInterval(weatherRefreshInterval);
      }
    }
  }, [selectedAreaId, studyAreas]);

  const loadStudyAreas = async () => {
    try {
      const areas = await api.getStudyAreas();
      setStudyAreas(areas);
      if (areas.length > 0) {
        const match = areas.find((a) => a.id === selectedAreaId) || areas[0];
        setSelectedAreaId(match.id);
        setCurrentArea(match);
      }
    } catch (err) {
      console.error('Failed to load study areas:', err);
    }
  };

  const loadLatestAnalysis = async (areaId: string, requestId = areaRequestSequence.current) => {
    try {
      const data = await api.getLatestAnalysis(areaId);
      if (data && requestId === areaRequestSequence.current) {
        setRun(data.run);
        setZones(data.zones || []);
        setAdvisories(data.advisories || []);
        // Don't override rainfallMm from DB if live data is already loaded
        if (data.run?.rainfall_mm && !liveRainfallData) {
          setRainfallMm(data.run.rainfall_mm);
        }
      }
    } catch (err) {
      console.error('Failed to load latest analysis:', err);
    }
  };

  // Retrieve the model-derived weather feed; do not invent minimum rainfall or
  // trigger a flood analysis merely because the provider returned a new forecast.
  const fetchLiveRainfall = async (
    area: StudyArea,
    requestId = areaRequestSequence.current,
    refresh = false
  ) => {
    try {
      const data = await api.getTodayRainfall(area.center_lat, area.center_lng, area.name, refresh);
      if (data && data.success && requestId === areaRequestSequence.current) {
        setLiveRainfallData(data);
        setRainfallMm(data.modeledDailyPrecipitationMm);
        setMapLastUpdated(data.backendRetrievedAt ? new Date(data.backendRetrievedAt) : null);
      }
    } catch (err) {
      if (requestId === areaRequestSequence.current) {
        setLiveRainfallData((lastKnownGood: any) =>
          lastKnownGood ? { ...lastKnownGood, isStale: true } : null
        );
        console.warn('Weather model data fetch warning:', err);
      }
    }
  };

  // Manual refresh trigger (user clicks refresh on map)
  const handleManualMapRefresh = async () => {
    if (!currentArea || isAutoRefreshing || isAnalyzing) return;
    setIsAutoRefreshing(true);
    try {
      await fetchLiveRainfall(currentArea, areaRequestSequence.current, true);
    } finally {
      setIsAutoRefreshing(false);
    }
  };

  const loadRadarMeta = async () => {
    try {
      const data = await api.getRadarMeta();
      if (data && data.success) {
        setRadarMeta(data);
      }
    } catch (err) {
      console.warn('Radar metadata fetch warning:', err);
    }
  };

  const loadRealtimeTelemetry = async () => {
    try {
      const [iotData, alertsData] = await Promise.all([
        api.getIoTSensors(),
        api.getLiveAlerts()
      ]);

      if (iotData && iotData.sensors) {
        setIoTSensors(iotData.sensors);
      }
      if (alertsData && alertsData.alerts) {
        setLiveAlerts(alertsData.alerts);
      }
    } catch (err) {
      console.warn('Real-time telemetry poll warning:', err);
    }
  };

  const handleRunAnalysis = async () => {
    const areaId = selectedAreaId;
    const requestId = areaRequestSequence.current;
    setIsAnalyzing(true);
    try {
      const res = await api.runAnalysis({
        studyAreaId: areaId,
        preEventDate,
        postEventDate,
        rainfallMm,
        modelType: 'random_forest'
      });

      if (res && res.runId) {
        await loadLatestAnalysis(areaId, requestId);
      }
    } catch (err) {
      console.error('Analysis execution failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render custom 404 for unknown URL hashes
  if (isUnknownRoute) {
    return (
      <NotFoundPage
        onNavigateHome={() => {
          setIsUnknownRoute(false);
          setActiveTab('map');
          window.history.replaceState(null, '', '/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fb] text-slate-900 transition-colors duration-300 dark:bg-[#0b1220] dark:text-slate-100">
      {/* Top Universal Modern Navigation Header with Live Ticker */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        notificationCount={liveAlerts.length}
        alerts={liveAlerts}
        onOpenEoc={() => setIsEmergencyOpsOpen(true)}
        onOpenSos={() => setIsCitizenLifelineOpen(true)}
        onOpenModels={() => setIsModelOpen(true)}
        onOpenReports={() => setIsExportOpen(true)}
      />

      {/* Main Page Body with Animated Transitions */}
      <main className="flex-1 flex flex-col relative overflow-x-hidden">
        {activeTab === 'overview' && (
          <PageHeader
            activeTab={activeTab}
            selectedDistrict={selectedDistrict}
            onDistrictChange={setSelectedDistrict}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <ProjectOverviewPage
                onNavigateToFloodMap={() => setActiveTab('map')}
                onNavigateToWeather={() => setActiveTab('weather')}
                onNavigateToCropWater={() => setActiveTab('crop-water')}
                onNavigateToDrainage={() => setActiveTab('drainage')}
                scoresKey={scoresKey}
              />
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div
              key="map-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <FloodMapPage
                selectedDistrict={selectedDistrict}
                onDistrictChange={setSelectedDistrict}
                scoresKey={scoresKey}
                selectedDate={selectedDate}
                onOpenEoc={() => setIsEmergencyOpsOpen(true)}
                onNavigateToDrainageActions={(districtId, actionId, location) => {
                  if (districtId) setSelectedDistrict(districtId);
                  setHighlightDrainageActionId(actionId || null);
                  setHighlightDrainageLocation(location || null);
                  setActiveTab('drainage');
                }}
                highlightDistrictId={highlightDrainageDistrictId}
                highlightLocation={highlightDrainageLocation}
              />
            </motion.div>
          )}

          {activeTab === 'weather' && (
            <motion.div
              key="weather-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <WeatherPage
                selectedDistrictId={selectedDistrict}
                onSelectedDistrictIdChange={setSelectedDistrict}
                selectedDate={selectedDate}
                onNavigateToCropWater={(district) => {
                  setSelectedDistrict(district || selectedDistrict);
                  setActiveTab('crop-water');
                }}
                onNavigateToFloodMap={() => setActiveTab('map')}
              />
            </motion.div>
          )}

          {activeTab === 'crop-water' && (
            <motion.div
              key="crop-water-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <CropWaterPage
                selectedDistrictId={selectedDistrict}
                onSelectedDistrictIdChange={setSelectedDistrict}
                selectedDate={selectedDate}
              />
            </motion.div>
          )}

          {activeTab === 'drainage' && (
            <motion.div
              key="drainage-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <DrainageActionsPage
                advisories={advisories}
                zones={zones}
                studyArea={currentArea}
                selectedDistrictId={selectedDistrict}
                onSelectedDistrictIdChange={setSelectedDistrict}
                selectedDate={selectedDate}
                onOpenExportModal={() => setIsExportOpen(true)}
                onNavigateToMapWithDistrict={(districtId, lat, lng, locationName) => {
                  setHighlightDrainageDistrictId(districtId || null);
                  setHighlightDrainageLocation(locationName || null);
                  setSelectedDistrict(districtId);
                  setActiveTab('map');
                }}
                highlightActionId={highlightDrainageActionId}
                highlightLocation={highlightDrainageLocation}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-auto border-t border-[#e5ebf3] bg-white px-4 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-[#111a2b] dark:text-slate-400">
        Decision support, not an official alert.
      </footer>

      {/* Global Live IoT Sensors Telemetry Drawer */}
      <LiveIoTSensorsDrawer
        isOpen={isIoTDrawerOpen}
        onClose={() => setIsIoTDrawerOpen(false)}
        sensors={iotSensors}
        onRefresh={loadRealtimeTelemetry}
      />

      {/* Global Emergency Operations Center (EOC) Modal */}
      <EmergencyOpsModal
        isOpen={isEmergencyOpsOpen}
        onClose={() => setIsEmergencyOpsOpen(false)}
        alerts={liveAlerts}
        selectedDistrict={selectedDistrict}
        onRefreshAlerts={loadRealtimeTelemetry}
      />

      {/* Global Citizen Lifeline, Crowdsourced SOS & Shelter Center */}
      <CitizenLifelineModal
        isOpen={isCitizenLifelineOpen}
        onClose={() => setIsCitizenLifelineOpen(false)}
      />

      {/* Official Engineering & PDF Export Modal */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        studyArea={currentArea}
        selectedDistrict={selectedDistrict}
        liveWeatherData={liveRainfallData}
      />

      {/* AI Model Architecture & ROC/Metrics Modal */}
      <ModelEvaluationModal
        isOpen={isModelOpen}
        onClose={() => setIsModelOpen(false)}
      />
    </div>
  );
}

export default App;
