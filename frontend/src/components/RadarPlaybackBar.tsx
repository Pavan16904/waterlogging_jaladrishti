import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Radio, 
  Eye, 
  CloudRain, 
  Clock, 
  Layers, 
  Sliders,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { RadarMeta } from '../types';

interface RadarPlaybackBarProps {
  radarMeta: RadarMeta | null;
  currentFrameIndex: number;
  setCurrentFrameIndex: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  radarOpacity: number;
  setRadarOpacity: (opacity: number) => void;
  playbackSpeedMs?: number;
  setPlaybackSpeedMs?: (speed: number) => void;
  onClose?: () => void;
}

export const RadarPlaybackBar: React.FC<RadarPlaybackBarProps> = ({
  radarMeta,
  currentFrameIndex,
  setCurrentFrameIndex,
  isPlaying,
  setIsPlaying,
  radarOpacity,
  setRadarOpacity,
  playbackSpeedMs = 800,
  setPlaybackSpeedMs,
  onClose
}) => {
  const frames = radarMeta?.pastFrames || [];
  const currentFrame = frames[currentFrameIndex];
  
  // Format frame timestamp to human readable local time
  const formatFrameTime = (timestampSec: number) => {
    if (!timestampSec) return 'Live Radar';
    const date = new Date(timestampSec * 1000);
    const diffMin = Math.round((Date.now() - date.getTime()) / (60 * 1000));
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffMin <= 5) return `${timeStr} (Live Now)`;
    return `${timeStr} (${diffMin}m ago)`;
  };

  const handleStep = (direction: 'prev' | 'next') => {
    setIsPlaying(false);
    if (direction === 'prev') {
      setCurrentFrameIndex((currentFrameIndex - 1 + frames.length) % frames.length);
    } else {
      setCurrentFrameIndex((currentFrameIndex + 1) % frames.length);
    }
  };

  if (!radarMeta || frames.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-2xl bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl p-3.5 text-white transition-all">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-cyan-400">
            <Radio className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>WEATHER LAYER &bull; DOPPLER PRECIPITATION SWEEP</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
            {frames.length} sweeps
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Timestamp readout */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentFrame ? formatFrameTime(currentFrame.time) : 'Scanning...'}</span>
          </div>

          {/* Opacity slider */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>Opacity</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={radarOpacity}
              onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Scrubber & Player Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/30 transition-all shrink-0 active:scale-95"
          title={isPlaying ? 'Pause Radar Loop' : 'Play Radar Loop'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        {/* Step Prev */}
        <button
          onClick={() => handleStep('prev')}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Previous 10-minute sweep"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Timeline Slider with Ticks */}
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min="0"
            max={frames.length - 1}
            value={currentFrameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentFrameIndex(parseInt(e.target.value, 10));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
            <span>-2 hours</span>
            <span className="text-cyan-400 font-bold">Nowcast Doppler</span>
            <span className="text-emerald-400 font-bold">Live (0m)</span>
          </div>
        </div>

        {/* Step Next */}
        <button
          onClick={() => handleStep('next')}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Next 10-minute sweep"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Radar Reflectivity Legend & Layer Distinction Notice */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[9px] text-slate-400">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-300">Weather Radar (dBZ):</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded bg-cyan-400"></span> Light (5-15)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded bg-emerald-400"></span> Moderate (15-30)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded bg-amber-400"></span> Heavy (30-45)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded bg-red-500"></span> Storm (&gt;45)</span>
          </div>
        </div>
        <span className="text-[8px] text-slate-400 italic">
          Meteorological weather layer &bull; Separate from ground-measured water levels
        </span>
      </div>
    </div>
  );
};
