"""
FastAPI Geospatial ML & Decision Support Microservice
AI-Based Waterlogging Detection and Drainage Advisory System
"""

import os
import json
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from drainage_engine import DrainageAdvisoryEngine
from fao56_irrigation import FAO56IrrigationEngine, CROP_DATABASE, SOIL_DATABASE, KARNATAKA_DISTRICT_WEATHER

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
METRICS_PATH = os.path.join(ARTIFACTS_DIR, "evaluation_metrics.json")
RF_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "model_rf.joblib")
XGB_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "model_xgb.joblib")

# Load models
rf_model = None
xgb_model = None
metrics_data = {}

if os.path.exists(RF_MODEL_PATH):
    rf_model = joblib.load(RF_MODEL_PATH)
if os.path.exists(XGB_MODEL_PATH):
    xgb_model = joblib.load(XGB_MODEL_PATH)
if os.path.exists(METRICS_PATH):
    with open(METRICS_PATH, "r") as f:
        metrics_data = json.load(f)

app = FastAPI(
    title="AI Waterlogging & Drainage Advisory ML Microservice",
    version="2.1.0",
    description="Multimodal Satellite ML Inference, Terrain Analysis, Rule-Based Drainage Engine & Extended Karnataka FAO-56 Crop Water Balance"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Data Models ---
class PixelFeature(BaseModel):
    ndwi: float = Field(..., description="Sentinel-2 Normalized Difference Water Index (Green - NIR)/(Green + NIR)")
    mndwi: float = Field(..., description="Modified NDWI (Green - SWIR)/(Green + SWIR)")
    ndvi: float = Field(..., description="Normalized Difference Vegetation Index (NIR - Red)/(NIR + Red)")
    vv_db: float = Field(..., description="Sentinel-1 SAR VV backscatter in dB")
    vh_db: float = Field(..., description="Sentinel-1 SAR VH backscatter in dB")
    elevation_m: float = Field(..., description="SRTM DEM elevation in meters")
    slope_deg: float = Field(..., description="SRTM DEM terrain slope in degrees")
    rainfall_mm: float = Field(..., description="Accumulated rainfall precipitation in mm")

class BatchInferenceRequest(BaseModel):
    model_type: Optional[str] = "random_forest"
    pixels: List[PixelFeature]

class SceneAnalysisRequest(BaseModel):
    study_area_id: str
    study_area_name: str
    pre_event_date: str
    post_event_date: str
    model_type: Optional[str] = "random_forest"
    rainfall_override_mm: Optional[float] = None
    zones: List[Dict[str, Any]]

class IrrigationRequest(BaseModel):
    crop_name: str = "Tomato"
    days_since_planting: int = 45
    soil_type: str = "Red Sandy Loam (Karnataka Plains)"
    district_name: Optional[str] = "Bengaluru Urban"
    temp_min_c: Optional[float] = None
    temp_max_c: Optional[float] = None
    recent_rainfall_mm: float = 0.0
    current_depletion_mm: float = 14.0
    latitude_deg: Optional[float] = None
    field_area_ha: float = 2.0

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "service": "AI Waterlogging & Drainage Advisory ML Microservice",
        "status": "online",

        "models_loaded": {
            "random_forest": rf_model is not None,
            "xgboost": xgb_model is not None
        },
        "crops_supported": len(CROP_DATABASE),
        "karnataka_districts_covered": len(KARNATAKA_DISTRICT_WEATHER),
        "features": ["NDWI", "MNDWI", "NDVI", "VV", "VH", "Elevation", "Slope", "Rainfall"]
    }

@app.get("/api/ml/metrics")
def get_metrics():
    if not metrics_data:
        raise HTTPException(status_code=404, detail="Model metrics have not been trained yet.")
    return metrics_data

@app.get("/api/ml/karnataka-districts")
def get_karnataka_districts():
    return {
        "count": len(KARNATAKA_DISTRICT_WEATHER),
        "districts": KARNATAKA_DISTRICT_WEATHER
    }

@app.post("/api/ml/predict")
def predict_pixels(request: BatchInferenceRequest):
    clf = xgb_model if (request.model_type == "xgboost" and xgb_model is not None) else rf_model
    if clf is None:
        raise HTTPException(status_code=500, detail="Requested ML model is not loaded.")
        
    features_matrix = np.array([
        [p.ndwi, p.mndwi, p.ndvi, p.vv_db, p.vh_db, p.elevation_m, p.slope_deg, p.rainfall_mm]
        for p in request.pixels
    ])
    
    probabilities = clf.predict_proba(features_matrix)[:, 1]
    predictions = clf.predict(features_matrix)
    
    results = []
    for i, (prob, pred) in enumerate(zip(probabilities, predictions)):
        prob_val = float(prob)
        if prob_val < 0.30:
            severity = "Low"
            severity_code = 1
        elif prob_val < 0.60:
            severity = "Moderate"
            severity_code = 2
        else:
            severity = "Severe"
            severity_code = 3
            
        results.append({
            "pixel_index": i,
            "waterlogging_probability": round(prob_val, 4),
            "is_waterlogged": bool(pred == 1 or prob_val >= 0.50),
            "severity": severity,
            "severity_code": severity_code
        })
    return {"model_used": request.model_type, "results": results}

@app.post("/api/ml/analyze-scene")
def analyze_scene(request: SceneAnalysisRequest):
    clf = xgb_model if (request.model_type == "xgboost" and xgb_model is not None) else rf_model
    if clf is None:
        raise HTTPException(status_code=500, detail="ML model is not loaded.")
    
    analyzed_zones = []
    severity_counts = {"Low": 0, "Moderate": 0, "Severe": 0}
    total_waterlogged_ha = 0.0
    total_area_ha = 0.0
    
    for z in request.zones:
        ndwi = float(z.get("ndwi", 0.1))
        mndwi = float(z.get("mndwi", 0.2))
        ndvi = float(z.get("ndvi", 0.3))
        vv = float(z.get("vv_db", -14.0))
        vh = float(z.get("vh_db", -20.0))
        elev = float(z.get("elevation_m", 500.0))
        slope = float(z.get("slope_deg", 1.5))
        rain = float(request.rainfall_override_mm if request.rainfall_override_mm is not None else z.get("rainfall_mm", 45.0))
        area_ha = float(z.get("area_ha", 5.0))
        land_use = z.get("land_use", "urban_builtup")
        is_persistent = bool(z.get("is_persistent", False))
        
        feature_vec = np.array([[ndwi, mndwi, ndvi, vv, vh, elev, slope, rain]])
        prob = float(clf.predict_proba(feature_vec)[0, 1])
        
        if prob < 0.30:
            severity = "Low"
            severity_color = "#10b981"
        elif prob < 0.60:
            severity = "Moderate"
            severity_color = "#f59e0b"
        else:
            severity = "Severe"
            severity_color = "#ef4444"
            
        severity_counts[severity] += 1
        total_area_ha += area_ha
        if severity in ["Moderate", "Severe"]:
            total_waterlogged_ha += area_ha
            
        advisory_info = DrainageAdvisoryEngine.evaluate_zone(
            zone_id=z.get("id", f"zone_{len(analyzed_zones)+1}"),
            name=z.get("name", f"Zone {len(analyzed_zones)+1}"),
            severity=severity,
            waterlogging_prob=prob,
            elevation_m=elev,
            slope_deg=slope,
            rainfall_mm=rain,
            land_use=land_use,
            area_ha=area_ha,
            is_persistent=is_persistent
        )
        
        zone_result = {
            **z,
            "waterlogging_probability": round(prob, 4),
            "severity": severity,
            "severity_color": severity_color,
            "advisory": advisory_info
        }
        analyzed_zones.append(zone_result)
        
    analyzed_zones.sort(key=lambda x: x["advisory"]["urgency_score"], reverse=True)
    waterlogged_pct = (total_waterlogged_ha / max(0.1, total_area_ha)) * 100.0
    
    return {
        "study_area_id": request.study_area_id,
        "study_area_name": request.study_area_name,
        "pre_event_date": request.pre_event_date,
        "post_event_date": request.post_event_date,
        "model_used": request.model_type,
        "total_area_km2": round(total_area_ha / 100.0, 2),
        "total_waterlogged_km2": round(total_waterlogged_ha / 100.0, 2),
        "waterlogged_percentage": round(waterlogged_pct, 1),
        "severity_breakdown": severity_counts,
        "critical_priority_count": sum(1 for z in analyzed_zones if z["severity"] == "Severe"),
        "high_priority_count": sum(1 for z in analyzed_zones if z["severity"] == "Moderate"),
        "analyzed_zones": analyzed_zones
    }

@app.post("/api/ml/irrigation-advisory")
def calculate_irrigation(request: IrrigationRequest):
    district_info = KARNATAKA_DISTRICT_WEATHER.get(request.district_name or "Bengaluru Urban", KARNATAKA_DISTRICT_WEATHER["Bengaluru Urban"])
    
    t_min = request.temp_min_c if request.temp_min_c is not None else district_info["temp_min_c"]
    t_max = request.temp_max_c if request.temp_max_c is not None else district_info["temp_max_c"]
    lat = request.latitude_deg if request.latitude_deg is not None else district_info["latitude"]
    soil = request.soil_type or district_info["default_soil"]

    result = FAO56IrrigationEngine.compute_irrigation_advisory(
        crop_name=request.crop_name,
        days_since_planting=request.days_since_planting,
        soil_type=soil,
        temp_min_c=t_min,
        temp_max_c=t_max,
        recent_rainfall_mm=request.recent_rainfall_mm,
        current_depletion_mm=request.current_depletion_mm,
        latitude_deg=lat,
        field_area_ha=request.field_area_ha,
        district_name=request.district_name or "Bengaluru Urban"
    )
    return result

@app.get("/api/ml/karnataka-districts")
def get_karnataka_districts():
    return {
        "districts": list(KARNATAKA_DISTRICT_WEATHER.keys()),
        "district_data": KARNATAKA_DISTRICT_WEATHER,
        "total": len(KARNATAKA_DISTRICT_WEATHER)
    }

@app.get("/api/ml/crop-catalog")
def get_crop_catalog():
    # Group crops by categories
    categories = {}
    for crop_name, info in CROP_DATABASE.items():
        cat = info.get("category", "General")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(crop_name)

    return {
        "crops": list(CROP_DATABASE.keys()),
        "categories": categories,
        "soils": list(SOIL_DATABASE.keys()),
        "soil_details": SOIL_DATABASE,
        "karnataka_districts": KARNATAKA_DISTRICT_WEATHER,
        "crop_details": {k: {"category": v.get("category", "General"), "stages": v["stages"], "root_depth_m": v["root_depth_m"]} for k, v in CROP_DATABASE.items()}
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
