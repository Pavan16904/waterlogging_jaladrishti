import React, { useState, useEffect, useMemo } from 'react';
import { DrainageAdvisory, SeverityZone, StudyArea } from '../types';
import { api } from '../services/api';
import { 
  ShieldAlert, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  FileDown, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Layers, 
  MapPin, 
  Zap,
  Droplet,
  IndianRupee,
  Building2,
  HardHat,
  ChevronRight,
  Activity,
  RefreshCw,
  Send,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrainageActionsPageProps {
  advisories: DrainageAdvisory[];
  zones: SeverityZone[];
  studyArea: StudyArea | null;
  onOpenExportModal: () => void;
  onNavigateToMap: () => void;
}

export const DrainageActionsPage: React.FC<DrainageActionsPageProps> = ({
  advisories,
  zones,
  studyArea,
  onOpenExportModal,
  onNavigateToMap
}) => {
  const [actionList, setActionList] = useState<DrainageAdvisory[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [agencyFilter, setAgencyFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);

  // Sync action list directly from live database advisories
  useEffect(() => {
    if (advisories && advisories.length > 0) {
      setActionList(advisories);
    } else {
      loadStatewideAdvisories();
    }
  }, [advisories, studyArea]);

  const loadStatewideAdvisories = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllAdvisories();
      if (data && data.length > 0) {
        setActionList(data);
      }
    } catch (err) {
      console.error('Failed to load database drainage advisories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Interactive status toggle: Pending Dispatch -> In Progress -> Completed -> Pending Dispatch
  const handleToggleStatus = (id: string) => {
    setActionList((prev) =>
      prev.map((adv) => {
        if (adv.id !== id) return adv;
        const currentStatus = adv.status || (adv.mitigation_actions as any)?.status || 'Pending Dispatch';
        let nextStatus = 'In Progress';
        if (currentStatus === 'Pending Dispatch') nextStatus = 'In Progress';
        else if (currentStatus === 'In Progress') nextStatus = 'Completed';
        else if (currentStatus === 'Completed') nextStatus = 'Pending Dispatch';
        else nextStatus = 'In Progress';

        setDispatchNotice(`Updated protocol for "${adv.zone_name}" to ${nextStatus.toUpperCase()}`);
        setTimeout(() => setDispatchNotice(null), 3000);

        return {
          ...adv,
          status: nextStatus
        };
      })
    );
  };

  // Helper to extract structured metadata
  const getAdvisoryDetails = (adv: DrainageAdvisory) => {
    const meta = typeof adv.mitigation_actions === 'object' && !Array.isArray(adv.mitigation_actions) && adv.mitigation_actions !== null
      ? (adv.mitigation_actions as any)
      : {};

    const headline = adv.title || adv.action_headline || `Emergency Remediation: ${adv.zone_name}`;
    const intervention = adv.action_recommendation || adv.primary_intervention || adv.diagnosis || 'Deploy mobile dewatering pumps and clear silt obstructions from downstream channels.';
    
    let equipment: string[] = [];
    if (adv.equipment_required && Array.isArray(adv.equipment_required)) {
      equipment = adv.equipment_required;
    } else if (meta.equipment_required && Array.isArray(meta.equipment_required)) {
      equipment = meta.equipment_required;
    } else if (Array.isArray(adv.mitigation_actions)) {
      equipment = adv.mitigation_actions;
    } else {
      equipment = ['High-Capacity Diesel Pumps', 'Tracked Excavator', 'Emergency Silt Jetter'];
    }

    const agency = adv.agency || meta.agency || 'BBMP Stormwater Management / KSDMA';
    const timeline = adv.timeline || meta.timeline || (adv.urgency_score >= 90 ? 'Deploy within 4 hours' : 'Deploy within 12-24 hours');
    const estimatedCost = adv.estimated_cost_inr || meta.estimated_cost_inr || (adv.estimated_volume_m3 ? `₹ ${(Math.round(adv.estimated_volume_m3 * 4.5)).toLocaleString('en-IN')}` : '₹ 3,20,000');
    const status = adv.status || meta.status || 'Pending Dispatch';

    return { headline, intervention, equipment, agency, timeline, estimatedCost, status };
  };

  // Filtering
  const filtered = useMemo(() => {
    return actionList.filter((adv) => {
      const details = getAdvisoryDetails(adv);
      const matchesPriority = priorityFilter === 'All' || adv.priority.includes(priorityFilter);
      const matchesAgency = agencyFilter === 'All' || details.agency.toLowerCase().includes(agencyFilter.toLowerCase());
      const matchesSearch =
        adv.zone_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        details.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        details.agency.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPriority && matchesAgency && matchesSearch;
    });
  }, [actionList, priorityFilter, agencyFilter, searchQuery]);

  const criticalCount = actionList.filter((a) => a.priority.includes('Priority 1') || a.urgency_score >= 85).length;
  const highCount = actionList.filter((a) => a.priority.includes('Priority 2') || (a.urgency_score >= 60 && a.urgency_score < 85)).length;
  const routineCount = actionList.filter((a) => a.priority.includes('Priority 3') || a.urgency_score < 60).length;

  const completedCount = actionList.filter((a) => {
    const d = getAdvisoryDetails(a);
    return d.status === 'Completed';
  }).length;

  const totalVolumeM3 = useMemo(() => {
    return actionList.reduce((acc, curr) => acc + (curr.estimated_volume_m3 || 0), 0);
  }, [actionList]);

  return (
    <div className="flex-1 w-full overflow-y-auto pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Page Header */}
        <div className="pb-4 border-b border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full badge-rose text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Civil Engineering Mitigation & Municipal Dispatch
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                &bull; Active Basin: <strong className="text-slate-200">{studyArea?.name || 'Karnataka Multi-District Network'}</strong>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-2">
              Rule-Based Drainage Advisory & Action Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Autonomous civil intervention protocols and heavy machinery work orders derived from multi-sensor radar backscatter, slope gradience, and hydraulic ponding depth.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToMap}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-cyan-400 transition-all shadow-sm active:scale-95"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Inspect on Map</span>
            </button>

            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-rose-500/25 transition-all active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Work Order PDF</span>
            </button>
          </div>
        </div>

        {/* Real-Time Interactive Dispatch Toast */}
        <AnimatePresence>
          {dispatchNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-400 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/10"
            >
              <Check className="w-4 h-4" />
              <span>{dispatchNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Operational Dispatch Meter & Telemetry Strip */}
        <div className="p-6 rounded-3xl glass-card border border-slate-200 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                <span>Hydraulic Remediation Progress & Resource Deployment</span>
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {actionList.length} Active Protocols generated from database inference runs
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono font-black">
              <span className="text-rose-400">{criticalCount} Critical</span>
              <span className="text-amber-400">{highCount} High</span>
              <span className="text-emerald-400">{routineCount} Routine</span>
              <span className="text-slate-400">({completedCount} Dispatched/Done)</span>
            </div>
          </div>

          {/* Stacked Visual Urgency Bar */}
          <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden flex border border-white/5">
            <div
              style={{ width: `${actionList.length > 0 ? (criticalCount / actionList.length) * 100 : 0}%` }}
              className="h-full bg-rose-500 transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
              title={`${criticalCount} Critical Protocols`}
            />
            <div
              style={{ width: `${actionList.length > 0 ? (highCount / actionList.length) * 100 : 0}%` }}
              className="h-full bg-amber-500 transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              title={`${highCount} High Priority`}
            />
            <div
              style={{ width: `${actionList.length > 0 ? (routineCount / actionList.length) * 100 : 0}%` }}
              className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
              title={`${routineCount} Routine Protocols`}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-white/5 font-medium">
            <span>Click any status pill on the action cards below to toggle field crew deployment state.</span>
            <div className="flex items-center gap-4 font-mono font-bold">
              <span className="text-cyan-400">
                Total Stagnant Volume: ~{Math.round(totalVolumeM3 / 1000)}k m³
              </span>
              <span className="text-slate-300">
                Est. Basin Budget: ₹ 14,80,000
              </span>
            </div>
          </div>
        </div>

        {/* Priority Filter KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            onClick={() => setPriorityFilter(priorityFilter === 'Priority 1' ? 'All' : 'Priority 1')}
            className={`p-6 rounded-3xl glass-card border cursor-pointer transition-all card-hover ${
              priorityFilter === 'Priority 1' ? 'border-rose-500 ring-2 ring-rose-500/30 shadow-lg' : 'border-slate-200 dark:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                Priority 1 (Critical Hazard)
              </span>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-rose-500 font-mono">{criticalCount}</span>
              <span className="text-xs text-slate-400 font-bold">Immediate Work Orders</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Water depth &gt; 45 cm. High-head diesel pumps deployed within 4h to avert life/crop hazard.
            </p>
          </div>

          <div 
            onClick={() => setPriorityFilter(priorityFilter === 'Priority 2' ? 'All' : 'Priority 2')}
            className={`p-6 rounded-3xl glass-card border cursor-pointer transition-all card-hover ${
              priorityFilter === 'Priority 2' ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg' : 'border-slate-200 dark:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                Priority 2 (High Intervention)
              </span>
              <Wrench className="w-5 h-5 text-amber-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-amber-500 font-mono">{highCount}</span>
              <span className="text-xs text-slate-400 font-bold">Civil Projects</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sluice gate relief, perforated PVC subsurface tile trenching, and canal desiltation within 12-24h.
            </p>
          </div>

          <div 
            onClick={() => setPriorityFilter(priorityFilter === 'Priority 3' ? 'All' : 'Priority 3')}
            className={`p-6 rounded-3xl glass-card border cursor-pointer transition-all card-hover ${
              priorityFilter === 'Priority 3' ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg' : 'border-slate-200 dark:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                Priority 3 (Routine Maintenance)
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-500 font-mono">{routineCount}</span>
              <span className="text-xs text-slate-400 font-bold">Standard Operations</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Gravity swale regrading, ditch aeration, and stormwater inlet trash screen cleaning within 48h.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl glass-card border border-slate-200 dark:border-white/10 shadow-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Priority:
            </span>
            {['All', 'Priority 1', 'Priority 2', 'Priority 3'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  priorityFilter === p
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden sm:block" />

            {/* Agency Chips */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-400 mr-1 hidden sm:inline">Agency:</span>
              {['All', 'BBMP', 'KSDMA', 'Water Resources', 'Agriculture'].map((ag) => (
                <button
                  key={ag}
                  onClick={() => setAgencyFilter(ag)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    agencyFilter === ag
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action, zone, agency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-2xl glass-card text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Action Cards List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-card border border-slate-200 dark:border-white/10 space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                No Drainage Advisories Match Filter
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No active mitigation protocols found for the selected criteria. Try adjusting the priority or agency filter above.
              </p>
            </div>
          ) : (
            filtered.map((adv, idx) => {
              const details = getAdvisoryDetails(adv);
              const isCritical = adv.priority.includes('Priority 1') || adv.urgency_score >= 85;
              const isHigh = adv.priority.includes('Priority 2') || (adv.urgency_score >= 60 && adv.urgency_score < 85);

              return (
                <div
                  key={adv.id || idx}
                  className={`p-6 rounded-3xl glass-card border transition-all card-hover space-y-4 ${
                    isCritical
                      ? 'border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-slate-900/40 to-transparent shadow-xl'
                      : isHigh
                      ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-transparent shadow-md'
                      : 'border-slate-200 dark:border-white/10'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${
                        isCritical ? 'bg-rose-500/20 text-rose-500' : isHigh ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {isCritical ? <AlertTriangle className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isCritical ? 'badge-rose' : isHigh ? 'badge-amber' : 'badge-emerald'
                          }`}>
                            {adv.priority}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            Urgency Score: <strong className="text-white">{adv.urgency_score}</strong>/100
                          </span>
                        </div>

                        <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">
                          {details.headline}
                        </h3>
                      </div>
                    </div>

                    {/* Zone & Timeline Pill */}
                    <div className="flex items-center gap-3 text-right">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Target Catchment</span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200">{adv.zone_name}</span>
                      </div>
                      <div className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 inline mr-1.5 text-sky-400" />
                        {details.timeline}
                      </div>
                    </div>
                  </div>

                  {/* Primary Intervention Description */}
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {details.intervention}
                  </p>

                  {/* Machinery, Authority, Budget & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <HardHat className="w-3.5 h-3.5 text-amber-400" /> Machinery & Equipment:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {details.equipment.map((eq, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-white/5">
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Municipal Authority:
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-200 block text-xs mt-0.5">
                        {details.agency}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider flex items-center gap-0.5">
                          <IndianRupee className="w-3 h-3 text-emerald-400" /> Estimated Cost:
                        </span>
                        <span className="font-black text-cyan-400 font-mono text-base">
                          {details.estimatedCost}
                        </span>
                      </div>

                      {/* Interactive Status Switcher */}
                      <button
                        onClick={() => handleToggleStatus(adv.id)}
                        title="Click to toggle deployment status"
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm ${
                          details.status === 'Completed'
                            ? 'badge-emerald hover:bg-emerald-500/20'
                            : details.status === 'In Progress'
                            ? 'badge-cyan hover:bg-cyan-500/20'
                            : 'badge-rose hover:bg-rose-500/20'
                        }`}
                      >
                        {details.status}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
