import React from 'react';
import { StudyArea } from '../types';
import { 
  MapPin, 
  Calendar, 
  CloudRain, 
  Play, 
  RefreshCw, 
  Cpu, 
  Sparkles 
} from 'lucide-react';

interface MapControlBarProps {
  studyAreas: StudyArea[];
  selectedAreaId: string;
  onSelectArea: (id: string) => void;
  preEventDate: string;
  setPreEventDate: (val: string) => void;
  postEventDate: string;
  setPostEventDate: (val: string) => void;
  rainfallMm: number;
  setRainfallMm: (val: number) => void;
  modelType: string;
  setModelType: (val: string) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export const MapControlBar: React.FC<MapControlBarProps> = ({
  studyAreas,
  selectedAreaId,
  onSelectArea,
  preEventDate,
  setPreEventDate,
  postEventDate,
  setPostEventDate,
  rainfallMm,
  setRainfallMm,
  modelType,
  setModelType,
  onRunAnalysis,
  isAnalyzing
}) => {
  return (
    <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Study Area Dropdown */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-xs font-semibold">
          <MapPin className="w-4 h-4 text-cyan-500" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">Catchment:</span>
          <select
            value={selectedAreaId}
            onChange={(e) => onSelectArea(e.target.value)}
            className="bg-transparent border-none text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer pr-1"
          >
            {studyAreas.map((area) => (
              <option key={area.id} value={area.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {area.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Window */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card">
          <Calendar className="w-4 h-4 text-sky-500" />
          <span className="text-slate-500 dark:text-slate-400">Pre:</span>
          <input
            type="date"
            value={preEventDate}
            onChange={(e) => setPreEventDate(e.target.value)}
            className="bg-transparent text-slate-800 dark:text-slate-200 font-mono text-[11px] focus:outline-none cursor-pointer"
          />
          <span className="text-slate-400">→</span>
          <span className="text-slate-500 dark:text-slate-400">Post:</span>
          <input
            type="date"
            value={postEventDate}
            onChange={(e) => setPostEventDate(e.target.value)}
            className="bg-transparent text-slate-800 dark:text-slate-200 font-mono text-[11px] focus:outline-none cursor-pointer"
          />
        </div>

        {/* Rainfall Intensity Slider */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-card">
          <CloudRain className="w-4 h-4 text-blue-500" />
          <span className="text-slate-500 dark:text-slate-400">Precipitation:</span>
          <input
            type="range"
            min={0}
            max={180}
            step={5}
            value={rainfallMm}
            onChange={(e) => setRainfallMm(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 w-12 text-right">{rainfallMm} mm</span>
        </div>

        {/* Automated ML Pipeline Indicator (no manual toggle required) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-slate-500 dark:text-slate-400">AI Engine:</span>
          <span className="text-purple-600 dark:text-purple-400 font-bold">Ensemble (SAR + Optical)</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={onRunAnalysis}
        disabled={isAnalyzing}
        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all transform active:scale-95 disabled:opacity-50"
      >
        {isAnalyzing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Analyzing Multi-Source Satellites...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Run AI Waterlogging Detection</span>
          </>
        )}
      </button>
    </div>
  );
};
