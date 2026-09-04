import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ModelMetrics } from '../types';
import { 
  X, 
  BrainCircuit, 
  Layers, 
  BarChart3, 
  CheckCircle2, 
  TrendingUp, 
  Activity,
  Cpu,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  Legend 
} from 'recharts';

interface ModelEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelEvaluationModal: React.FC<ModelEvaluationModalProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'rf' | 'xgb' | 'ablation'>('rf');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
    }
  }, [isOpen]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await api.getModelMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const rf = metrics?.primary_model_rf;
  const xgb = metrics?.comparison_model_xgb;
  const ablation = metrics?.ablation_study || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel-glow w-full max-w-4xl rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Machine Learning Model Evaluation & Ablation Laboratory</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Sen1Floods11 Benchmark
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Rigorous held-out test evaluation, Confusion Matrix, ROC-AUC, Feature Importance & Sensor Ablation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex gap-2 border-b border-slate-800 bg-slate-900/40 text-xs">
          <button
            onClick={() => setActiveTab('rf')}
            className={`px-4 py-2 font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'rf'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Random Forest (Primary Model)
          </button>
          <button
            onClick={() => setActiveTab('xgb')}
            className={`px-4 py-2 font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'xgb'
                ? 'border-purple-400 text-purple-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            XGBoost (Comparison Classifier)
          </button>
          <button
            onClick={() => setActiveTab('ablation')}
            className={`px-4 py-2 font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'ablation'
                ? 'border-emerald-400 text-emerald-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Multimodal Sensor Ablation Study
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {activeTab === 'rf' && rf && (
            <div className="space-y-6">
              {/* Core Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Test Accuracy</span>
                  <p className="text-xl font-extrabold text-cyan-400 font-mono">{(rf.accuracy * 100).toFixed(2)}%</p>
                  <p className="text-[9px] text-slate-500">3,750 held-out samples</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Precision</span>
                  <p className="text-xl font-extrabold text-sky-300 font-mono">{(rf.precision * 100).toFixed(2)}%</p>
                  <p className="text-[9px] text-slate-500">TP / (TP + FP)</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Recall (Sensitivity)</span>
                  <p className="text-xl font-extrabold text-emerald-300 font-mono">{(rf.recall * 100).toFixed(2)}%</p>
                  <p className="text-[9px] text-slate-500">TP / (TP + FN)</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">F1-Score</span>
                  <p className="text-xl font-extrabold text-purple-300 font-mono">{(rf.f1_score * 100).toFixed(2)}%</p>
                  <p className="text-[9px] text-slate-500">Harmonic mean P & R</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">ROC-AUC</span>
                  <p className="text-xl font-extrabold text-amber-300 font-mono">{rf.roc_auc.toFixed(4)}</p>
                  <p className="text-[9px] text-slate-500">Area under curve</p>
                </div>
              </div>

              {/* Confusion Matrix & ROC Curve */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Confusion Matrix */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <span className="font-bold text-slate-200 text-xs">Empirical Confusion Matrix</span>
                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                      <span className="text-[10px] text-slate-400 block">True Positive (Waterlogged)</span>
                      <span className="text-lg font-bold text-emerald-400">{rf.confusion_matrix.true_positive}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30">
                      <span className="text-[10px] text-slate-400 block">False Positive (False Alarm)</span>
                      <span className="text-lg font-bold text-rose-400">{rf.confusion_matrix.false_positive}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30">
                      <span className="text-[10px] text-slate-400 block">False Negative (Missed Flood)</span>
                      <span className="text-lg font-bold text-amber-400">{rf.confusion_matrix.false_negative}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/30">
                      <span className="text-[10px] text-slate-400 block">True Negative (Dry/Absorptive)</span>
                      <span className="text-lg font-bold text-blue-400">{rf.confusion_matrix.true_negative}</span>
                    </div>
                  </div>
                </div>

                {/* ROC Curve Chart */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-200 text-xs">Receiver Operating Characteristic (ROC Curve)</span>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rf.roc_curve} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                        <XAxis dataKey="fpr" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'FPR', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#64748b' }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'TPR', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            fontSize: '11px'
                          }}
                        />
                        <Line type="monotone" dataKey="tpr" name="True Positive Rate" stroke="#06b6d4" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Feature Importances */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 text-xs">
                  Random Forest Gini Impurity Feature Importance
                </span>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rf.feature_importances} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                      <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '11px'
                        }}
                      />
                      <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                        {rf.feature_importances.map((entry, index) => (
                          <Cell key={`feat-${index}`} fill={index === 0 ? '#06b6d4' : index === 1 ? '#0ea5e9' : '#8b5cf6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'xgb' && xgb && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Test Accuracy</span>
                  <p className="text-xl font-extrabold text-purple-400 font-mono">{(xgb.accuracy * 100).toFixed(2)}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Precision</span>
                  <p className="text-xl font-extrabold text-sky-300 font-mono">{(xgb.precision * 100).toFixed(2)}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Recall</span>
                  <p className="text-xl font-extrabold text-emerald-300 font-mono">{(xgb.recall * 100).toFixed(2)}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">F1-Score</span>
                  <p className="text-xl font-extrabold text-purple-300 font-mono">{(xgb.f1_score * 100).toFixed(2)}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">ROC-AUC</span>
                  <p className="text-xl font-extrabold text-amber-300 font-mono">{xgb.roc_auc.toFixed(4)}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <span className="font-bold text-slate-200 text-xs">XGBoost Empirical Confusion Matrix</span>
                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                    <span className="text-[10px] text-slate-400 block">True Positive (Waterlogged)</span>
                    <span className="text-lg font-bold text-emerald-400">{xgb.confusion_matrix.true_positive}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30">
                    <span className="text-[10px] text-slate-400 block">False Positive (False Alarm)</span>
                    <span className="text-lg font-bold text-rose-400">{xgb.confusion_matrix.false_positive}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30">
                    <span className="text-[10px] text-slate-400 block">False Negative (Missed Flood)</span>
                    <span className="text-lg font-bold text-amber-400">{xgb.confusion_matrix.false_negative}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/30">
                    <span className="text-[10px] text-slate-400 block">True Negative (Dry/Absorptive)</span>
                    <span className="text-lg font-bold text-blue-400">{xgb.confusion_matrix.true_negative}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ablation' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-300 text-xs leading-relaxed">
                  The sensor ablation study demonstrates the quantitative contribution of each data modality. Adding Sentinel-1 SAR (+VV, +VH) overcomes cloud occlusion, while SRTM DEM (+Elevation, +Slope) eliminates flat depression misclassifications.
                </p>
              </div>

              {/* Ablation Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">Sensor Modality Configuration</th>
                      <th className="p-3 text-center">Bands Used</th>
                      <th className="p-3 text-center">Accuracy</th>
                      <th className="p-3 text-center">Precision</th>
                      <th className="p-3 text-center">Recall</th>
                      <th className="p-3 text-center">F1-Score</th>
                      <th className="p-3 text-center">ROC-AUC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {ablation.map((item, idx) => {
                      const isFull = idx === ablation.length - 1;
                      return (
                        <tr key={idx} className={isFull ? 'bg-cyan-950/30 font-bold text-cyan-300' : 'hover:bg-slate-800/40 text-slate-300'}>
                          <td className="p-3 flex items-center gap-2">
                            {isFull && <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                            <span>{item.configuration}</span>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-400">{item.feature_count} features</td>
                          <td className="p-3 text-center font-mono font-semibold">{(item.accuracy * 100).toFixed(2)}%</td>
                          <td className="p-3 text-center font-mono">{(item.precision * 100).toFixed(2)}%</td>
                          <td className="p-3 text-center font-mono">{(item.recall * 100).toFixed(2)}%</td>
                          <td className="p-3 text-center font-mono font-semibold">{(item.f1_score * 100).toFixed(2)}%</td>
                          <td className="p-3 text-center font-mono">{item.roc_auc.toFixed(4)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
