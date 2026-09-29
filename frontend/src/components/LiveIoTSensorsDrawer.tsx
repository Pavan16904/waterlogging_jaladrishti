import React, { useState } from 'react';
import { 
  Radio, 
  X, 
  Activity, 
  Zap, 
  AlertTriangle, 
  ShieldCheck, 
  Power, 
  Gauge, 
  BatteryCharging, 
  Sun, 
  Signal, 
  RotateCw,
  Sliders,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Flame,
  CheckCircle2,
  Droplets
} from 'lucide-react';
import { IoTSensor } from '../types';
import { api } from '../services/api';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface LiveIoTSensorsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sensors: IoTSensor[];
  onRefresh: () => void;
  onSelectSensorOnMap?: (sensor: IoTSensor) => void;
}

export const LiveIoTSensorsDrawer: React.FC<LiveIoTSensorsDrawerProps> = ({
  isOpen,
  onClose,
  sensors,
  onRefresh,
  onSelectSensorOnMap
}) => {
  const [filter, setFilter] = useState<'all' | 'alarms' | 'active_pumps'>('all');
  const [actuatingId, setActuatingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalSensors = sensors.length;
  const criticalAlarms = sensors.filter(s => s.currentDepthM >= s.dangerThresholdM);
  const activePumps = sensors.filter(s => s.pumpStatus === 'AUTO_RUNNING' || s.pumpStatus === 'MANUAL_ON' || s.pumpStatus === 'EMERGENCY_BOOST');
  const totalDischargeLps = sensors.reduce((acc, s) => {
    return acc + (s.pumpStatus !== 'AUTO_IDLE' && s.pumpStatus !== 'MANUAL_OFF' ? s.pumpDischargeLps : 0);
  }, 0);

  const displayedSensors = sensors.filter(s => {
    if (filter === 'alarms') return s.currentDepthM >= s.warningThresholdM;
    if (filter === 'active_pumps') return s.pumpStatus !== 'AUTO_IDLE' && s.pumpStatus !== 'MANUAL_OFF';
    return true;
  });

  const handlePumpCommand = async (sensor: IoTSensor, command: 'AUTO' | 'MANUAL_ON' | 'MANUAL_OFF' | 'EMERGENCY_BOOST') => {
    try {
      setActuatingId(sensor.id);
      await api.updatePumpActuator(sensor.id, command);
      onRefresh();
    } catch (err) {
      console.error('Failed to trigger pump actuator:', err);
    } finally {
      setActuatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Live IoT Flood Sensors</h2>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Telemetry Stream Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ultrasonic underpass sumps, lake outfall inverts, and automated pump actuators
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Refresh Telemetry"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100/60 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Online Sensors</span>
            <span className="text-xl font-black text-cyan-400 font-mono">{totalSensors}</span>
            <span className="text-[9px] text-emerald-500 block font-medium">100% Nodes Reporting</span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Critical Surcharge</span>
            <span className={`text-xl font-black font-mono ${criticalAlarms.length > 0 ? 'text-red-500' : 'text-emerald-400'}`}>
              {criticalAlarms.length}
            </span>
            <span className="text-[9px] text-slate-400 block">&gt; Danger Ceiling</span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Active Pumps</span>
            <span className="text-xl font-black text-amber-400 font-mono">{activePumps.length}</span>
            <span className="text-[9px] text-amber-500/90 block font-medium">High-Head Units</span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Total Discharge</span>
            <span className="text-xl font-black text-sky-400 font-mono">{totalDischargeLps.toLocaleString()}</span>
            <span className="text-[9px] text-sky-500 block">Liters / Second</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filter === 'all'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              All Nodes ({sensors.length})
            </button>
            <button
              onClick={() => setFilter('alarms')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filter === 'alarms'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              Alarms / High Sump ({sensors.filter(s => s.currentDepthM >= s.warningThresholdM).length})
            </button>
            <button
              onClick={() => setFilter('active_pumps')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filter === 'active_pumps'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              Dewatering Active ({activePumps.length})
            </button>
          </div>

          <span className="text-[10px] text-slate-400 font-mono">Live 8s Interval</span>
        </div>

        {/* Sensors List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {displayedSensors.map((sensor) => {
            const isDanger = sensor.currentDepthM >= sensor.dangerThresholdM;
            const isWarning = sensor.currentDepthM >= sensor.warningThresholdM && !isDanger;
            const pctCapacity = Math.min(100, Math.round((sensor.currentDepthM / sensor.maxDepthM) * 100));

            return (
              <div
                key={sensor.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDanger
                    ? 'bg-red-500/5 dark:bg-red-950/20 border-red-500/40 shadow-lg shadow-red-500/10'
                    : isWarning
                    ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                {/* Top Info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {sensor.name}
                      </span>
                      {isDanger && (
                        <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 font-extrabold text-[10px] border border-red-500/30 uppercase animate-pulse">
                          CRITICAL ALARM
                        </span>
                      )}
                      {isWarning && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-extrabold text-[10px] border border-amber-500/30 uppercase">
                          WARNING
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="text-cyan-400">{sensor.districtName}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-400">ID: {sensor.id}</span>
                      {onSelectSensorOnMap && (
                        <button
                          onClick={() => {
                            onSelectSensorOnMap(sensor);
                            onClose();
                          }}
                          className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 ml-1 font-bold underline"
                        >
                          <MapPin className="w-3 h-3" /> Focus on Map
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Trend Badge */}
                  <div className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {sensor.trend === 'rising' ? (
                      <span className="flex items-center gap-1 text-red-400">
                        <TrendingUp className="w-3.5 h-3.5" /> Rising
                      </span>
                    ) : sensor.trend === 'falling' ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <TrendingDown className="w-3.5 h-3.5" /> Falling
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Minus className="w-3.5 h-3.5" /> Steady
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Water Level Visual Gauge */}
                <div className="mb-4">
                  <div className="flex justify-between items-baseline text-xs mb-1.5 font-mono">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Current Inundation Depth:</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-xl font-black ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-cyan-400'}`}>
                        {(sensor.currentDepthM * 100).toFixed(0)} cm
                      </span>
                      <span className="text-xs text-slate-500 font-sans">({pctCapacity}% Sump Capacity)</span>
                    </div>
                  </div>

                  {/* Progress Bar with Warning / Danger Threshold Tick Marks */}
                  <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-750 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isDanger
                          ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                          : isWarning
                          ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                          : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                      }`}
                      style={{ width: `${pctCapacity}%` }}
                    ></div>
                    {/* Threshold Markers */}
                    <span
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
                      style={{ left: `${(sensor.warningThresholdM / sensor.maxDepthM) * 100}%` }}
                      title={`Warning: ${sensor.warningThresholdM}m`}
                    ></span>
                    <span
                      className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                      style={{ left: `${(sensor.dangerThresholdM / sensor.maxDepthM) * 100}%` }}
                      title={`Danger: ${sensor.dangerThresholdM}m`}
                    ></span>
                  </div>

                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                    <span>0m</span>
                    <span>Warn: {(sensor.warningThresholdM * 100).toFixed(0)}cm</span>
                    <span>Ceiling: {(sensor.dangerThresholdM * 100).toFixed(0)}cm</span>
                    <span>Max: {(sensor.maxDepthM * 100).toFixed(0)}cm</span>
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Flow Inflow</span>
                    <span className="font-mono font-bold text-sky-400">{sensor.flowRateLps} L/s</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Siltation Invert</span>
                    <span className="font-mono font-bold text-amber-400">{sensor.siltationPct}% Silt</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Battery / Solar</span>
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <BatteryCharging className="w-3 h-3" /> {sensor.batteryPct}% ({sensor.solarWatts}W)
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Signal 4G</span>
                    <span className="font-mono font-bold text-slate-300 flex items-center gap-1">
                      <Signal className="w-3 h-3 text-cyan-400" /> {sensor.signalDbm} dBm
                    </span>
                  </div>
                </div>

                {/* Mini Historical Sparkline Hydrograph */}
                {sensor.history && sensor.history.length > 0 && (
                  <div className="mb-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1.5 font-mono">
                      <span>Live 60-Min Inundation Hydrograph</span>
                      <span className="text-cyan-400">Depth (m)</span>
                    </div>
                    <div className="h-16 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sensor.history}>
                          <defs>
                            <linearGradient id={`grad_${sensor.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={isDanger ? '#ef4444' : '#06b6d4'} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={isDanger ? '#ef4444' : '#06b6d4'} stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" hide />
                          <YAxis domain={['auto', 'auto']} hide />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }}
                            formatter={(val: any) => [`${val} m`, 'Water Depth']}
                          />
                          <Area
                            type="monotone"
                            dataKey="depthM"
                            stroke={isDanger ? '#f87171' : '#22d3ee'}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#grad_${sensor.id})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Remote Dewatering Pump Control Section */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-cyan-400">
                      <Power className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Submersible Pump ({sensor.pumpCapacityHp} HP • {sensor.pumpDischargeLps} L/s)
                      </span>
                      <span className={`font-mono font-extrabold text-xs ${
                        sensor.pumpStatus === 'EMERGENCY_BOOST'
                          ? 'text-red-400 animate-pulse'
                          : sensor.pumpStatus === 'AUTO_RUNNING' || sensor.pumpStatus === 'MANUAL_ON'
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}>
                        {sensor.pumpStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Remote Actuator Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={actuatingId === sensor.id}
                      onClick={() => handlePumpCommand(sensor, 'AUTO')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        sensor.pumpStatus.startsWith('AUTO')
                          ? 'bg-cyan-500 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      AUTO
                    </button>
                    <button
                      disabled={actuatingId === sensor.id}
                      onClick={() => handlePumpCommand(sensor, 'MANUAL_ON')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        sensor.pumpStatus === 'MANUAL_ON'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      FORCE ON
                    </button>
                    <button
                      disabled={actuatingId === sensor.id}
                      onClick={() => handlePumpCommand(sensor, 'EMERGENCY_BOOST')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        sensor.pumpStatus === 'EMERGENCY_BOOST'
                          ? 'bg-red-500 text-white shadow-sm animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-red-400 hover:bg-red-500/20'
                      }`}
                    >
                      BOOST
                    </button>
                    <button
                      disabled={actuatingId === sensor.id}
                      onClick={() => handlePumpCommand(sensor, 'MANUAL_OFF')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        sensor.pumpStatus === 'MANUAL_OFF'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      OFF
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
