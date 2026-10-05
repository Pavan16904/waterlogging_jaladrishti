import React, { useState } from "react";
import {
  Target, Cpu, Leaf, AlertTriangle, IndianRupee, BarChart3,
  CheckCircle2, Satellite, Droplets, TrendingUp,
  Info, ChevronRight, Award, Zap, Globe, FlaskConical
} from "lucide-react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

const RF_METRICS = { accuracy: 94.65, precision: 93.20, recall: 92.84, f1: 93.02, auc: 96.82 };
const XGB_METRICS = { accuracy: 94.12, precision: 92.80, recall: 92.15, f1: 92.47, auc: 96.35 };

const ABLATION_DATA = [
  { name: "SAR Only", accuracy: 86.2, fill: "#94a3b8" },
  { name: "Optical Only", accuracy: 88.45, fill: "#60a5fa" },
  { name: "Optical+SAR", accuracy: 92.15, fill: "#34d399" },
  { name: "Opt+SAR+DEM", accuracy: 93.80, fill: "#a78bfa" },
  { name: "Full Proposed", accuracy: 94.65, fill: "#f59e0b" },
];

const FEATURE_IMPORTANCE = [
  { feature: "MNDWI", importance: 41.15, color: "#0ea5e9" },
  { feature: "NDWI", importance: 22.54, color: "#38bdf8" },
  { feature: "Slope", importance: 11.82, color: "#6366f1" },
  { feature: "Rainfall", importance: 9.63, color: "#8b5cf6" },
  { feature: "SAR VV", importance: 5.67, color: "#10b981" },
  { feature: "SAR VH", importance: 4.41, color: "#34d399" },
  { feature: "NDVI", importance: 4.27, color: "#f59e0b" },
  { feature: "Elevation", importance: 0.51, color: "#94a3b8" },
];

const BUDGET_ITEMS = [
  { item: "Arduino Uno R3 x2", purpose: "IoT sensor demo controller", cost: 800, category: "Hardware" },
  { item: "HC-SR04 Ultrasonic x4", purpose: "Water level sensing", cost: 480, category: "Hardware" },
  { item: "5V Relay Module x2", purpose: "Pump actuation relay", cost: 120, category: "Hardware" },
  { item: "Submersible pump x1", purpose: "Live demo pump", cost: 250, category: "Hardware" },
  { item: "Jumper wires + breadboard", purpose: "Prototyping connections", cost: 150, category: "Hardware" },
  { item: "USB cables + power bank", purpose: "Powering Arduinos at demo", cost: 200, category: "Hardware" },
  { item: "Printed posters (A2 x2)", purpose: "Architecture + results diagram", cost: 600, category: "Print" },
  { item: "Bound technical report", purpose: "Printed project report", cost: 350, category: "Print" },
  { item: "Pen drive / SD card", purpose: "Project backup + dataset", cost: 300, category: "Storage" },
  { item: "Contingency / misc.", purpose: "Extra materials", cost: 500, category: "Other" },
];
const TOTAL_COST = BUDGET_ITEMS.reduce((s, i) => s + i.cost, 0);

const DEMO_STEPS = [
  { step: 1, time: "0:00", title: "Problem Overview", desc: 'Open the Project Overview tab — problem, innovation, free data sources' },
  { step: 2, time: "0:30", title: "Run AI Analysis", desc: 'Select Bengaluru Urban -> Run AI Analysis -> watch ML classify zones in <3s' },
  { step: 3, time: "2:00", title: "Weather Observatory", desc: 'Show live 10-day forecast + flood risk rating for any district' },
  { step: 4, time: "3:00", title: "Crop Water Advisor", desc: 'Select Ragi, 45 days, Red Sandy Loam -> FAO-56 says IRRIGATE TODAY / SKIP' },
  { step: 5, time: "4:00", title: "Drainage Work Orders", desc: 'Show P1 Critical / P2 High / P3 Routine auto-generated from ML results' },
  { step: 6, time: "4:30", title: "Model Metrics", desc: 'Open ML Performance tab -> ROC curve + ablation study bar chart' },
];

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="glass-card p-4 flex items-start gap-3">
      <div className={`p-2.5 rounded-xl ${color} flex-shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function MetricRow({ label, rf, xgb }: { label: string; rf: number; xgb: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <div className="flex gap-4">
        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 w-16 text-right">{rf}%</span>
        <span className="text-sm font-semibold text-sky-500 dark:text-sky-400 w-16 text-right">{xgb}%</span>
      </div>
    </div>
  );
}

export function ProjectOverviewPage() {
  const [activeSection, setActiveSection] = useState<"overview" | "metrics" | "budget" | "demo">("overview");

  const tabs = [
    { id: "overview" as const, label: "Project Overview", icon: Target },
    { id: "metrics" as const, label: "ML Performance", icon: BarChart3 },
    { id: "budget" as const, label: "Budget Plan", icon: IndianRupee },
    { id: "demo" as const, label: "Demo Script", icon: Zap },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 gap-5 overflow-y-auto">
      {/* Project Header Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg">
        <Award size={22} className="flex-shrink-0" />
        <div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-80">Engineering Project</div>
          <div className="font-bold text-base">JalaDrishti AI — Project Evaluation Overview</div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`overview-tab-${id}`}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
              ${activeSection === id
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "glass-card text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400"
              }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === "overview" && (
        <div className="flex flex-col gap-5">
          <div className="glass-card p-5 border-l-4 border-sky-500">
            <div className="flex items-start gap-3">
              <Satellite size={24} className="text-sky-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-sky-500 uppercase tracking-widest mb-1">Innovation Claim</div>
                <p className="text-slate-800 dark:text-slate-100 font-semibold text-sm leading-relaxed">
                  JalaDrishti AI fuses <span className="text-sky-600 dark:text-sky-400 font-bold">Sentinel-1 SAR + Sentinel-2 Optical + SRTM DEM</span> into
                  a Random Forest classifier achieving <span className="text-emerald-600 dark:text-emerald-400 font-bold">94.65% waterlogging detection</span> while
                  providing <span className="text-amber-600 dark:text-amber-400 font-bold">FAO-56 precision irrigation advisories</span> for 100+ Karnataka crops — entirely on free, open-source data.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Cpu} label="ML Accuracy" value="94.65%" sub="Random Forest, real test data" color="bg-emerald-500" />
            <StatCard icon={Leaf} label="Crops Covered" value="100+" sub="All Karnataka varieties" color="bg-amber-500" />
            <StatCard icon={Globe} label="Districts" value="31/31" sub="All Karnataka districts" color="bg-sky-500" />
            <StatCard icon={IndianRupee} label="Total Cost" value="&#8377;3,750" sub="Within &#8377;8,000 limit" color="bg-violet-500" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-rose-500" />
                <h3 className="font-bold text-slate-800 dark:text-white">Problem Statement</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {[
                  "Karnataka floods cause ₹2,000+ crore annual crop losses",
                  "Standing water for 48–72 hours causes permanent yield loss",
                  "Optical satellites are blind during monsoon cloud cover",
                  "No affordable real-time advisory exists for small farmers",
                  "Municipal drainage response is reactive, not proactive",
                ].map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <ChevronRight size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <h3 className="font-bold text-slate-800 dark:text-white">Our Innovation</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {[
                  "SAR penetrates clouds — works 24/7 regardless of weather",
                  "Multimodal fusion improves accuracy by +8.45% over SAR alone",
                  "FAO-56 — internationally recognized crop water standard",
                  "Zero ongoing cost — all APIs are free, no subscriptions",
                  "Trilingual (Kannada / Hindi / English) for real accessibility",
                ].map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <ChevronRight size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-violet-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Measurable Outcomes</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { metric: "94.65%", label: "Flood Detection\nAccuracy", color: "text-emerald-600 dark:text-emerald-400" },
                { metric: "+8.45%", label: "Gain: Multimodal\nvs SAR-only", color: "text-sky-600 dark:text-sky-400" },
                { metric: "2–4 hrs", label: "Early Warning\nLead Time", color: "text-amber-600 dark:text-amber-400" },
                { metric: "20–35%", label: "Water Savings\nvs Flood Irrig.", color: "text-violet-600 dark:text-violet-400" },
              ].map((o, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className={`text-2xl font-black ${o.color}`}>{o.metric}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-line">{o.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Satellite size={18} className="text-sky-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Free &amp; Open Data Sources</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: "Sentinel-1 SAR", desc: "C-band VV+VH, cloud-penetrating" },
                { name: "Sentinel-2 Optical", desc: "NDWI / MNDWI / NDVI indices" },
                { name: "SRTM DEM (30m)", desc: "NASA elevation & slope model" },
                { name: "Open-Meteo NWP", desc: "10-day forecast + ET₀ free API" },
                { name: "RainViewer Radar", desc: "Live Doppler frames (5-min)" },
                { name: "Sen1Floods11 Dataset", desc: "Training: 15,000 samples" },
              ].map((src, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 mt-0.5 flex-shrink-0">FREE</span>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">{src.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{src.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ML PERFORMANCE */}
      {activeSection === "metrics" && (
        <div className="flex flex-col gap-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical size={18} className="text-emerald-500" />
                <h3 className="font-bold text-slate-800 dark:text-white">Model Performance (Test Set)</h3>
              </div>
              <div className="flex justify-end gap-4 mb-2 text-[11px] font-bold">
                <span className="text-emerald-600 dark:text-emerald-400">Random Forest</span>
                <span className="text-sky-500">XGBoost</span>
              </div>
              <MetricRow label="Accuracy" rf={RF_METRICS.accuracy} xgb={XGB_METRICS.accuracy} />
              <MetricRow label="Precision" rf={RF_METRICS.precision} xgb={XGB_METRICS.precision} />
              <MetricRow label="Recall" rf={RF_METRICS.recall} xgb={XGB_METRICS.recall} />
              <MetricRow label="F1-Score" rf={RF_METRICS.f1} xgb={XGB_METRICS.f1} />
              <MetricRow label="ROC-AUC" rf={RF_METRICS.auc} xgb={XGB_METRICS.auc} />
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                Dataset: Sen1Floods11 — 15,000 samples (75/25 split). Karnataka flood events: Bellandur, Mandya Cauvery, Belagavi Krishna, Raichur Doab.
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={18} className="text-sky-500" />
                <h3 className="font-bold text-slate-800 dark:text-white">Feature Importance (Gini)</h3>
              </div>
              <div className="space-y-2">
                {FEATURE_IMPORTANCE.map(f => (
                  <div key={f.feature} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-20 flex-shrink-0">{f.feature}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${f.importance}%`, backgroundColor: f.color, transition: "width 0.7s ease" }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-12 text-right">{f.importance}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Award size={18} className="text-amber-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Ablation Study — Why Multimodal Fusion Matters</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Each modality removed to quantify contribution. Full 8-feature fusion is clearly superior (+8.45% over SAR alone).
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ABLATION_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis domain={[82, 98]} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={v => `${v}%`} />
                <Tooltip
                  formatter={(v: any) => [`${v}%`, "Accuracy"]}
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem" }}
                  labelStyle={{ color: "#f8fafc", fontSize: 11 }}
                />
                <Bar dataKey="accuracy" name="Accuracy (%)" radius={[4, 4, 0, 0]}>
                  {ABLATION_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {ABLATION_DATA.map((d, i) => (
                <div key={i} className="text-center p-2 rounded-lg" style={{ background: `${d.fill}18`, border: `1px solid ${d.fill}35` }}>
                  <div className="text-lg font-black" style={{ color: d.fill }}>{d.accuracy}%</div>
                  <div className="text-[9px] text-slate-500">{d.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BUDGET */}
      {activeSection === "budget" && (
        <div className="flex flex-col gap-5">
          <div className="glass-card p-5 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Total Project Cost</div>
                <div className="text-4xl font-black text-slate-900 dark:text-white">&#8377;{TOTAL_COST.toLocaleString()}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Within &#8377;8,000 limit —{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">&#8377;{(8000 - TOTAL_COST).toLocaleString()} headroom</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Budget Used</div>
                <div className="text-3xl font-black text-emerald-500">{Math.round((TOTAL_COST / 8000) * 100)}%</div>
                <div className="w-32 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(TOTAL_COST / 8000) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white">
              Itemized Cost Breakdown
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {BUDGET_ITEMS.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-white">{item.item}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.purpose}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-sm font-bold text-slate-800 dark:text-white">&#8377;{item.cost}</div>
                    <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                      item.category === "Hardware" ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400" :
                      item.category === "Print" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400" :
                      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>{item.category}</div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-4 bg-emerald-50 dark:bg-emerald-900/20">
                <div className="font-bold text-slate-800 dark:text-white">TOTAL</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">&#8377;{TOTAL_COST.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-sky-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-2">Why This Is Cost-Effective</h4>
                <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {[
                    "₹0 for satellite data — Sentinel-1 & 2 via Copernicus Open Access (free)",
                    "₹0 for weather API — Open-Meteo free 10-day forecasts, no API key needed",
                    "₹0 for all software — Python, Node.js, React, SQLite are all open source",
                    "₹0 for ML training dataset — Sen1Floods11 publicly available",
                    "₹0 cloud cost — runs on any laptop with a hotspot",
                  ].map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <ChevronRight size={13} className="text-sky-400 mt-0.5 flex-shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEMO SCRIPT */}
      {activeSection === "demo" && (
        <div className="flex flex-col gap-5">
          <div className="glass-card p-5 border-l-4 border-amber-500">
            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">5-Minute Evaluator Demo Flow</div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Follow this sequence for maximum evaluator impact. Each step answers one key evaluator question.</p>
          </div>

          <div className="flex flex-col gap-3">
            {DEMO_STEPS.map((step) => (
              <div key={step.step} className="glass-card p-4 flex items-start gap-4 card-hover">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <span className="text-sm font-black text-sky-500">{step.step}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-white">{step.title}</span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{step.time}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card p-5">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3">Common Evaluator Questions &amp; Answers</h4>
            <div className="space-y-3">
              {[
                { q: "What is novel about this project?", a: "SAR+Optical+DEM multimodal fusion for Karnataka — proven by ablation study to be 8.45% more accurate than SAR alone." },
                { q: "Why not just use a weather app?", a: "Weather apps give rain forecasts. We provide spatial flood inundation maps, FAO-56 irrigation decisions, and drainage work orders." },
                { q: "Is this scalable beyond Karnataka?", a: "Yes. All Sentinel & SRTM data is national. Expanding to other states requires only adding district weather profiles." },
                { q: "How does it help farmers specifically?", a: "The Crop Water Advisor gives a binary IRRIGATE/SKIP recommendation per day, per crop, per soil type — in Kannada." },
                { q: "Why is the cost so low?", a: "All satellite data, APIs, and software are free and open-source. Zero recurring costs after initial setup." },
              ].map((qa, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">&#10067; {qa.q}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">&#9989; {qa.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectOverviewPage;
