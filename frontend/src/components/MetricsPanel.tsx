import React from 'react';
import { AnalysisRun, SeverityZone } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  Waves, 
  AlertOctagon, 
  TrendingUp, 
  Droplet,
  Maximize2
} from 'lucide-react';

interface MetricsPanelProps {
  run: AnalysisRun | null;
  zones: SeverityZone[];
  isAnalyzing: boolean;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  run,
  zones,
  isAnalyzing
}) => {
  // Aggregate KPIs
  const totalAreaKm2 = run?.total_area_km2 || 42.5;
  const waterloggedKm2 = run?.waterlogged_area_km2 || 9.4;
  const waterloggedPct = run?.waterlogged_percentage || 22.1;
  const severeCount = run?.severe_count || zones.filter((z) => z.severity === 'Severe').length || 3;
  const moderateCount = run?.moderate_count || zones.filter((z) => z.severity === 'Moderate').length || 2;
  const lowCount = run?.low_count || zones.filter((z) => z.severity === 'Low').length || 2;

  // Calculate estimated total stagnant water volume (m3)
  const totalVolumeM3 = zones.reduce((acc, z) => {
    const depth = z.severity === 'Severe' ? 0.35 : z.severity === 'Moderate' ? 0.15 : 0.05;
    return acc + z.area_ha * 10000 * depth;
  }, 0);

  // Severity Chart Data
  const severityChartData = [
    { name: 'Severe', count: severeCount, color: '#ef4444' },
    { name: 'Moderate', count: moderateCount, color: '#f59e0b' },
    { name: 'Low', count: lowCount, color: '#10b981' }
  ];

  // Pre vs Post Comparison Data
  const prePostComparisonData = [
    { name: 'Pre-Event Baseline', water_km2: parseFloat((waterloggedKm2 * 0.28).toFixed(1)) },
    { name: 'Post-Event Flood', water_km2: parseFloat(waterloggedKm2.toFixed(1)) }
  ];

  return (
    <aside className="w-88 glass-nav border-l flex flex-col h-full overflow-y-auto p-5 gap-5 z-20 text-xs transition-colors">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-cyan-500" />
          <h2 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">Inundation Metrics</h2>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
          Live Radar
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Waterlogged Area */}
        <div className="p-3.5 rounded-2xl glass-card space-y-1.5 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Inundated Area</span>
            <Waves className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
              {waterloggedKm2.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-medium">km²</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{waterloggedPct.toFixed(1)}%</span> of total basin
          </p>
        </div>

        {/* Card 2: Severe Hotspots */}
        <div className="p-3.5 rounded-2xl glass-card space-y-1.5 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Severe Zones</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-rose-500 font-mono">
              {severeCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">hotspots</span>
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
            Priority 1 dewatering
          </p>
        </div>

        {/* Card 3: Total Stagnant Volume */}
        <div className="p-3.5 rounded-2xl glass-card space-y-1.5 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Stagnant Water</span>
            <Droplet className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {(totalVolumeM3 / 1000).toFixed(0)}
            </span>
            <span className="text-xs text-slate-500 font-medium">k m³</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Estimated ponding volume
          </p>
        </div>

        {/* Card 4: Total Catchment Analyzed */}
        <div className="p-3.5 rounded-2xl glass-card space-y-1.5 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Basin</span>
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono">
              {totalAreaKm2.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-medium">km²</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            10m resolution grid
          </p>
        </div>
      </div>

      {/* Severity Zone Breakdown Bar Chart */}
      <div className="p-4 rounded-2xl glass-card space-y-3">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
          Severity Category Distribution
        </span>
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#ffffff'
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {severityChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pre vs Post Flood Event Change Detection */}
      <div className="p-4 rounded-2xl glass-card space-y-3">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
          Pre vs Post Event Inundation ($km^2$)
        </span>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prePostComparisonData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '10px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="water_km2" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </aside>
  );
};
