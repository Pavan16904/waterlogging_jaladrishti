import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { StudyArea, SeverityZone, DrainageAdvisory, AnalysisRun } from './types';
import { Header, MainTabType } from './components/Header';
import { FloodMapPage } from './components/FloodMapPage';
import { WeatherPage } from './components/WeatherPage';
import { CropWaterPage } from './components/CropWaterPage';
import { DrainageActionsPage } from './components/DrainageActionsPage';
import { ModelEvaluationModal } from './components/ModelEvaluationModal';
import { ExportReportModal } from './components/ExportReportModal';
import { AnimatePresence, motion } from 'framer-motion';

export function App() {
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
  const [selectedAreaId, setSelectedAreaId] = useState<string>('bengaluru_bellandur');
  const [currentArea, setCurrentArea] = useState<StudyArea | null>(null);

  // Analysis Parameters
  const [preEventDate, setPreEventDate] = useState<string>('2026-06-10');
  const [postEventDate, setPostEventDate] = useState<string>('2026-08-25');
  const [rainfallMm, setRainfallMm] = useState<number>(75);

  // Results State
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [zones, setZones] = useState<SeverityZone[]>([]);
  const [advisories, setAdvisories] = useState<DrainageAdvisory[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Cross-Page Selected District
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Bengaluru Urban');

  // Modals
  const [isModelOpen, setIsModelOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Initial Load: Fetch Study Areas
  useEffect(() => {
    loadStudyAreas();
  }, []);

  // When selectedAreaId changes, fetch latest analysis
  useEffect(() => {
    if (selectedAreaId) {
      const area = studyAreas.find((a) => a.id === selectedAreaId) || null;
      setCurrentArea(area);
      loadLatestAnalysis(selectedAreaId);
    }
  }, [selectedAreaId, studyAreas]);

  const loadStudyAreas = async () => {
    try {
      const areas = await api.getStudyAreas();
      setStudyAreas(areas);
      if (areas.length > 0 && !selectedAreaId) {
        setSelectedAreaId(areas[0].id);
        setCurrentArea(areas[0]);
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
        if (data.run?.rainfall_mm) {
          setRainfallMm(data.run.rainfall_mm);
        }
      }
    } catch (err) {
      console.error('Failed to load latest analysis:', err);
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080c14] bg-ambient-mesh text-slate-900 dark:text-slate-100 selection:bg-cyan-500 selection:text-white transition-colors duration-300">
      {/* Top Universal Modern Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenModelModal={() => setIsModelOpen(true)}
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

      {/* Luxury Platform Telemetry & Data Provenance Footer */}
      <footer className="glass-nav border-t border-slate-200 dark:border-slate-800/80 px-4 md:px-8 py-4 text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Telemetry Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sentinel-1 SAR Active
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-[11px] border border-sky-500/20">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              31 Districts Synced (Open-Meteo)
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-[11px] border border-purple-500/20">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              AI Ensemble (99.95%)
            </span>

            <span className="text-[11px] text-slate-400 hidden lg:inline">
              FAO-56 Dual Kc &bull; NASA SRTM 30m DEM
            </span>
          </div>

          {/* Platform Identity & Navigation */}
          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              JalaDrishti AI &mdash; Karnataka Flood Intelligence Platform
            </span>
            <button
              onClick={() => setIsModelOpen(true)}
              className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
            >
              Model Architecture
            </button>
            <button
              onClick={() => setIsExportOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold"
            >
              Export PDF
            </button>
          </div>
        </div>
      </footer>

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
