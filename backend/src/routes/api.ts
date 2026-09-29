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
  getTodayRainfall
} from '../controllers/realtimeController.js';

const router = Router();

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
router.get('/realtime/iot-sensors', getIoTSensors);
router.post('/realtime/pump-actuator', updatePumpActuator);
router.get('/realtime/live-alerts', getLiveAlerts);
router.get('/realtime/nowcast/:districtId', getRealtimeNowcast);
router.get('/realtime/today-rainfall', getTodayRainfall);

export default router;
