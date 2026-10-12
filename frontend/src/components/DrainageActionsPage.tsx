import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { DrainageAdvisory, SeverityZone, StudyArea } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  FileDown, 
  Search, 
  Filter, 
  MapPin, 
  IndianRupee, 
  Building2, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  ExternalLink, 
  Layers, 
  Info, 
  Calendar, 
  ClipboardList, 
  ArrowUpDown, 
  Check, 
  X, 
  Wrench, 
  HardHat,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { KARNATAKA_31_DISTRICTS_WEATHER } from '../data/karnatakaDistrictsWeather';

export interface ActionItem {
  id: number;
  priority: 'Critical' | 'High' | 'Routine';
  location: string;
  asset: string;
  district: string;
  actionTitle: string;
  actionDesc: string;
  agency: string;
  subAgency: string;
  costLakh: number;
  costDisplay: string;
  status: 'Advisory Guidance' | 'In Progress' | 'Completed';
  responsibility: 'Farm Level' | 'Community' | 'Municipal / District';
  laborEquipment: string;
  reason: string;
  expectedBenefit: string;
  dispatchedAt?: string;
  completedAt?: string;
}

const INITIAL_ACTIONS: ActionItem[] = [
  {
    id: 1,
    priority: 'Critical',
    location: 'Sanganakal Village',
    asset: 'Field Drainage Channel',
    district: 'Ballari, Karnataka',
    actionTitle: 'Clear field drainage channel (desilting)',
    actionDesc: 'Remove silt and vegetation to restore flow from low-lying paddy fields to the downstream drain.',
    agency: 'Rural Development Dept. (RDPR)',
    subAgency: 'Taluk Panchayat',
    costLakh: 1.8,
    costDisplay: '₹ 1.8 lakh',
    status: 'Advisory Guidance',
    responsibility: 'Community',
    laborEquipment: '12 Field laborers · 1 Backhoe loader (JCB) · Silt disposal tractor trailer',
    reason: 'Forecasted heavy rainfall (50–80 mm in 3 days) and high soil moisture',
    expectedBenefit: 'Improve field drainage and reduce waterlogging risk (model-based)'
  },
  {
    id: 2,
    priority: 'Critical',
    location: 'Ballari Town',
    asset: 'Municipal Stormwater Outfall',
    district: 'Ballari, Karnataka',
    actionTitle: 'Remove trash and clear outfall',
    actionDesc: 'Clear solid waste and debris at outfall to improve discharge capacity before forecasted rainfall.',
    agency: 'Urban Local Body (ULB)',
    subAgency: 'Ballari City Municipal Council',
    costLakh: 2.5,
    costDisplay: '₹ 2.5 lakh',
    status: 'Advisory Guidance',
    responsibility: 'Municipal / District',
    laborEquipment: '8 Sanitation workers · High-capacity mobile trash jetter · Silt grab bucket crane',
    reason: 'Debris blockage restricting municipal gravity outfall into downstream canal',
    expectedBenefit: 'Avert urban road inundation and basement waterlogging in low-lying wards'
  },
  {
    id: 3,
    priority: 'High',
    location: 'Kurekuvu Village',
    asset: 'Field Drainage Bund',
    district: 'Ballari, Karnataka',
    actionTitle: 'Strengthen drainage bund',
    actionDesc: 'Reinforce low bund section and provide temporary spillway to prevent water stagnation in fields.',
    agency: 'Agriculture Dept.',
    subAgency: 'Ballari',
    costLakh: 1.2,
    costDisplay: '₹ 1.2 lakh',
    status: 'Advisory Guidance',
    responsibility: 'Farm Level',
    laborEquipment: '5 Farm hands · 200 sandbags · Earthen compaction rammers',
    reason: 'Overtopping risk from adjacent irrigation channel overflow',
    expectedBenefit: 'Prevent root asphyxiation across 45 hectares of standing crops'
  },
  {
    id: 4,
    priority: 'High',
    location: 'Toranagallu Area',
    asset: 'Urban Drain',
    district: 'Ballari, Karnataka',
    actionTitle: 'Desilt minor drain',
    actionDesc: 'Remove silt buildup in secondary drain to improve flow to main stormwater channel.',
    agency: 'Urban Local Body (ULB)',
    subAgency: 'Toranagallu Town',
    costLakh: 0.9,
    costDisplay: '₹ 0.9 lakh',
    status: 'Advisory Guidance',
    responsibility: 'Municipal / District',
    laborEquipment: '6 ULB workers · Tractor-mounted silt blade · Safety barriers',
    reason: 'Secondary culvert restricted by recent construction sediment runoff',
    expectedBenefit: 'Restore designed gravity velocity and prevent localized street flooding'
  },
  {
    id: 5,
    priority: 'High',
    location: 'Hosapete Road Belt',
    asset: 'Roadside Drain',
    district: 'Ballari, Karnataka',
    actionTitle: 'Clear vegetation and debris',
    actionDesc: 'Remove vegetation and debris to restore drain capacity along the road stretch.',
    agency: 'Public Works Dept. (PWD)',
    subAgency: 'Ballari Division',
    costLakh: 1.0,
    costDisplay: '₹ 1.0 lakh',
    status: 'Advisory Guidance',
    responsibility: 'Municipal / District',
    laborEquipment: '1 PWD road maintenance crew · Brush cutters · Debris haulage tipper',
    reason: 'Wild grass and plastic choking roadside shoulder drain over 1.2 km',
    expectedBenefit: 'Eliminate hydroplaning risk on arterial state highway'
  },
  {
    id: 6,
    priority: 'Routine',
    location: 'Kamalapuram Village',
    asset: 'Field Outlet',
    district: 'Ballari, Karnataka',
    actionTitle: 'Monitor and schedule maintenance',
    actionDesc: 'Plan desilting after current rainfall period. Monitor water levels and field conditions.',
    agency: 'Agriculture Dept.',
    subAgency: 'Ballari',
    costLakh: 0.6,
    costDisplay: '₹ 0.6 lakh',
    status: 'Advisory Guidance',
    responsibility: 'Farm Level',
    laborEquipment: 'Village field scout · Hand spade & staff gauge indicator',
    reason: 'Early sediment accumulation without immediate overtopping threat',
    expectedBenefit: 'Schedule preventive maintenance prior to flowering stage'
  },
  {
    id: 7,
    priority: 'Routine',
    location: 'Ballari East',
    asset: 'Stormwater Drain',
    district: 'Ballari, Karnataka',
    actionTitle: 'Routine inspection',
    actionDesc: 'Schedule routine inspection and minor clearing if needed.',
    agency: 'Urban Local Body (ULB)',
    subAgency: 'Ballari City Municipal Council',
    costLakh: 0.4,
    costDisplay: '₹ 0.4 lakh',
    status: 'Advisory Guidance',
    responsibility: 'Municipal / District',
    laborEquipment: '2 Municipal inspectors · Trash rakes',
    reason: 'Quarterly municipal drainage maintenance schedule',
    expectedBenefit: 'Verify unimpeded culvert transit and intact grating'
  },
  {
    id: 8,
    priority: 'Routine',
    location: 'Anegundi Taluk',
    asset: 'Field Drainage Channel',
    district: 'Ballari, Karnataka',
    actionTitle: 'Monitor water levels',
    actionDesc: 'Continue monitoring. Take action if conditions worsen.',
    agency: 'Agriculture Dept.',
    subAgency: 'Ballari',
    costLakh: 0.5,
    costDisplay: '₹ 0.5 lakh',
    status: 'Advisory Guidance',
    responsibility: 'Community',
    laborEquipment: 'Local watershed committee volunteer · Visual gauge board',
    reason: 'Downstream river backwater buffer zone monitoring',
    expectedBenefit: 'Early warning trigger if Tungabhadra canal gates are operated'
  }
];

interface DrainageActionsPageProps {
  advisories?: DrainageAdvisory[];
  zones?: SeverityZone[];
  studyArea?: StudyArea | null;
  onOpenExportModal?: () => void;
  onNavigateToMap?: () => void;
}

// Generate district-specific drainage actions from district metadata
function generateDistrictActions(districtId: string, districtName: string, basinName: string, taluks: string[]): ActionItem[] {
  const seed = districtId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (n: number) => { const x = Math.sin(seed + n) * 10000; return x - Math.floor(x); };
  const taluk1 = taluks[0] || `${districtName} Central`;
  const taluk2 = taluks[1] || `${districtName} North`;
  const taluk3 = taluks[2] || `${districtName} South`;
  const costBase = 0.8 + rng(1) * 2.0;
  return [
    {
      id: 1, priority: 'Critical', location: `${taluk1} Village`, asset: 'Field Drainage Channel', district: `${districtName}, Karnataka`,
      actionTitle: `Clear field drainage channel (desilting) — ${basinName}`,
      actionDesc: `Remove silt and vegetation to restore flow from low-lying agricultural fields to the downstream drain in ${taluk1}.`,
      agency: 'Rural Development Dept. (RDPR)', subAgency: `${districtName} Taluk Panchayat`,
      costLakh: Math.round(costBase * 10) / 10, costDisplay: `₹ ${Math.round(costBase * 10) / 10} lakh`,
      status: 'Advisory Guidance', responsibility: 'Community',
      laborEquipment: '12 Field laborers · 1 Backhoe loader (JCB) · Silt disposal tractor trailer',
      reason: `Forecasted heavy rainfall and high soil moisture in ${basinName}`,
      expectedBenefit: 'Improve field drainage and reduce waterlogging risk (model-based)'
    },
    {
      id: 2, priority: 'Critical', location: `${districtName} Town`, asset: 'Municipal Stormwater Outfall', district: `${districtName}, Karnataka`,
      actionTitle: 'Remove trash and clear outfall',
      actionDesc: `Clear solid waste and debris at outfall to improve discharge capacity before forecasted rainfall in ${districtName}.`,
      agency: 'Urban Local Body (ULB)', subAgency: `${districtName} City Municipal Council`,
      costLakh: Math.round((costBase + 0.8) * 10) / 10, costDisplay: `₹ ${Math.round((costBase + 0.8) * 10) / 10} lakh`,
      status: 'Advisory Guidance', responsibility: 'Municipal / District',
      laborEquipment: '8 Sanitation workers · High-capacity mobile trash jetter · Silt grab bucket crane',
      reason: 'Debris blockage restricting municipal gravity outfall',
      expectedBenefit: 'Avert urban road inundation and basement waterlogging'
    },
    {
      id: 3, priority: 'High', location: `${taluk2} Village`, asset: 'Field Drainage Bund', district: `${districtName}, Karnataka`,
      actionTitle: 'Strengthen drainage bund',
      actionDesc: `Reinforce low bund section and provide temporary spillway to prevent water stagnation in ${taluk2} fields.`,
      agency: 'Agriculture Dept.', subAgency: districtName,
      costLakh: Math.round((costBase - 0.1) * 10) / 10, costDisplay: `₹ ${Math.round((costBase - 0.1) * 10) / 10} lakh`,
      status: 'Advisory Guidance', responsibility: 'Farm Level',
      laborEquipment: '5 Farm hands · 200 sandbags · Earthen compaction rammers',
      reason: 'Overtopping risk from adjacent irrigation channel overflow',
      expectedBenefit: 'Prevent root asphyxiation across agricultural fields'
    },
    {
      id: 4, priority: 'High', location: `${taluk3} Area`, asset: 'Urban Drain', district: `${districtName}, Karnataka`,
      actionTitle: 'Desilt minor drain',
      actionDesc: `Remove silt buildup in secondary drain to improve flow to main stormwater channel in ${taluk3}.`,
      agency: 'Urban Local Body (ULB)', subAgency: `${taluk3} Town`,
      costLakh: Math.round((costBase - 0.2) * 10) / 10, costDisplay: `₹ ${Math.round((costBase - 0.2) * 10) / 10} lakh`,
      status: 'Advisory Guidance', responsibility: 'Municipal / District',
      laborEquipment: '6 ULB workers · Tractor-mounted silt blade · Safety barriers',
      reason: 'Secondary culvert restricted by recent construction sediment runoff',
      expectedBenefit: 'Restore designed gravity velocity and prevent localized street flooding'
    },
    {
      id: 5, priority: 'High', location: `${districtName} Road Belt`, asset: 'Roadside Drain', district: `${districtName}, Karnataka`,
      actionTitle: 'Clear vegetation and debris',
      actionDesc: `Remove vegetation and debris to restore drain capacity along the road stretch in ${districtName}.`,
      agency: 'Public Works Dept. (PWD)', subAgency: `${districtName} Division`,
      costLakh: Math.round(costBase * 10) / 10, costDisplay: `₹ ${Math.round(costBase * 10) / 10} lakh`,
      status: 'Advisory Guidance', responsibility: 'Municipal / District',
      laborEquipment: '1 PWD road maintenance crew · Brush cutters · Debris haulage tipper',
      reason: 'Wild grass and plastic choking roadside shoulder drain',
      expectedBenefit: 'Eliminate hydroplaning risk on arterial state highway'
    },
    {
      id: 6, priority: 'Routine', location: `${taluk1} Village`, asset: 'Field Outlet', district: `${districtName}, Karnataka`,
      actionTitle: 'Monitor and schedule maintenance',
      actionDesc: `Plan desilting after current rainfall period. Monitor water levels and field conditions in ${taluk1}.`,
      agency: 'Agriculture Dept.', subAgency: districtName,
      costLakh: 0.6, costDisplay: '₹ 0.6 lakh',
      status: 'Advisory Guidance', responsibility: 'Farm Level',
      laborEquipment: 'Village field scout · Hand spade & staff gauge indicator',
      reason: 'Early sediment accumulation without immediate overtopping threat',
      expectedBenefit: 'Schedule preventive maintenance prior to flowering stage'
    },
    {
      id: 7, priority: 'Routine', location: `${districtName} East`, asset: 'Stormwater Drain', district: `${districtName}, Karnataka`,
      actionTitle: 'Routine inspection',
      actionDesc: 'Schedule routine inspection and minor clearing if needed.',
      agency: 'Urban Local Body (ULB)', subAgency: `${districtName} City Municipal Council`,
      costLakh: 0.4, costDisplay: '₹ 0.4 lakh',
      status: 'Advisory Guidance', responsibility: 'Municipal / District',
      laborEquipment: '2 Municipal inspectors · Trash rakes',
      reason: 'Quarterly municipal drainage maintenance schedule',
      expectedBenefit: 'Verify unimpeded culvert transit and intact grating'
    },
    {
      id: 8, priority: 'Routine', location: `${basinName} Zone`, asset: 'Field Drainage Channel', district: `${districtName}, Karnataka`,
      actionTitle: 'Monitor water levels',
      actionDesc: `Continue monitoring the ${basinName}. Take action if conditions worsen.`,
      agency: 'Agriculture Dept.', subAgency: districtName,
      costLakh: 0.5, costDisplay: '₹ 0.5 lakh',
      status: 'Advisory Guidance', responsibility: 'Community',
      laborEquipment: 'Local watershed committee volunteer · Visual gauge board',
      reason: `Downstream river backwater buffer zone monitoring in ${basinName}`,
      expectedBenefit: 'Early warning trigger for agricultural field drainage'
    }
  ];
}

export const DrainageActionsPage: React.FC<DrainageActionsPageProps> = ({
  onOpenExportModal,
  onNavigateToMap
}) => {
  const { t } = useLanguage();

  /* District Selection */
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('ballari');
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const districtRef = useRef<HTMLDivElement>(null);

  const districtMeta = useMemo(() => {
    return KARNATAKA_31_DISTRICTS_WEATHER.find(d => d.id === selectedDistrictId) || KARNATAKA_31_DISTRICTS_WEATHER[0];
  }, [selectedDistrictId]);

  /* Actions list state — generated from district metadata */
  const [actions, setActions] = useState<ActionItem[]>(() =>
    generateDistrictActions('ballari', 'Ballari', 'Hagari & Tungabhadra River Basin', ['Siruguppa', 'Kampli', 'Sandur', 'Kudligi'])
  );

  /* Regenerate actions when district changes */
  const [expandedRowId, setExpandedRowId] = useState<number | null>(1);
  useEffect(() => {
    const taluks = (districtMeta as any).majorTaluks?.map((t: any) => t.name || t) ||
      [districtMeta.displayName + ' North', districtMeta.displayName + ' South'];
    setActions(generateDistrictActions(
      districtMeta.id,
      districtMeta.displayName,
      districtMeta.river ? `${districtMeta.river} Basin` : districtMeta.displayName + ' Basin',
      taluks
    ));
    setExpandedRowId(1);
  }, [districtMeta.id]);
  const [priorityFilter, setPriorityFilter] = useState<string>('All Priorities');
  const [agencyFilter, setAgencyFilter] = useState<string>('All Agencies');
  const [responsibilityFilter, setResponsibilityFilter] = useState<string>('All Levels');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority-desc' | 'priority-asc' | 'cost-desc' | 'cost-asc'>('priority-desc');
  const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);
  const [showPrintWorkOrder, setShowPrintWorkOrder] = useState<ActionItem | null>(null);

  /* Live drainage advisory from Open-Meteo backend */
  const [liveAdvisory, setLiveAdvisory] = useState<any>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryError, setAdvisoryError] = useState<string | null>(null);
  const [advisoryLastFetched, setAdvisoryLastFetched] = useState<Date | null>(null);

  const fetchLiveAdvisory = useCallback(async (districtId: string, refresh = false) => {
    setAdvisoryLoading(true);
    setAdvisoryError(null);
    try {
      const res = await api.getLiveDrainageAdvisory(districtId, refresh);
      if (res?.success && res?.data) {
        setLiveAdvisory(res.data);
        setAdvisoryLastFetched(new Date());
      } else {
        setAdvisoryError('Advisory data unavailable from weather provider.');
        setLiveAdvisory(null);
      }
    } catch (err: any) {
      setAdvisoryError(err?.response?.data?.message || err?.message || 'Failed to fetch live advisory.');
      setLiveAdvisory(null);
    } finally {
      setAdvisoryLoading(false);
    }
  }, []);

  /* Fetch on district change */
  useEffect(() => {
    fetchLiveAdvisory(selectedDistrictId);
  }, [selectedDistrictId, fetchLiveAdvisory]);

  /* Auto-refresh every 30 minutes to match Open-Meteo cache cadence */
  useEffect(() => {
    const id = setInterval(() => fetchLiveAdvisory(selectedDistrictId), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [selectedDistrictId, fetchLiveAdvisory]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (districtRef.current && !districtRef.current.contains(e.target as Node)) {
        setDistrictDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* KPI Counts */
  const criticalCount = useMemo(() => actions.filter(a => a.priority === 'Critical').length, [actions]);
  const highCount = useMemo(() => actions.filter(a => a.priority === 'High').length, [actions]);
  const routineCount = useMemo(() => actions.filter(a => a.priority === 'Routine').length, [actions]);
  const dispatchedCount = useMemo(() => actions.filter(a => a.status !== 'Advisory Guidance').length, [actions]);
  const totalCount = actions.length;

  /* Filtered and Sorted list */
  const filteredActions = useMemo(() => {
    let list = actions.filter(a => {
      // Priority filter
      if (priorityFilter !== 'All Priorities' && a.priority !== priorityFilter) {
        return false;
      }
      // Agency filter
      if (agencyFilter !== 'All Agencies' && !a.agency.includes(agencyFilter)) {
        return false;
      }
      // Responsibility filter
      if (responsibilityFilter !== 'All Levels' && a.responsibility !== responsibilityFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          a.location.toLowerCase().includes(q) ||
          a.asset.toLowerCase().includes(q) ||
          a.actionTitle.toLowerCase().includes(q) ||
          a.actionDesc.toLowerCase().includes(q) ||
          a.agency.toLowerCase().includes(q) ||
          a.subAgency.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      const pWeight: Record<string, number> = { 'Critical': 3, 'High': 2, 'Routine': 1 };
      if (sortBy === 'priority-desc') return pWeight[b.priority] - pWeight[a.priority];
      if (sortBy === 'priority-asc') return pWeight[a.priority] - pWeight[b.priority];
      if (sortBy === 'cost-desc') return b.costLakh - a.costLakh;
      if (sortBy === 'cost-asc') return a.costLakh - b.costLakh;
      return 0;
    });

    return list;
  }, [actions, priorityFilter, agencyFilter, responsibilityFilter, searchQuery, sortBy]);

  // Toggle status cycle: Advisory Guidance -> In Progress -> Completed -> Advisory Guidance
  const toggleActionStatus = (id: number) => {
    setActions(prev => prev.map(a => {
      if (a.id !== id) return a;
      let nextStatus: ActionItem['status'] = 'In Progress';
      if (a.status === 'Advisory Guidance') nextStatus = 'In Progress';
      else if (a.status === 'In Progress') nextStatus = 'Completed';
      else nextStatus = 'Advisory Guidance';
      return { ...a, status: nextStatus };
    }));
  };

  const handlePrintWorkOrder = (action: ActionItem) => {
    setShowPrintWorkOrder(action);
  };

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 py-4 px-3 sm:px-6 md:px-8 space-y-4 font-sans text-slate-800 dark:text-slate-100">

      {/* ── Page Header Row ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Drainage Action Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Prioritized recommendations for field drainage and urban outfall management
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* District Dropdown */}
          <div className="relative" ref={districtRef}>
            <button
              onClick={() => setDistrictDropdownOpen(s => !s)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm text-xs font-semibold text-slate-800 dark:text-white hover:border-rose-400 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{districtMeta.displayName}, Karnataka</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${districtDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {districtDropdownOpen && (
              <div className="absolute z-50 top-full mt-1.5 right-0 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
                <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                  {KARNATAKA_31_DISTRICTS_WEATHER.map(d => (
                    <li key={d.id}>
                      <button
                        onClick={() => { setSelectedDistrictId(d.id); setDistrictDropdownOpen(false); }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-900/20 transition ${d.id === selectedDistrictId ? 'text-rose-600 font-bold bg-rose-50/70 dark:bg-rose-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        <span>{d.displayName}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{d.river}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Date Selector Display */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm text-xs font-semibold text-slate-800 dark:text-white">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Model Advisory Pill */}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
            MODEL ADVISORY
          </span>

          <span className="text-xs text-slate-400 italic hidden sm:inline">
            Advisory guidance &bull; Authorization required
          </span>
        </div>

        {/* Live Advisory Status Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {advisoryLoading && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              Fetching live weather advisory…
            </span>
          )}
          {!advisoryLoading && liveAdvisory && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE · Open-Meteo
            </span>
          )}
          {!advisoryLoading && advisoryError && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
              ADVISORY OFFLINE
            </span>
          )}
          <button
            onClick={() => fetchLiveAdvisory(selectedDistrictId, true)}
            disabled={advisoryLoading}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-rose-400 text-slate-600 dark:text-slate-300 transition shadow-sm disabled:opacity-40"
            title="Refresh live advisory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${advisoryLoading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Live Weather Advisory Banner ── */}
      {liveAdvisory && !advisoryLoading && (
        <div
          className="rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-start gap-3"
          style={{
            backgroundColor: liveAdvisory.riskColor ? `${liveAdvisory.riskColor}15` : '#f0fdf4',
            borderColor: liveAdvisory.riskColor ? `${liveAdvisory.riskColor}40` : '#bbf7d0',
          }}
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${liveAdvisory.riskColor}20`, borderColor: `${liveAdvisory.riskColor}40` }}>
            <ShieldAlert className="w-5 h-5" style={{ color: liveAdvisory.riskColor || '#10b981' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {liveAdvisory.guidanceHeadline || liveAdvisory.guidanceLevel || 'Weather-Based Drainage Guidance'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: liveAdvisory.riskColor || '#10b981' }}>
                {liveAdvisory.priority?.replace('Priority ', 'P') || liveAdvisory.riskCategory}
              </span>
              {advisoryLastFetched && (
                <span className="text-[10px] text-slate-400 font-medium">
                  Updated {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).format(advisoryLastFetched)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {liveAdvisory.diagnosis}
            </p>
            {liveAdvisory.recommendedAction && (
              <div className="mt-1.5 flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-700 dark:text-slate-200 font-medium leading-snug">
                  {liveAdvisory.recommendedAction}
                </span>
              </div>
            )}
            <div className="mt-1.5 text-[10px] text-slate-400">
              Source: Open-Meteo European NWP / ECMWF ·
              Observed {liveAdvisory.inputValues?.observedTodayRainfallMm ?? '–'} mm today ·
              Forecast {liveAdvisory.inputValues?.forecast24hPrecipMm ?? '–'} mm next 24h ·
              Peak {liveAdvisory.inputValues?.peakHourlyForecastMm ?? '–'} mm/h ·
              Elevation {liveAdvisory.coordinates?.elevation ?? liveAdvisory.inputValues?.elevationM ?? '–'} m
            </div>
          </div>
        </div>
      )}

      {advisoryError && !advisoryLoading && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Live advisory offline: {advisoryError} — Action list shows structured advisory guidance for {districtMeta.displayName}.</span>
          </div>
          <button onClick={() => fetchLiveAdvisory(selectedDistrictId, true)} className="underline font-bold text-[11px] ml-2">Retry</button>
        </div>
      )}

      {/* ── Top Row: 4 KPI Cards + Action Priority Summary Progress Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">

        {/* Card 1: Critical Actions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight">
              {criticalCount}
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Critical Actions
            </div>
            <p className="text-[10px] text-slate-400">
              Require early attention
            </p>
          </div>
        </div>

        {/* Card 2: High Priority */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight">
              {highCount}
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              High Priority
            </div>
            <p className="text-[10px] text-slate-400">
              Plan and prepare
            </p>
          </div>
        </div>

        {/* Card 3: Routine Actions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight">
              {routineCount}
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Routine Actions
            </div>
            <p className="text-[10px] text-slate-400">
              Monitor and schedule
            </p>
          </div>
        </div>

        {/* Card 4: Dispatched (Demo) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight">
              {dispatchedCount}
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Dispatched <span className="text-[10px] text-slate-400 font-normal">(Demo)</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {dispatchedCount > 0 ? `${dispatchedCount} active crews` : 'No actions dispatched'}
            </p>
          </div>
        </div>

        {/* Action Priority Summary Segmented Progress Bar Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-center space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Action Priority Summary</span>
            <span className="text-[11px] text-slate-400 font-mono">({totalCount} total)</span>
          </div>

          {/* Segmented Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div style={{ width: '25%' }} className="bg-rose-500 h-full" title="2 Critical (25%)" />
            <div style={{ width: '38%' }} className="bg-amber-500 h-full" title="3 High (38%)" />
            <div style={{ width: '37%' }} className="bg-emerald-500 h-full" title="3 Routine (38%)" />
          </div>

          {/* Summary Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {criticalCount} Critical ({Math.round((criticalCount / totalCount) * 100)}%)
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {highCount} High ({Math.round((highCount / totalCount) * 100)}%)
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {routineCount} Routine ({Math.round((routineCount / totalCount) * 100)}%)
            </span>
          </div>
        </div>

      </div>

      {/* ── Controls Toolbar: Filter & Search Bar ── */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Priority</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="All Priorities" className="bg-white dark:bg-slate-900">All Priorities</option>
              <option value="Critical" className="bg-white dark:bg-slate-900">Critical Only</option>
              <option value="High" className="bg-white dark:bg-slate-900">High Only</option>
              <option value="Routine" className="bg-white dark:bg-slate-900">Routine Only</option>
            </select>
          </div>

          {/* Agency Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Responsible Agency</span>
            <select
              value={agencyFilter}
              onChange={e => setAgencyFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="All Agencies" className="bg-white dark:bg-slate-900">All Agencies</option>
              <option value="Rural Development" className="bg-white dark:bg-slate-900">RDPR / Taluk Panchayat</option>
              <option value="Urban Local Body" className="bg-white dark:bg-slate-900">ULB / City Council</option>
              <option value="Agriculture" className="bg-white dark:bg-slate-900">Agriculture Dept.</option>
              <option value="Public Works" className="bg-white dark:bg-slate-900">PWD Division</option>
            </select>
          </div>

          {/* Responsibility Level */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
            <HardHat className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={responsibilityFilter}
              onChange={e => setResponsibilityFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="All Levels" className="bg-white dark:bg-slate-900">All Levels</option>
              <option value="Farm Level" className="bg-white dark:bg-slate-900">Farm Level</option>
              <option value="Community" className="bg-white dark:bg-slate-900">Community</option>
              <option value="Municipal / District" className="bg-white dark:bg-slate-900">Municipal / District</option>
            </select>
          </div>
        </div>

        {/* Center/Right: Search Bar & Count & Sorting */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 md:justify-end">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search location, village, canal, drain or action..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs placeholder:text-slate-400 outline-none"
            />
          </div>

          <span className="text-xs font-bold text-slate-500 shrink-0">
            {filteredActions.length} actions
          </span>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="priority-desc" className="bg-white dark:bg-slate-900">Priority (High to Low)</option>
              <option value="priority-asc" className="bg-white dark:bg-slate-900">Priority (Low to High)</option>
              <option value="cost-desc" className="bg-white dark:bg-slate-900">Cost (High to Low)</option>
              <option value="cost-asc" className="bg-white dark:bg-slate-900">Cost (Low to High)</option>
            </select>
          </div>
        </div>

      </div>

      {/* ── Main Actions Table / List ── */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
        
        {/* Table Head */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-white/10 text-[11px] font-bold text-slate-500 uppercase tracking-wider items-center">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-1">Priority</div>
          <div className="col-span-3">Location / Asset</div>
          <div className="col-span-3">Recommended Action</div>
          <div className="col-span-2">Responsible Agency</div>
          <div className="col-span-1">Estimated Cost</div>
          <div className="col-span-1 text-right">Status / Actions</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {filteredActions.map(action => {
            const isExpanded = expandedRowId === action.id;
            return (
              <div key={action.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                {/* Main Row */}
                <div
                  onClick={() => setExpandedRowId(isExpanded ? null : action.id)}
                  className="grid grid-cols-12 gap-3 px-4 py-3.5 text-xs items-center cursor-pointer"
                >
                  {/* # */}
                  <div className="col-span-1 text-center font-bold text-slate-400 font-mono">
                    {action.id}
                  </div>

                  {/* Priority Pill */}
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      action.priority === 'Critical'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-300 dark:border-rose-900/40'
                        : action.priority === 'High'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-300 dark:border-amber-900/40'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900/40'
                    }`}>
                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                      {action.priority}
                    </span>
                  </div>

                  {/* Location / Asset */}
                  <div className="col-span-3 space-y-0.5">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {action.location}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {action.asset}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-blue-500" />
                      <span>{action.district}</span>
                    </div>
                  </div>

                  {/* Recommended Action */}
                  <div className="col-span-3 space-y-0.5 pr-2">
                    <div className="font-extrabold text-slate-900 dark:text-white leading-tight">
                      {action.actionTitle}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                      {action.actionDesc}
                    </p>
                  </div>

                  {/* Responsible Agency */}
                  <div className="col-span-2 space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{action.agency}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pl-5 truncate">
                      {action.subAgency}
                    </div>
                  </div>

                  {/* Estimated Cost */}
                  <div className="col-span-1 space-y-0.5">
                    <div className="font-black font-mono text-slate-900 dark:text-white text-xs">
                      {action.costDisplay}
                    </div>
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 inline-block">
                      ADVISORY
                    </span>
                  </div>

                  {/* Status / Expand toggle */}
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActionStatus(action.id);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition hover:scale-105"
                      title="Click to toggle status"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        action.status === 'Completed'
                          ? 'bg-emerald-500'
                          : action.status === 'In Progress'
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-slate-400'
                      }`} />
                      <span className="truncate max-w-[70px]">{action.status}</span>
                    </button>

                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs animate-fadeIn">
                    
                    {/* Additional Details */}
                    <div className="md:col-span-4 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span>Additional Details</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        <strong>Reason:</strong> {action.reason}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        <strong>Expected Benefit:</strong> {action.expectedBenefit}
                      </p>
                      <p className="text-[10px] text-slate-400 pt-1 font-mono">
                        <strong>Equipment / Crew:</strong> {action.laborEquipment}
                      </p>
                    </div>

                    {/* Notes (Demo) */}
                    <div className="md:col-span-5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white block text-[11px]">
                          Engineering Notes
                        </span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          Work order derived from ML flood severity and terrain slope analysis. Requires site inspection and municipal authorization before dispatch.
                        </p>
                        <div className="flex items-center gap-3 pt-2 text-[10px] text-slate-400 font-mono">
                          <span>Level: <strong className="text-slate-600 dark:text-slate-300">{action.responsibility}</strong></span>
                          <span>&bull;</span>
                          <span>Audit Trail: <strong className="text-emerald-600">Logged in State System</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="md:col-span-3 flex flex-col justify-center gap-2">
                      <button
                        onClick={onNavigateToMap}
                        className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Inspect on Map</span>
                      </button>

                      <button
                        onClick={() => handlePrintWorkOrder(action)}
                        className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Export Work Order PDF</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Bottom Section: Data Sources & Last Updated (Left) + Note (Center) + View Methodology (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">

        {/* Left: Data Sources & Last Updated (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm p-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Data Sources &amp; Last Updated
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

            {/* 1. Weather Forecast */}
            <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Weather Forecast</span>
              </div>
              <span className="text-[9px] text-slate-400 block leading-tight">(IMD)</span>
              <div className="pt-1 flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Open-Meteo · 30-min cache</span>
              </div>
            </div>

            {/* 2. Rainfall Forecast */}
            <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Rainfall Forecast</span>
              </div>
              <span className="text-[9px] text-slate-400 block leading-tight">(IMD)</span>
              <div className="pt-1 flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Open-Meteo · Live</span>
              </div>
            </div>

            {/* 3. Hydrology / Drain Network */}
            <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Hydrology / Drain</span>
              </div>
              <span className="text-[9px] text-slate-400 block leading-tight">(Internal Model)</span>
              <div className="pt-1 flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">ML inference &middot; Latest run</span>
              </div>
            </div>

            {/* 4. Base Maps */}
            <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Base Maps</span>
              </div>
              <span className="text-[9px] text-slate-400 block leading-tight">(IRS/ISRO)</span>
              <div className="pt-1 flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                <span className="truncate">OSM / ISRO · Static</span>
              </div>
            </div>

          </div>
        </div>

        {/* Center: Data Provenance Note */}
        <div className="lg:col-span-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/30 p-3.5 flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
              Data Provenance
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Work orders derived from ML flood severity (Sentinel-1 SAR + Random Forest/XGBoost) and Open-Meteo weather advisory. Costs are standard KPWD/PWD schedule-of-rates estimates. Verify with site inspection before dispatch.
            </p>
          </div>
        </div>

        {/* Right: View Methodology Button (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm p-3.5 flex items-center justify-center">
          <button
            onClick={() => setShowMethodologyModal(true)}
            className="w-full h-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/60 dark:hover:bg-blue-900/30 border border-slate-200/80 dark:border-white/10 hover:border-blue-400 text-slate-800 dark:text-white hover:text-blue-600 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Methodology</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ── Printable Work Order Modal ── */}
      {showPrintWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Field Work Order #{showPrintWorkOrder.id.toString().padStart(4, '0')}
                </h3>
              </div>
              <button
                onClick={() => setShowPrintWorkOrder(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Location &amp; Asset</span>
                  <strong className="text-sm text-slate-900 dark:text-white">{showPrintWorkOrder.location}</strong>
                  <div className="text-[11px] text-slate-500">{showPrintWorkOrder.asset}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Priority Level</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700">
                    {showPrintWorkOrder.priority}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Intervention Mandate</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{showPrintWorkOrder.actionTitle}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{showPrintWorkOrder.actionDesc}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Assigned Agency</span>
                  <strong className="text-slate-800 dark:text-slate-200">{showPrintWorkOrder.agency}</strong>
                  <div className="text-slate-500 text-[11px]">{showPrintWorkOrder.subAgency}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Budget &amp; Resources</span>
                  <strong className="text-slate-800 dark:text-slate-200">{showPrintWorkOrder.costDisplay}</strong>
                  <div className="text-slate-500 text-[11px]">{showPrintWorkOrder.laborEquipment}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 italic">
                Official JalaDrishti AI Emergency Dispatch Record
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowPrintWorkOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Methodology Modal ── */}
      {showMethodologyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Drainage Prioritization Methodology
                </h3>
              </div>
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5">
                <strong className="text-slate-900 dark:text-white block font-bold mb-1">Multi-Tier Severity Weighting</strong>
                <p>Prioritizes interventions by combining forecasted rainfall accumulation (NWP), soil saturation indices, topographic slope gradients, and receiving channel water levels.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5">
                <strong className="text-slate-900 dark:text-white block font-bold mb-1">Audit Trail &amp; Work Order Generation</strong>
                <p>Ensures dispatched operations maintain persistent records in the municipal audit log for public accountability and post-flood evaluation.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
