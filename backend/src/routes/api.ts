import { Router } from 'express';
import { getStudyAreas, getStudyAreaById } from '../controllers/studyAreaController.js';
import { getLatestAnalysis, runNewAnalysis } from '../controllers/analysisController.js';
import { getAdvisoriesByRun, getAllAdvisories } from '../controllers/advisoryController.js';
import { calculateIrrigation, getCropCatalog, getKarnatakaDistricts, getPastIrrigationAdvisories } from '../controllers/irrigationController.js';
import { getModelMetrics } from '../controllers/metricsController.js';
import { exportCsvReport, getReportSummaryJson } from '../controllers/reportController.js';
import { getDistrictForecast, getAllKarnatakaDistrictsWeather } from '../controllers/weatherController.js';
import { 
  getRadarMeta, 
  getIoTSensors, 
  updatePumpActuator, 
  getLiveAlerts, 
  getRealtimeNowcast,
  getTodayRainfall,
  getEarlyWarningForecast,
  getSatelliteMeta,
  getLiveDrainageAdvisory
} from '../controllers/realtimeController.js';
import { getWaterlogHexes, getWaterlogStatus, getWaterlogSummary, getEstimatedRiskAreas } from '../controllers/waterlogController.js';
import { getDataPipelineStatus, triggerSatelliteFloodCheck, triggerForecastIngestion, getOperaFloodObservations } from '../controllers/statusController.js';
import { getWeatherByDistrictId } from '../controllers/weatherController.js';
import { getCropWaterAdvice } from '../controllers/cropAdviceController.js';
import { getDrainageActions } from '../controllers/drainageActionsController.js';
import { streamEvents } from '../controllers/sseController.js';
import { getIncidents, createIncident, updateIncidentStatus } from '../controllers/incidentController.js';
import { 
  getDrainageLines, 
  getDrainConditionHistory, 
  submitDrainConditionReport, 
  getDrainageImportStatus,
  getDrainageSummary,
  getDrainageAssets,
  postImportDistrictDrainage
} from '../controllers/drainageLinesController.js';

const router = Router();

// Phase 4: Live SSE stream
router.get('/stream', streamEvents);

// Genuine Waterlogging Incidents & Citizen Reports
router.get('/incidents', getIncidents);
router.post('/incidents', createIncident);
router.patch('/incidents/:id/status', updateIncidentStatus);

// Genuine Satellite-Derived Flood & Water Extent (NASA OPERA DSWx-S1 Sentinel-1 SAR)
router.get('/satellite/opera-dswx', getOperaFloodObservations);

// Phase 1-3 Live Operational Endpoints
router.get('/status', getDataPipelineStatus);
router.get('/weather/district/:id', getWeatherByDistrictId);
router.get('/crop/advice', getCropWaterAdvice);
router.get('/drainage/actions', getDrainageActions);
// Real drainage network geometry (OpenCity.in KML import)
router.get('/drainage/lines', getDrainageLines);
router.get('/drainage/import-status', getDrainageImportStatus);
router.get('/drainage/summary', getDrainageSummary);
router.get('/drainage/assets', getDrainageAssets);
router.post('/drainage/import/:districtId', postImportDistrictDrainage);
router.get('/drainage/lines/:id/conditions', getDrainConditionHistory);
router.post('/drainage/lines/:id/conditions', submitDrainConditionReport);
router.post('/pipeline/ingest', triggerForecastIngestion);
router.post('/satellite/flood-check/:districtId', triggerSatelliteFloodCheck);

// Study Areas
router.get('/study-areas', getStudyAreas);
router.get('/study-areas/:id', getStudyAreaById);

// Analysis Runs & Spatial Severity
router.get('/analysis/:studyAreaId/latest', getLatestAnalysis);
router.post('/analysis/run', runNewAnalysis);

// Drainage Advisories
router.get('/advisories/run/:runId', getAdvisoriesByRun);
router.get('/advisories', getAllAdvisories);

// FAO-56 Irrigation Module
router.post('/irrigation/calculate', calculateIrrigation);
router.get('/irrigation/catalog', getCropCatalog);
router.get('/irrigation/karnataka-districts', getKarnatakaDistricts);
router.get('/irrigation/history', getPastIrrigationAdvisories);

// Model Performance & Ablation Metrics
router.get('/metrics', getModelMetrics);

// Reports
router.get('/reports/csv/:runId', exportCsvReport);
router.get('/reports/summary/:runId', getReportSummaryJson);

// Real-Time Open-Meteo Weather Observatory
router.get('/weather/forecast/:district', getDistrictForecast);
router.get('/weather/summary', getAllKarnatakaDistrictsWeather);

// Real-Time Radar, IoT Telemetry, Remote Actuators & Dynamic Nowcast
router.get('/realtime/radar-meta', getRadarMeta);
router.get('/realtime/satellite-meta', getSatelliteMeta);
router.get('/realtime/iot-sensors', getIoTSensors);
router.post('/realtime/pump-actuator', updatePumpActuator);
router.get('/realtime/live-alerts', getLiveAlerts);
router.get('/realtime/nowcast/:districtId', getRealtimeNowcast);
router.get('/realtime/today-rainfall', getTodayRainfall);
router.get('/realtime/early-warning/:districtId', getEarlyWarningForecast);
router.get('/realtime/drainage-advisory/:districtId', getLiveDrainageAdvisory);

// Modelled Waterlogging Risk Hex Map Endpoints (All 31 Districts)
router.get('/waterlog/hexes', getWaterlogHexes);
router.get('/waterlog/risk-areas', getEstimatedRiskAreas);
router.get('/waterlog/status', getWaterlogStatus);
router.get('/waterlog/summary', getWaterlogSummary);

export default router;
