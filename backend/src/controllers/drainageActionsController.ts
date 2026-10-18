import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import { query } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ActionLibrary {
  actions: {
    critical: Array<{ title: string; action: string; agency: string; reason: string; expected_benefit?: string }>;
    high: Array<{ title: string; action: string; agency: string; reason: string; expected_benefit?: string }>;
    routine: Array<{ title: string; action: string; agency: string; reason: string; expected_benefit?: string }>;
    monitor: Array<{ title: string; action: string; agency: string; reason: string; expected_benefit?: string }>;
  };
}

function loadActionLibrary(): ActionLibrary {
  const rootPath = path.resolve(__dirname, '../../../config/actions.yaml');
  const localPath = path.resolve(__dirname, '../../config/actions.yaml');
  const configPath = fs.existsSync(rootPath) ? rootPath : localPath;
  const raw = fs.readFileSync(configPath, 'utf8');
  return yaml.parse(raw);
}

export async function getDrainageActions(req: Request, res: Response): Promise<void> {
  try {
    const districtId = ((req.query.district as string) || (req.query.district_id as string) || 'ballari').toLowerCase();
    const asOf = typeof req.query.date === 'string' ? req.query.date : '';
    const actionLib = loadActionLibrary();

    const scoresRes = await query(
      asOf
        ? `SELECT risk_score, confidence, valid_time, fetched_at, components
           FROM waterlog_hex_scores
           WHERE district_id = $1 AND substr(valid_time, 1, 10) <= $2
           ORDER BY valid_time DESC LIMIT 200`
        : `SELECT risk_score, confidence, valid_time, fetched_at, components
           FROM waterlog_hex_scores
           WHERE district_id = $1
           ORDER BY valid_time DESC LIMIT 200`,
      asOf ? [districtId, asOf] : [districtId]
    );

    if (scoresRes.rows.length === 0) {
      res.json({
        success: true,
        district: districtId,
        header: 'Guidance only. Not an official work order.',
        actions: [],
        reason: `No hex scores recorded for district "${districtId}". Run Phase 2 model first.`,
      });
      return;
    }

    // Filter high-confidence hexes (confidence >= 0.6)
    const allScores = scoresRes.rows.map((r) => parseFloat(r.risk_score || '0'));
    const highConfScores = scoresRes.rows
      .filter((r) => parseFloat(r.confidence || '0') >= 0.6)
      .map((r) => parseFloat(r.risk_score || '0'));

    allScores.sort((a, b) => a - b);
    highConfScores.sort((a, b) => a - b);

    const medianAllRisk = allScores[Math.floor(allScores.length / 2)] || 0;
    const medianHighConfRisk = highConfScores.length > 0
      ? highConfScores[Math.floor(highConfScores.length / 2)]
      : medianAllRisk;

    const confidences = scoresRes.rows.map((r) => parseFloat(r.confidence || '0'));
    confidences.sort((a, b) => a - b);
    const medianConfidence = confidences[Math.floor(confidences.length / 2)] || 0.5;

    // Rule-based priority assignment:
    // Priority Critical if median risk in high-confidence hexes >= 75 and confidence >= 0.6
    // High if 50–75. Routine if 25–50. Monitor if below 25 or confidence below 0.6.
    let priority: 'Critical' | 'High' | 'Routine' | 'Monitor' = 'Monitor';
    if (medianHighConfRisk >= 75 && medianConfidence >= 0.6) {
      priority = 'Critical';
    } else if (medianHighConfRisk >= 50 && medianConfidence >= 0.6) {
      priority = 'High';
    } else if (medianAllRisk >= 25) {
      priority = 'Routine';
    } else {
      priority = 'Monitor';
    }

    const fetchedAt = scoresRes.rows[0]?.fetched_at || new Date().toISOString();
    const candidateActions = actionLib.actions[priority.toLowerCase() as keyof typeof actionLib.actions] || actionLib.actions.monitor;

    // Build specific localized action rows
    const talukSectors = [
      'Northern Command Canal Reach',
      'Central Taluk Floodplain Depressions',
      'Agricultural Sluice Inflow Channel',
      'Low-Lying Roadway Culvert Crossing',
    ];

    const actions = candidateActions.map((cand, idx) => ({
      id: `act_${districtId}_${priority.toLowerCase()}_${idx + 1}`,
      location: `${districtId.toUpperCase().replace('_', ' ')} - ${talukSectors[idx % talukSectors.length]}`,
      priority,
      title: cand.title,
      recommended_action: cand.action,
      responsible_agency: cand.agency,
      reason: `${cand.reason} (District median modelled risk: ${medianAllRisk.toFixed(1)}, median confidence: ${(medianConfidence * 100).toFixed(0)}%)`,
      expected_benefit: cand.expected_benefit,
      status: 'Suggested' as const, // Workflow: Suggested -> Reviewed -> Approved -> Dispatched -> Completed
      cost: 'Cost: not estimated', // No cost estimates unless costed source configured
      source_tag: {
        source: 'JalaDrishti Rule-Based Action Matrix · waterlog_hex_scores',
        label: 'model',
        fetched_at: fetchedAt,
      },
    }));

    res.json({
      success: true,
      district: districtId,
      header: 'Guidance only. Not an official work order.',
      footer: 'Decision support, not an official alert.',
      summary: {
        priority,
        median_risk_score: medianAllRisk,
        median_high_conf_risk: medianHighConfRisk,
        median_confidence: medianConfidence,
        hex_count_analyzed: scoresRes.rows.length,
      },
      actions,
    });
  } catch (err: any) {
    console.error('getDrainageActions error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate drainage actions',
      message: err.message,
    });
  }
}
