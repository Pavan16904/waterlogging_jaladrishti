import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { StudyArea, SeverityZone, DrainageAdvisory, AnalysisRun, IoTSensor, RadarMeta, LiveAlert } from './types';
import { Header, MainTabType } from './components/Header';
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

export function App() {
  const { t } = useLanguage();
  // Theme State (Dark / Light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('jd-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
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

  // Study Areas State
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('bengaluru_urban');
  const [currentArea, setCurrentArea] = useState<StudyArea | null>(null);

  // Analysis Parameters — always start with today as post-event, 7 days ago as pre-event
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getPreEventStr = () => new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [preEventDate, setPreEventDate] = useState<string>(getPreEventStr);
  const [postEventDate, setPostEventDate] = useState<string>(getTodayStr);
  const [rainfallMm, setRainfallMm] = useState<number>(75);

  // Results State
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [zones, setZones] = useState<SeverityZone[]>([]);
  const [advisories, setAdvisories] = useState<DrainageAdvisory[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Live Rainfall Data (from Open-Meteo real-time)
  const [liveRainfallData, setLiveRainfallData] = useState<any>(null);

  // Map real-time state
  const [mapLastUpdated, setMapLastUpdated] = useState<Date | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(false);

  // Real-Time Telemetry State
  const [radarMeta, setRadarMeta] = useState<RadarMeta | null>(null);
  const [iotSensors, setIoTSensors] = useState<IoTSensor[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);

  // Cross-Page Selected District
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Bengaluru Urban');

  // Modals & Drawers
  const [isModelOpen, setIsModelOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isIoTDrawerOpen, setIsIoTDrawerOpen] = useState<boolean>(false);
  const [isEmergencyOpsOpen, setIsEmergencyOpsOpen] = useState<boolean>(false);
  const [isCitizenLifelineOpen, setIsCitizenLifelineOpen] = useState<boolean>(false);

  // Initial Load: Fetch Study Areas, Radar metadata, IoT Telemetry & Alerts
  useEffect(() => {
    loadStudyAreas();
    loadRadarMeta();
    loadRealtimeTelemetry();

    // Refresh dates to today on mount (handles overnight sessions staying open)
    setPostEventDate(getTodayStr());
    setPreEventDate(getPreEventStr());

    // Set up continuous real-time telemetry polling interval (8s)
    const telemetryInterval = setInterval(() => {
      loadRealtimeTelemetry();
      // Also refresh dates every 8s so they always reflect current day
      setPostEventDate(getTodayStr());
    }, 8000);

    // Refresh radar frames every 5 minutes
    const radarInterval = setInterval(() => {
      loadRadarMeta();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(telemetryInterval);
      clearInterval(radarInterval);
    };
  }, []);

  // Auto-refresh map every 5 minutes with live rainfall → re-analysis
  useEffect(() => {
    const mapRefreshInterval = setInterval(() => {
      if (currentArea) {
        autoRefreshMap(currentArea);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(mapRefreshInterval);
  }, [currentArea]);

  // When selectedAreaId changes, fetch latest analysis AND live rainfall
  // then auto-run analysis with live rainfall to update map zones
  useEffect(() => {
    if (selectedAreaId) {
      const area = studyAreas.find((a) => a.id === selectedAreaId) || null;
      setCurrentArea(area);
      loadLatestAnalysis(selectedAreaId);
      if (area) {
        // Fetch live rain, then immediately run analysis with it to update map
        fetchLiveRainfall(area.center_lat, area.center_lng, area.name, true);
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

  const loadLatestAnalysis = async (areaId: string) => {
    try {
      const data = await api.getLatestAnalysis(areaId);
      if (data) {
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

  // Fetch live today's rainfall from Open-Meteo for the selected area
  // and automatically trigger ML re-analysis so map zones reflect live rain
  const fetchLiveRainfall = async (lat: number, lng: number, name: string, runAnalysisAfter = false) => {
    try {
      const data = await api.getTodayRainfall(lat, lng, name);
      if (data && data.success) {
        setLiveRainfallData(data);
        // Auto-update rainfall slider to today's actual measurement
        const liveRain = data.todayRainfallMm > 0 ? Math.round(data.todayRainfallMm * 10) / 10 : 10;
        setRainfallMm(liveRain);

        if (runAnalysisAfter) {
          // Re-run ML analysis with live rainfall so map zones update
          await runLiveAnalysis(liveRain);
        }
      }
    } catch (err) {
      console.warn('Live rainfall fetch warning:', err);
    }
  };

  // Run a silent ML analysis update (no spinner shown to user)
  const runLiveAnalysis = async (liveRainMm: number) => {
    try {
      const res = await api.runAnalysis({
        studyAreaId: selectedAreaId,
        preEventDate: getPreEventStr(),
        postEventDate: getTodayStr(),
        rainfallMm: liveRainMm,
        modelType: 'random_forest'
      });
      if (res && res.runId) {
        await loadLatestAnalysis(selectedAreaId);
        setMapLastUpdated(new Date());
      }
    } catch (err) {
      console.warn('Live map analysis update warning:', err);
    }
  };

  // Full auto-refresh: live rain → re-analysis → update map zones
  const autoRefreshMap = async (area: { center_lat: number; center_lng: number; name: string; id: string }) => {
    setIsAutoRefreshing(true);
    try {
      await fetchLiveRainfall(area.center_lat, area.center_lng, area.name, true);
    } finally {
      setIsAutoRefreshing(false);
    }
  };

  // Manual refresh trigger (user clicks refresh on map)
  const handleManualMapRefresh = async () => {
    if (!currentArea || isAutoRefreshing || isAnalyzing) return;
    setIsAutoRefreshing(true);
    try {
      await fetchLiveRainfall(currentArea.center_lat, currentArea.center_lng, currentArea.name, true);
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
    setIsAnalyzing(true);
    try {
      const res = await api.runAnalysis({
        studyAreaId: selectedAreaId,
        preEventDate,
        postEventDate,
        rainfallMm,
        modelType: 'random_forest'
      });

      if (res && res.runId) {
        await loadLatestAnalysis(selectedAreaId);
      }
    } catch (err) {
      console.error('Analysis execution failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] bg-ambient-mesh text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Universal Modern Navigation Header with Live Ticker */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenModelModal={() => setIsModelOpen(true)}
        onOpenEmergencyOps={() => setIsEmergencyOpsOpen(true)}
        onOpenIoTSensors={() => setIsIoTDrawerOpen(true)}
        onOpenCitizenLifeline={() => setIsCitizenLifelineOpen(true)}
        alerts={liveAlerts}
      />

      {/* Main Page Body with Animated Transitions */}
      <main className="flex-1 flex flex-col relative overflow-x-hidden">
        <AnimatePresence mode="wait">
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
                studyAreas={studyAreas}
                selectedAreaId={selectedAreaId}
                onSelectArea={setSelectedAreaId}
                run={run}
                zones={zones}
                advisories={advisories}
                isAnalyzing={isAnalyzing}
                onRunAnalysis={handleRunAnalysis}
                preEventDate={preEventDate}
                setPreEventDate={setPreEventDate}
                postEventDate={postEventDate}
                setPostEventDate={setPostEventDate}
                rainfallMm={rainfallMm}
                setRainfallMm={setRainfallMm}
                onNavigateToDrainage={() => setActiveTab('drainage')}
                radarMeta={radarMeta}
                iotSensors={iotSensors}
                alerts={liveAlerts}
                onRefreshTelemetry={loadRealtimeTelemetry}
                liveRainfallData={liveRainfallData}
                mapLastUpdated={mapLastUpdated}
                isAutoRefreshing={isAutoRefreshing}
                onManualMapRefresh={handleManualMapRefresh}
                onOpenEmergencyOps={() => setIsEmergencyOpsOpen(true)}
                onOpenIoTSensors={() => setIsIoTDrawerOpen(true)}
                onOpenCitizenLifeline={() => setIsCitizenLifelineOpen(true)}
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
                onNavigateToCropWater={(district) => {
                  setSelectedDistrict(district);
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
              <CropWaterPage initialDistrict={selectedDistrict} />
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
                onOpenExportModal={() => setIsExportOpen(true)}
                onNavigateToMap={() => setActiveTab('map')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="glass-nav border-t px-4 md:px-8 py-3 text-xs text-slate-500 dark:text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          {/* Live Data Status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-600 dark:text-slate-400">Sentinel SAR · Open-Meteo · FAO-56</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="font-medium">{iotSensors.length} IoT sensors active</span>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              JalaDrishti AI
            </span>
            <button
              onClick={() => setIsIoTDrawerOpen(true)}
              className="text-sky-500 hover:underline font-bold"
            >
              Sensor Dashboard
            </button>
            <button
              onClick={() => setIsEmergencyOpsOpen(true)}
              className="text-rose-500 hover:underline font-bold"
            >
              Emergency Response
            </button>
            <button
              onClick={() => setIsCitizenLifelineOpen(true)}
              className="text-amber-500 hover:underline font-bold flex items-center gap-1"
            >
              <span>Citizen SOS / Shelters</span>
            </button>
            <button
              onClick={() => setIsModelOpen(true)}
              className="text-purple-400 hover:text-purple-300 hover:underline font-bold flex items-center gap-1"
            >
              <span>AI Models &amp; XGBoost</span>
            </button>
            <button
              onClick={() => setIsExportOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold"
            >
              Export Report
            </button>
          </div>
        </div>
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
        sensors={iotSensors}
      />

      {/* Global Citizen Lifeline, Crowdsourced SOS & Shelter Center */}
      <CitizenLifelineModal
        isOpen={isCitizenLifelineOpen}
        onClose={() => setIsCitizenLifelineOpen(false)}
        districtName={selectedDistrict || currentArea?.name || 'Bengaluru Urban'}
      />

      {/* Official Engineering & PDF Export Modal */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        studyArea={currentArea}
        run={run}
        zones={zones}
        advisories={advisories}
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
