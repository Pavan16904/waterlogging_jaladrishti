"""
Drainage Advisory Rule Engine
Translates detected waterlogging severity, SRTM DEM terrain context, and land-use attributes into actionable engineering advisories.
"""

from typing import List, Dict, Any

class DrainageAdvisoryEngine:
    """
    Expert rule-based advisory system for municipal & agricultural waterlogging remediation.
    """
    
    @staticmethod
    def evaluate_zone(
        zone_id: str,
        name: str,
        severity: str,
        waterlogging_prob: float,
        elevation_m: float,
        slope_deg: float,
        rainfall_mm: float,
        land_use: str = "urban_builtup",
        area_ha: float = 1.0,
        is_persistent: bool = False
    ) -> Dict[str, Any]:
        """
        Evaluates a single zone and returns structured recommendations and priority levels.
        """
        advisories = []
        mitigation_actions = []
        estimated_drainage_capacity_deficit = 0.0 # liters/sec or m3/hr
        
        # Base priority determination
        if severity == "Severe":
            priority = "Priority 1 (Critical)"
            urgency_score = 90 + int(waterlogging_prob * 10)
        elif severity == "Moderate":
            priority = "Priority 2 (High)"
            urgency_score = 65 + int(waterlogging_prob * 15)
        else:
            priority = "Priority 3 (Moderate)"
            urgency_score = 30 + int(waterlogging_prob * 20)

        # Rule 1: Depression & Low Slope Stagnation
        if severity in ["Severe", "Moderate"] and slope_deg < 2.0:
            advisories.append({
                "rule_code": "DRAIN-R01-TERRAIN_DEPRESSION",
                "title": "Low Terrain Slope Impeding Gravitational Flow",
                "diagnosis": f"Zone exhibits shallow slope ({slope_deg:.1f}°), preventing rapid gravity-fed storm runoff drainage.",
                "action": "Deploy high-flow mobile axial dewatering pumps (min 500 m³/hr) to discharge water to secondary outfall channels."
            })
            mitigation_actions.append("Mobile pump station deployment")

        # Rule 2: Built-up Urban Culvert Chokepoint
        if land_use in ["urban_builtup", "residential", "commercial"] and severity == "Severe":
            advisories.append({
                "rule_code": "DRAIN-R02-URBAN_CONDUIT_CHOKE",
                "title": "Urban Storm Drain & Culvert Inspection Required",
                "diagnosis": "Severe surface inundation in dense built-up area indicates siltation, debris choke, or hydraulic bottleneck at local culverts.",
                "action": "Dispatch emergency rapid-response teams for mechanical desilting of stormwater inlets, box culverts, and roadside storm grates."
            })
            mitigation_actions.append("Emergency culvert desilting & debris extraction")

        # Rule 3: Heavy Event Rainfall Runoff Surcharge
        if rainfall_mm >= 50.0:
            advisories.append({
                "rule_code": "DRAIN-R03-HYDRAULIC_SURCHARGE",
                "title": "Stormwater Network Exceeded Capacity",
                "diagnosis": f"Event rainfall ({rainfall_mm:.1f} mm) exceeds standard 5-year return storm drain design capacity.",
                "action": "Open secondary relief sluices, verify retention pond weir levels, and activate upstream flow diversion baffles."
            })
            mitigation_actions.append("Sluice gate regulation & retention weir overflow control")

        # Rule 4: Persistent Inundation - Structural Remedy
        if is_persistent or (severity == "Severe" and elevation_m < 850.0):
            advisories.append({
                "rule_code": "DRAIN-R04-PERSISTENT_STRUCTURAL",
                "title": "Chronic Waterlogging Zone - Structural Upgrade",
                "diagnosis": "Area shows recurrent post-monsoon stagnation across multiple satellite revisit cycles.",
                "action": "Construct a decentralized 1,200 m³ retention sump with perforated recharge wells and upgrade arterial pipeline to 1200mm NP3 RCC pipes."
            })
            mitigation_actions.append("Long-term retention basin & arterial pipe diameter upgrade")

        # Rule 5: Agricultural Waterlogging
        if land_use in ["agricultural", "farmland", "vegetation"] and severity in ["Moderate", "Severe"]:
            advisories.append({
                "rule_code": "DRAIN-R05-AGRI_ROOT_AERATION",
                "title": "Agricultural Root Zone Saturation Advisory",
                "diagnosis": "Soil saturation exceeds field capacity, risking root hypoxia and crop chlorosis within 24-48 hours.",
                "action": "Excavate temporary perimeter drainage furrows (0.4m depth) and install perforated subsurface French drains to lower water table."
            })
            mitigation_actions.append("Perimeter furrow excavation & subsurface tile drainage")

        if not advisories:
            advisories.append({
                "rule_code": "DRAIN-R00-ROUTINE",
                "title": "Normal Operational Baseline",
                "diagnosis": "Surface moisture levels are within acceptable absorption thresholds.",
                "action": "Maintain routine biannual vegetative swale trimming and stormwater drain cleaning."
            })
            mitigation_actions.append("Routine swale maintenance")

        # Calculate estimated water discharge requirement
        water_depth_est_m = 0.35 if severity == "Severe" else (0.15 if severity == "Moderate" else 0.05)
        stagnant_volume_m3 = area_ha * 10000.0 * water_depth_est_m
        
        return {
            "zone_id": zone_id,
            "zone_name": name,
            "severity": severity,
            "priority": priority,
            "urgency_score": urgency_score,
            "waterlogging_probability": round(waterlogging_prob, 3),
            "elevation_m": elevation_m,
            "slope_deg": slope_deg,
            "rainfall_mm": rainfall_mm,
            "land_use": land_use,
            "affected_area_ha": round(area_ha, 2),
            "estimated_stagnant_volume_m3": round(stagnant_volume_m3, 1),
            "mitigation_actions": mitigation_actions,
            "detailed_advisories": advisories
        }
