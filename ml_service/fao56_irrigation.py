"""
FAO-56 Crop Water Requirement & Irrigation Advisory Module
Comprehensive Agro-Hydrological Engine covering 100+ crops and all Karnataka Agro-Climatic Districts.
Based on: FAO Irrigation and Drainage Paper 56 (Allen et al., 1998)
"""

import math
from typing import Dict, Any, List

# ============================================================================
# CROP DATABASE — 100+ crops with FAO-56 Kc coefficients
# Each crop: category, growth stages (name, duration_days, kc or kc_start/kc_end),
#            root_depth_m, depletion_fraction_p, yield_response_factor_ky
# ============================================================================
CROP_DATABASE: Dict[str, Dict[str, Any]] = {
    # ─────────────────────── CEREALS ───────────────────────
    "Rice (Paddy)": {
        "category": "Cereals",
        "stages": [
            {"name": "Nursery & Transplanting", "duration": 30, "kc": 1.05},
            {"name": "Tillering & Vegetative", "duration": 30, "kc_start": 1.05, "kc_end": 1.20},
            {"name": "Flowering & Grain Fill", "duration": 40, "kc": 1.20},
            {"name": "Ripening & Harvest", "duration": 30, "kc_start": 1.20, "kc_end": 0.90}
        ],
        "root_depth_m": 0.30, "depletion_fraction_p": 0.20, "yield_response_factor_ky": 1.15
    },
    "Wheat": {
        "category": "Cereals",
        "stages": [
            {"name": "Emergence & Establishment", "duration": 20, "kc": 0.40},
            {"name": "Tillering & Stem Extension", "duration": 35, "kc_start": 0.40, "kc_end": 1.15},
            {"name": "Heading & Grain Fill", "duration": 40, "kc": 1.15},
            {"name": "Ripening", "duration": 25, "kc_start": 1.15, "kc_end": 0.40}
        ],
        "root_depth_m": 0.60, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 1.05
    },
    "Maize (Corn)": {
        "category": "Cereals",
        "stages": [
            {"name": "Emergence", "duration": 20, "kc": 0.40},
            {"name": "Vegetative Growth", "duration": 35, "kc_start": 0.40, "kc_end": 1.20},
            {"name": "Tasseling & Grain Fill", "duration": 40, "kc": 1.20},
            {"name": "Maturity & Drying", "duration": 25, "kc_start": 1.20, "kc_end": 0.55}
        ],
        "root_depth_m": 0.60, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 1.25
    },
    "Sorghum (Jowar)": {
        "category": "Cereals",
        "stages": [
            {"name": "Emergence", "duration": 20, "kc": 0.35},
            {"name": "Vegetative", "duration": 35, "kc_start": 0.35, "kc_end": 1.10},
            {"name": "Flowering & Grain Fill", "duration": 40, "kc": 1.10},
            {"name": "Maturity", "duration": 25, "kc_start": 1.10, "kc_end": 0.55}
        ],
        "root_depth_m": 0.60, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.90
    },
    "Pearl Millet (Bajra)": {
        "category": "Cereals",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.35},
            {"name": "Vegetative", "duration": 25, "kc_start": 0.35, "kc_end": 1.00},
            {"name": "Flowering & Grain Fill", "duration": 30, "kc": 1.00},
            {"name": "Maturity", "duration": 20, "kc_start": 1.00, "kc_end": 0.35}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.85
    },

    # ─────────────────────── MILLETS ───────────────────────
    "Finger Millet (Ragi)": {
        "category": "Millets",
        "stages": [
            {"name": "Establishment", "duration": 20, "kc": 0.35},
            {"name": "Vegetative Tillering", "duration": 30, "kc_start": 0.35, "kc_end": 1.00},
            {"name": "Heading & Grain Fill", "duration": 35, "kc": 1.00},
            {"name": "Maturity", "duration": 20, "kc_start": 1.00, "kc_end": 0.40}
        ],
        "root_depth_m": 0.35, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.90
    },
    "Foxtail Millet (Navane)": {
        "category": "Millets",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.30},
            {"name": "Vegetative", "duration": 25, "kc_start": 0.30, "kc_end": 0.95},
            {"name": "Grain Fill", "duration": 25, "kc": 0.95},
            {"name": "Maturity", "duration": 15, "kc_start": 0.95, "kc_end": 0.30}
        ],
        "root_depth_m": 0.30, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.80
    },
    "Little Millet (Same)": {
        "category": "Millets",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.30},
            {"name": "Vegetative", "duration": 25, "kc_start": 0.30, "kc_end": 0.90},
            {"name": "Grain Fill", "duration": 25, "kc": 0.90},
            {"name": "Maturity", "duration": 15, "kc_start": 0.90, "kc_end": 0.30}
        ],
        "root_depth_m": 0.25, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.75
    },
    "Kodo Millet (Harka)": {
        "category": "Millets",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.30},
            {"name": "Vegetative", "duration": 30, "kc_start": 0.30, "kc_end": 0.90},
            {"name": "Grain Fill", "duration": 30, "kc": 0.90},
            {"name": "Maturity", "duration": 15, "kc_start": 0.90, "kc_end": 0.30}
        ],
        "root_depth_m": 0.30, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.75
    },
    "Barnyard Millet (Oodalu)": {
        "category": "Millets",
        "stages": [
            {"name": "Emergence", "duration": 12, "kc": 0.30},
            {"name": "Vegetative", "duration": 22, "kc_start": 0.30, "kc_end": 0.90},
            {"name": "Grain Fill", "duration": 22, "kc": 0.90},
            {"name": "Maturity", "duration": 14, "kc_start": 0.90, "kc_end": 0.30}
        ],
        "root_depth_m": 0.25, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.75
    },
    "Proso Millet (Baragu)": {
        "category": "Millets",
        "stages": [
            {"name": "Emergence", "duration": 12, "kc": 0.30},
            {"name": "Vegetative", "duration": 20, "kc_start": 0.30, "kc_end": 0.90},
            {"name": "Grain Fill", "duration": 25, "kc": 0.90},
            {"name": "Maturity", "duration": 13, "kc_start": 0.90, "kc_end": 0.30}
        ],
        "root_depth_m": 0.25, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.75
    },

    # ─────────────────────── PULSES ───────────────────────
    "Pigeon Pea (Tur/Arhar)": {
        "category": "Pulses",
        "stages": [
            {"name": "Establishment", "duration": 25, "kc": 0.35},
            {"name": "Vegetative Branching", "duration": 40, "kc_start": 0.35, "kc_end": 1.05},
            {"name": "Flowering & Pod Fill", "duration": 45, "kc": 1.05},
            {"name": "Pod Maturity", "duration": 25, "kc_start": 1.05, "kc_end": 0.35}
        ],
        "root_depth_m": 0.60, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 1.00
    },
    "Chickpea (Bengal Gram)": {
        "category": "Pulses",
        "stages": [
            {"name": "Emergence", "duration": 20, "kc": 0.40},
            {"name": "Vegetative", "duration": 30, "kc_start": 0.40, "kc_end": 1.00},
            {"name": "Flowering & Pod Fill", "duration": 35, "kc": 1.00},
            {"name": "Maturity", "duration": 20, "kc_start": 1.00, "kc_end": 0.35}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 1.00
    },
    "Green Gram (Moong)": {
        "category": "Pulses",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.35},
            {"name": "Vegetative", "duration": 20, "kc_start": 0.35, "kc_end": 1.00},
            {"name": "Flowering & Pod Fill", "duration": 25, "kc": 1.00},
            {"name": "Maturity", "duration": 15, "kc_start": 1.00, "kc_end": 0.35}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 1.00
    },
    "Black Gram (Urad)": {
        "category": "Pulses",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.35},
            {"name": "Vegetative", "duration": 20, "kc_start": 0.35, "kc_end": 1.00},
            {"name": "Flowering & Pod Fill", "duration": 25, "kc": 1.00},
            {"name": "Maturity", "duration": 15, "kc_start": 1.00, "kc_end": 0.35}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 1.00
    },
    "Horse Gram (Hurali)": {
        "category": "Pulses",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.30},
            {"name": "Vegetative", "duration": 25, "kc_start": 0.30, "kc_end": 0.90},
            {"name": "Flowering & Pod Fill", "duration": 25, "kc": 0.90},
            {"name": "Maturity", "duration": 15, "kc_start": 0.90, "kc_end": 0.30}
        ],
        "root_depth_m": 0.35, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.85
    },
    "Cowpea (Alsande)": {
        "category": "Pulses",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.35},
            {"name": "Vegetative", "duration": 20, "kc_start": 0.35, "kc_end": 1.05},
            {"name": "Flowering & Pod Fill", "duration": 25, "kc": 1.05},
            {"name": "Maturity", "duration": 15, "kc_start": 1.05, "kc_end": 0.35}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 1.00
    },
    "Lentil (Masoor)": {
        "category": "Pulses",
        "stages": [
            {"name": "Emergence", "duration": 20, "kc": 0.40},
            {"name": "Vegetative", "duration": 30, "kc_start": 0.40, "kc_end": 1.00},
            {"name": "Flowering & Pod Fill", "duration": 30, "kc": 1.00},
            {"name": "Maturity", "duration": 20, "kc_start": 1.00, "kc_end": 0.30}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 1.10
    },
    "Field Pea (Batani)": {
        "category": "Pulses",
        "stages": [
            {"name": "Emergence", "duration": 20, "kc": 0.45},
            {"name": "Vegetative", "duration": 25, "kc_start": 0.45, "kc_end": 1.10},
            {"name": "Flowering & Pod Fill", "duration": 30, "kc": 1.10},
            {"name": "Maturity", "duration": 20, "kc_start": 1.10, "kc_end": 0.35}
        ],
        "root_depth_m": 0.45, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 1.05
    },
    "Soybean": {
        "category": "Pulses",
        "stages": [
            {"name": "Emergence", "duration": 20, "kc": 0.35},
            {"name": "Vegetative", "duration": 30, "kc_start": 0.35, "kc_end": 1.15},
            {"name": "Flowering & Pod Fill", "duration": 35, "kc": 1.15},
            {"name": "Maturity", "duration": 20, "kc_start": 1.15, "kc_end": 0.50}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.85
    },
    "Lab Lab (Avare)": {
        "category": "Pulses",
        "stages": [
            {"name": "Establishment", "duration": 20, "kc": 0.35},
            {"name": "Vegetative", "duration": 30, "kc_start": 0.35, "kc_end": 1.00},
            {"name": "Flowering & Pod Fill", "duration": 35, "kc": 1.00},
            {"name": "Maturity", "duration": 20, "kc_start": 1.00, "kc_end": 0.35}
        ],
        "root_depth_m": 0.45, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.90
    },
    "Moth Bean": {
        "category": "Pulses",
        "stages": [
            {"name": "Emergence", "duration": 12, "kc": 0.30},
            {"name": "Vegetative", "duration": 20, "kc_start": 0.30, "kc_end": 0.90},
            {"name": "Flowering & Pod Fill", "duration": 22, "kc": 0.90},
            {"name": "Maturity", "duration": 12, "kc_start": 0.90, "kc_end": 0.30}
        ],
        "root_depth_m": 0.35, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.80
    },

    # ─────────────────────── OILSEEDS ───────────────────────
    "Groundnut (Peanut)": {
        "category": "Oilseeds",
        "stages": [
            {"name": "Emergence", "duration": 20, "kc": 0.45},
            {"name": "Vegetative & Pegging", "duration": 30, "kc_start": 0.45, "kc_end": 1.05},
            {"name": "Pod Development", "duration": 35, "kc": 1.05},
            {"name": "Maturity & Harvest", "duration": 20, "kc_start": 1.05, "kc_end": 0.55}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.70
    },
    "Sunflower": {
        "category": "Oilseeds",
        "stages": [
            {"name": "Emergence", "duration": 20, "kc": 0.35},
            {"name": "Vegetative", "duration": 30, "kc_start": 0.35, "kc_end": 1.10},
            {"name": "Flowering & Seed Fill", "duration": 30, "kc": 1.10},
            {"name": "Maturity", "duration": 20, "kc_start": 1.10, "kc_end": 0.35}
        ],
        "root_depth_m": 0.55, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.95
    },
    "Safflower (Kusube)": {
        "category": "Oilseeds",
        "stages": [
            {"name": "Emergence", "duration": 25, "kc": 0.35},
            {"name": "Vegetative & Rosette", "duration": 30, "kc_start": 0.35, "kc_end": 1.05},
            {"name": "Flowering & Seed Fill", "duration": 35, "kc": 1.05},
            {"name": "Maturity", "duration": 20, "kc_start": 1.05, "kc_end": 0.25}
        ],
        "root_depth_m": 0.60, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.80
    },
    "Sesame (Til/Ellu)": {
        "category": "Oilseeds",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.35},
            {"name": "Vegetative", "duration": 25, "kc_start": 0.35, "kc_end": 1.05},
            {"name": "Flowering & Capsule Fill", "duration": 25, "kc": 1.05},
            {"name": "Maturity", "duration": 15, "kc_start": 1.05, "kc_end": 0.25}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.90
    },
    "Niger Seed (Uchellu)": {
        "category": "Oilseeds",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.30},
            {"name": "Vegetative", "duration": 25, "kc_start": 0.30, "kc_end": 0.95},
            {"name": "Flowering & Seed Fill", "duration": 25, "kc": 0.95},
            {"name": "Maturity", "duration": 15, "kc_start": 0.95, "kc_end": 0.25}
        ],
        "root_depth_m": 0.35, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.80
    },
    "Castor": {
        "category": "Oilseeds",
        "stages": [
            {"name": "Emergence", "duration": 25, "kc": 0.35},
            {"name": "Vegetative", "duration": 40, "kc_start": 0.35, "kc_end": 1.10},
            {"name": "Flowering & Capsule Fill", "duration": 45, "kc": 1.10},
            {"name": "Maturity", "duration": 25, "kc_start": 1.10, "kc_end": 0.55}
        ],
        "root_depth_m": 0.60, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.85
    },
    "Linseed (Agase)": {
        "category": "Oilseeds",
        "stages": [
            {"name": "Emergence", "duration": 20, "kc": 0.35},
            {"name": "Vegetative", "duration": 25, "kc_start": 0.35, "kc_end": 1.05},
            {"name": "Flowering & Boll Fill", "duration": 30, "kc": 1.05},
            {"name": "Maturity", "duration": 20, "kc_start": 1.05, "kc_end": 0.25}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.90
    },
    "Mustard (Sasive)": {
        "category": "Oilseeds",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.35},
            {"name": "Vegetative", "duration": 25, "kc_start": 0.35, "kc_end": 1.10},
            {"name": "Flowering & Pod Fill", "duration": 30, "kc": 1.10},
            {"name": "Maturity", "duration": 15, "kc_start": 1.10, "kc_end": 0.30}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.90
    },

    # ─────────────────────── VEGETABLES ───────────────────────
    "Tomato": {
        "category": "Vegetables",
        "stages": [
            {"name": "Transplant & Establishment", "duration": 30, "kc": 0.60},
            {"name": "Vegetative Growth", "duration": 40, "kc_start": 0.60, "kc_end": 1.15},
            {"name": "Flowering & Fruit Set", "duration": 30, "kc": 1.15},
            {"name": "Ripening & Harvest", "duration": 25, "kc_start": 1.15, "kc_end": 0.75}
        ],
        "root_depth_m": 0.55, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 1.05
    },
    "Potato": {
        "category": "Vegetables",
        "stages": [
            {"name": "Sprouting & Emergence", "duration": 25, "kc": 0.50},
            {"name": "Tuber Initiation", "duration": 30, "kc_start": 0.50, "kc_end": 1.15},
            {"name": "Tuber Bulking", "duration": 45, "kc": 1.15},
            {"name": "Maturation & Skin Setting", "duration": 25, "kc_start": 1.15, "kc_end": 0.75}
        ],
        "root_depth_m": 0.45, "depletion_fraction_p": 0.35, "yield_response_factor_ky": 1.10
    },
    "Onion": {
        "category": "Vegetables",
        "stages": [
            {"name": "Seedling Establishment", "duration": 20, "kc": 0.70},
            {"name": "Foliage Growth", "duration": 35, "kc_start": 0.70, "kc_end": 1.05},
            {"name": "Bulb Enlargement", "duration": 45, "kc": 1.05},
            {"name": "Bulb Ripening", "duration": 25, "kc_start": 1.05, "kc_end": 0.75}
        ],
        "root_depth_m": 0.35, "depletion_fraction_p": 0.30, "yield_response_factor_ky": 1.10
    },
    "Cabbage": {
        "category": "Vegetables",
        "stages": [
            {"name": "Establishment", "duration": 20, "kc": 0.50},
            {"name": "Head Formation", "duration": 30, "kc_start": 0.50, "kc_end": 1.05},
            {"name": "Head Enlargement", "duration": 40, "kc": 1.05},
            {"name": "Harvest", "duration": 20, "kc_start": 1.05, "kc_end": 0.95}
        ],
        "root_depth_m": 0.45, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.95
    },
    "Cauliflower": {
        "category": "Vegetables",
        "stages": [
            {"name": "Transplant", "duration": 20, "kc": 0.50},
            {"name": "Curd Initiation", "duration": 30, "kc_start": 0.50, "kc_end": 1.05},
            {"name": "Curd Development", "duration": 35, "kc": 1.05},
            {"name": "Harvest Readiness", "duration": 15, "kc_start": 1.05, "kc_end": 0.90}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 1.00
    },
    "Brinjal (Eggplant)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Transplant", "duration": 30, "kc": 0.60},
            {"name": "Vegetative Growth", "duration": 40, "kc_start": 0.60, "kc_end": 1.05},
            {"name": "Flowering & Fruit Set", "duration": 40, "kc": 1.05},
            {"name": "Late Harvest", "duration": 20, "kc_start": 1.05, "kc_end": 0.90}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 1.00
    },
    "Okra (Bhendi/Ladies Finger)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.50},
            {"name": "Vegetative", "duration": 25, "kc_start": 0.50, "kc_end": 1.05},
            {"name": "Flowering & Picking", "duration": 35, "kc": 1.05},
            {"name": "Late Season", "duration": 15, "kc_start": 1.05, "kc_end": 0.90}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 1.00
    },
    "Chili (Green/Red)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Transplant", "duration": 30, "kc": 0.55},
            {"name": "Vegetative", "duration": 35, "kc_start": 0.55, "kc_end": 1.05},
            {"name": "Flowering & Fruit", "duration": 40, "kc": 1.05},
            {"name": "Ripening & Picking", "duration": 25, "kc_start": 1.05, "kc_end": 0.80}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.30, "yield_response_factor_ky": 1.10
    },
    "Capsicum (Bell Pepper)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Transplant", "duration": 25, "kc": 0.55},
            {"name": "Vegetative", "duration": 35, "kc_start": 0.55, "kc_end": 1.05},
            {"name": "Flowering & Fruit", "duration": 35, "kc": 1.05},
            {"name": "Picking", "duration": 20, "kc_start": 1.05, "kc_end": 0.85}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.30, "yield_response_factor_ky": 1.10
    },
    "Carrot": {
        "category": "Vegetables",
        "stages": [
            {"name": "Germination", "duration": 25, "kc": 0.45},
            {"name": "Root Expansion", "duration": 35, "kc_start": 0.45, "kc_end": 1.05},
            {"name": "Root Bulking", "duration": 40, "kc": 1.05},
            {"name": "Maturation", "duration": 20, "kc_start": 1.05, "kc_end": 0.85}
        ],
        "root_depth_m": 0.60, "depletion_fraction_p": 0.35, "yield_response_factor_ky": 1.00
    },
    "Beetroot": {
        "category": "Vegetables",
        "stages": [
            {"name": "Germination", "duration": 20, "kc": 0.45},
            {"name": "Vegetative", "duration": 30, "kc_start": 0.45, "kc_end": 1.05},
            {"name": "Root Bulking", "duration": 30, "kc": 1.05},
            {"name": "Maturation", "duration": 15, "kc_start": 1.05, "kc_end": 0.90}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 1.00
    },
    "Radish (Moolangi)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Germination", "duration": 10, "kc": 0.45},
            {"name": "Vegetative", "duration": 15, "kc_start": 0.45, "kc_end": 0.90},
            {"name": "Root Bulking", "duration": 15, "kc": 0.90},
            {"name": "Harvest", "duration": 5, "kc_start": 0.90, "kc_end": 0.80}
        ],
        "root_depth_m": 0.25, "depletion_fraction_p": 0.30, "yield_response_factor_ky": 0.90
    },
    "Cucumber": {
        "category": "Vegetables",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.50},
            {"name": "Vine Development", "duration": 25, "kc_start": 0.50, "kc_end": 1.00},
            {"name": "Flowering & Fruit", "duration": 25, "kc": 1.00},
            {"name": "Late Picking", "duration": 10, "kc_start": 1.00, "kc_end": 0.75}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.90
    },
    "Bitter Gourd (Hagalkayi)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.50},
            {"name": "Vine Growth", "duration": 25, "kc_start": 0.50, "kc_end": 1.00},
            {"name": "Flowering & Fruit", "duration": 30, "kc": 1.00},
            {"name": "Late Picking", "duration": 10, "kc_start": 1.00, "kc_end": 0.80}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.90
    },
    "Bottle Gourd (Sorekayi)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.50},
            {"name": "Vine Growth", "duration": 30, "kc_start": 0.50, "kc_end": 1.00},
            {"name": "Flowering & Fruit", "duration": 30, "kc": 1.00},
            {"name": "Late Picking", "duration": 10, "kc_start": 1.00, "kc_end": 0.80}
        ],
        "root_depth_m": 0.45, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.90
    },
    "Ridge Gourd (Heerakayi)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Emergence", "duration": 12, "kc": 0.50},
            {"name": "Vine Growth", "duration": 25, "kc_start": 0.50, "kc_end": 1.00},
            {"name": "Flowering & Fruit", "duration": 30, "kc": 1.00},
            {"name": "Late Picking", "duration": 10, "kc_start": 1.00, "kc_end": 0.80}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.90
    },
    "Snake Gourd (Padavalanga)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.50},
            {"name": "Vine Growth", "duration": 25, "kc_start": 0.50, "kc_end": 1.00},
            {"name": "Flowering & Fruit", "duration": 30, "kc": 1.00},
            {"name": "Late Picking", "duration": 10, "kc_start": 1.00, "kc_end": 0.80}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.90
    },
    "Beans (French/Cluster)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.35},
            {"name": "Vegetative", "duration": 20, "kc_start": 0.35, "kc_end": 1.05},
            {"name": "Flowering & Pod Fill", "duration": 25, "kc": 1.05},
            {"name": "Harvest", "duration": 10, "kc_start": 1.05, "kc_end": 0.90}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 1.10
    },
    "Peas (Green)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.45},
            {"name": "Vegetative", "duration": 20, "kc_start": 0.45, "kc_end": 1.10},
            {"name": "Flowering & Pod Fill", "duration": 25, "kc": 1.10},
            {"name": "Maturity", "duration": 15, "kc_start": 1.10, "kc_end": 0.90}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 1.05
    },
    "Drumstick (Moringa)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Establishment", "duration": 40, "kc": 0.45},
            {"name": "Canopy Development", "duration": 60, "kc_start": 0.45, "kc_end": 0.90},
            {"name": "Flowering & Fruiting", "duration": 60, "kc": 0.90},
            {"name": "Late Season", "duration": 40, "kc_start": 0.90, "kc_end": 0.70}
        ],
        "root_depth_m": 0.80, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.80
    },
    "Garlic": {
        "category": "Vegetables",
        "stages": [
            {"name": "Establishment", "duration": 20, "kc": 0.60},
            {"name": "Vegetative", "duration": 30, "kc_start": 0.60, "kc_end": 1.00},
            {"name": "Bulb Enlargement", "duration": 40, "kc": 1.00},
            {"name": "Maturation", "duration": 20, "kc_start": 1.00, "kc_end": 0.70}
        ],
        "root_depth_m": 0.30, "depletion_fraction_p": 0.30, "yield_response_factor_ky": 1.10
    },
    "Spinach (Palak)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Germination", "duration": 10, "kc": 0.50},
            {"name": "Vegetative Growth", "duration": 15, "kc_start": 0.50, "kc_end": 0.95},
            {"name": "Full Canopy", "duration": 15, "kc": 0.95},
            {"name": "Harvest", "duration": 5, "kc_start": 0.95, "kc_end": 0.90}
        ],
        "root_depth_m": 0.25, "depletion_fraction_p": 0.20, "yield_response_factor_ky": 1.00
    },
    "Lettuce": {
        "category": "Vegetables",
        "stages": [
            {"name": "Establishment", "duration": 15, "kc": 0.45},
            {"name": "Growth", "duration": 20, "kc_start": 0.45, "kc_end": 1.00},
            {"name": "Full Head", "duration": 15, "kc": 1.00},
            {"name": "Harvest", "duration": 5, "kc_start": 1.00, "kc_end": 0.90}
        ],
        "root_depth_m": 0.25, "depletion_fraction_p": 0.30, "yield_response_factor_ky": 1.00
    },
    "Watermelon (Kallangoose)": {
        "category": "Vegetables",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.45},
            {"name": "Vine Development", "duration": 25, "kc_start": 0.45, "kc_end": 1.00},
            {"name": "Flowering & Fruit", "duration": 30, "kc": 1.00},
            {"name": "Ripening", "duration": 15, "kc_start": 1.00, "kc_end": 0.70}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 1.10
    },
    "Muskmelon": {
        "category": "Vegetables",
        "stages": [
            {"name": "Emergence", "duration": 15, "kc": 0.45},
            {"name": "Vine Development", "duration": 25, "kc_start": 0.45, "kc_end": 1.00},
            {"name": "Flowering & Fruit", "duration": 25, "kc": 1.00},
            {"name": "Ripening", "duration": 12, "kc_start": 1.00, "kc_end": 0.70}
        ],
        "root_depth_m": 0.45, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 1.05
    },

    # ─────────────────────── FRUITS & PLANTATION ───────────────────────
    "Mango": {
        "category": "Fruits",
        "stages": [
            {"name": "Dormancy/Pre-Flowering", "duration": 60, "kc": 0.60},
            {"name": "Flowering & Fruit Set", "duration": 30, "kc_start": 0.60, "kc_end": 0.85},
            {"name": "Fruit Development", "duration": 60, "kc": 0.85},
            {"name": "Maturation & Harvest", "duration": 30, "kc_start": 0.85, "kc_end": 0.60}
        ],
        "root_depth_m": 1.20, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.80
    },
    "Banana": {
        "category": "Fruits",
        "stages": [
            {"name": "Planting & Establishment", "duration": 60, "kc": 0.60},
            {"name": "Vegetative (Grand Growth)", "duration": 90, "kc_start": 0.60, "kc_end": 1.10},
            {"name": "Flowering & Bunch Fill", "duration": 90, "kc": 1.10},
            {"name": "Maturation & Harvest", "duration": 60, "kc_start": 1.10, "kc_end": 1.00}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.35, "yield_response_factor_ky": 1.20
    },
    "Papaya": {
        "category": "Fruits",
        "stages": [
            {"name": "Establishment", "duration": 45, "kc": 0.50},
            {"name": "Vegetative Growth", "duration": 60, "kc_start": 0.50, "kc_end": 0.95},
            {"name": "Flowering & Fruiting", "duration": 120, "kc": 0.95},
            {"name": "Late Season", "duration": 60, "kc_start": 0.95, "kc_end": 0.80}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 1.00
    },
    "Guava": {
        "category": "Fruits",
        "stages": [
            {"name": "Dormancy", "duration": 40, "kc": 0.50},
            {"name": "Flowering & Fruit Set", "duration": 30, "kc_start": 0.50, "kc_end": 0.80},
            {"name": "Fruit Development", "duration": 60, "kc": 0.80},
            {"name": "Harvest", "duration": 30, "kc_start": 0.80, "kc_end": 0.60}
        ],
        "root_depth_m": 0.80, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.80
    },
    "Pomegranate": {
        "category": "Fruits",
        "stages": [
            {"name": "Rest & Bahar Treatment", "duration": 30, "kc": 0.45},
            {"name": "Flowering & Fruit Set", "duration": 30, "kc_start": 0.45, "kc_end": 0.80},
            {"name": "Fruit Development", "duration": 75, "kc": 0.80},
            {"name": "Maturation", "duration": 30, "kc_start": 0.80, "kc_end": 0.55}
        ],
        "root_depth_m": 0.70, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.85
    },
    "Grape": {
        "category": "Fruits",
        "stages": [
            {"name": "Bud Break & Shoot Growth", "duration": 25, "kc": 0.40},
            {"name": "Flowering & Berry Set", "duration": 30, "kc_start": 0.40, "kc_end": 0.70},
            {"name": "Berry Development", "duration": 45, "kc": 0.70},
            {"name": "Veraison & Ripening", "duration": 25, "kc_start": 0.70, "kc_end": 0.45}
        ],
        "root_depth_m": 0.80, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.85
    },
    "Sapota (Chiku)": {
        "category": "Fruits",
        "stages": [
            {"name": "Vegetative", "duration": 60, "kc": 0.60},
            {"name": "Flowering", "duration": 30, "kc_start": 0.60, "kc_end": 0.85},
            {"name": "Fruit Development", "duration": 90, "kc": 0.85},
            {"name": "Harvest", "duration": 30, "kc_start": 0.85, "kc_end": 0.65}
        ],
        "root_depth_m": 1.00, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.75
    },
    "Jackfruit": {
        "category": "Fruits",
        "stages": [
            {"name": "Vegetative", "duration": 60, "kc": 0.55},
            {"name": "Flowering", "duration": 30, "kc_start": 0.55, "kc_end": 0.80},
            {"name": "Fruit Development", "duration": 90, "kc": 0.80},
            {"name": "Harvest", "duration": 30, "kc_start": 0.80, "kc_end": 0.60}
        ],
        "root_depth_m": 1.20, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.70
    },
    "Lemon / Lime": {
        "category": "Fruits",
        "stages": [
            {"name": "Dormancy", "duration": 40, "kc": 0.55},
            {"name": "Flowering & Fruit Set", "duration": 30, "kc_start": 0.55, "kc_end": 0.70},
            {"name": "Fruit Development", "duration": 90, "kc": 0.70},
            {"name": "Harvest", "duration": 30, "kc_start": 0.70, "kc_end": 0.60}
        ],
        "root_depth_m": 0.80, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.80
    },
    "Orange / Sweet Lime (Mosambi)": {
        "category": "Fruits",
        "stages": [
            {"name": "Dormancy", "duration": 40, "kc": 0.55},
            {"name": "Flowering & Fruit Set", "duration": 30, "kc_start": 0.55, "kc_end": 0.70},
            {"name": "Fruit Development", "duration": 90, "kc": 0.70},
            {"name": "Harvest", "duration": 40, "kc_start": 0.70, "kc_end": 0.60}
        ],
        "root_depth_m": 0.90, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.80
    },
    "Pineapple": {
        "category": "Fruits",
        "stages": [
            {"name": "Establishment", "duration": 60, "kc": 0.40},
            {"name": "Vegetative", "duration": 120, "kc_start": 0.40, "kc_end": 0.60},
            {"name": "Flowering & Fruit", "duration": 90, "kc": 0.60},
            {"name": "Harvest", "duration": 30, "kc_start": 0.60, "kc_end": 0.40}
        ],
        "root_depth_m": 0.30, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.80
    },
    "Fig (Anjeer)": {
        "category": "Fruits",
        "stages": [
            {"name": "Dormancy", "duration": 30, "kc": 0.40},
            {"name": "Leaf Out & Flowering", "duration": 30, "kc_start": 0.40, "kc_end": 0.80},
            {"name": "Fruit Development", "duration": 60, "kc": 0.80},
            {"name": "Harvest", "duration": 30, "kc_start": 0.80, "kc_end": 0.50}
        ],
        "root_depth_m": 0.80, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.80
    },

    # ─────────────────────── SPICES & CONDIMENTS ───────────────────────
    "Ginger": {
        "category": "Spices",
        "stages": [
            {"name": "Sprouting", "duration": 30, "kc": 0.50},
            {"name": "Vegetative", "duration": 50, "kc_start": 0.50, "kc_end": 1.00},
            {"name": "Rhizome Development", "duration": 60, "kc": 1.00},
            {"name": "Maturation", "duration": 30, "kc_start": 1.00, "kc_end": 0.70}
        ],
        "root_depth_m": 0.30, "depletion_fraction_p": 0.30, "yield_response_factor_ky": 1.00
    },
    "Turmeric (Arishina)": {
        "category": "Spices",
        "stages": [
            {"name": "Sprouting", "duration": 30, "kc": 0.50},
            {"name": "Vegetative", "duration": 50, "kc_start": 0.50, "kc_end": 1.00},
            {"name": "Rhizome Bulking", "duration": 60, "kc": 1.00},
            {"name": "Maturation", "duration": 30, "kc_start": 1.00, "kc_end": 0.70}
        ],
        "root_depth_m": 0.30, "depletion_fraction_p": 0.30, "yield_response_factor_ky": 1.00
    },
    "Black Pepper (Kari Menasu)": {
        "category": "Spices",
        "stages": [
            {"name": "Dormancy", "duration": 60, "kc": 0.50},
            {"name": "Flowering", "duration": 30, "kc_start": 0.50, "kc_end": 0.80},
            {"name": "Berry Development", "duration": 90, "kc": 0.80},
            {"name": "Harvest", "duration": 30, "kc_start": 0.80, "kc_end": 0.60}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 0.85
    },
    "Cardamom (Yalakki)": {
        "category": "Spices",
        "stages": [
            {"name": "Dormancy", "duration": 60, "kc": 0.60},
            {"name": "Flowering", "duration": 30, "kc_start": 0.60, "kc_end": 0.90},
            {"name": "Capsule Development", "duration": 90, "kc": 0.90},
            {"name": "Harvest", "duration": 30, "kc_start": 0.90, "kc_end": 0.70}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.35, "yield_response_factor_ky": 0.90
    },
    "Coriander (Kothambari)": {
        "category": "Spices",
        "stages": [
            {"name": "Germination", "duration": 15, "kc": 0.40},
            {"name": "Vegetative", "duration": 20, "kc_start": 0.40, "kc_end": 0.90},
            {"name": "Flowering", "duration": 20, "kc": 0.90},
            {"name": "Seed Maturity", "duration": 15, "kc_start": 0.90, "kc_end": 0.55}
        ],
        "root_depth_m": 0.25, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.90
    },
    "Cumin (Jeerige)": {
        "category": "Spices",
        "stages": [
            {"name": "Germination", "duration": 15, "kc": 0.40},
            {"name": "Vegetative", "duration": 20, "kc_start": 0.40, "kc_end": 0.95},
            {"name": "Flowering & Seed", "duration": 20, "kc": 0.95},
            {"name": "Maturity", "duration": 10, "kc_start": 0.95, "kc_end": 0.55}
        ],
        "root_depth_m": 0.25, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 1.00
    },
    "Fennel (Sompu)": {
        "category": "Spices",
        "stages": [
            {"name": "Germination", "duration": 20, "kc": 0.40},
            {"name": "Vegetative", "duration": 30, "kc_start": 0.40, "kc_end": 1.00},
            {"name": "Flowering & Seed", "duration": 30, "kc": 1.00},
            {"name": "Maturity", "duration": 15, "kc_start": 1.00, "kc_end": 0.60}
        ],
        "root_depth_m": 0.35, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.90
    },
    "Fenugreek (Menthya)": {
        "category": "Spices",
        "stages": [
            {"name": "Germination", "duration": 10, "kc": 0.40},
            {"name": "Vegetative", "duration": 20, "kc_start": 0.40, "kc_end": 0.90},
            {"name": "Flowering & Pod", "duration": 20, "kc": 0.90},
            {"name": "Maturity", "duration": 10, "kc_start": 0.90, "kc_end": 0.50}
        ],
        "root_depth_m": 0.25, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.90
    },
    "Curry Leaf (Karibevu)": {
        "category": "Spices",
        "stages": [
            {"name": "Establishment", "duration": 60, "kc": 0.55},
            {"name": "Vegetative", "duration": 60, "kc_start": 0.55, "kc_end": 0.80},
            {"name": "Harvest Cycles", "duration": 120, "kc": 0.80},
            {"name": "Rest", "duration": 30, "kc_start": 0.80, "kc_end": 0.55}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.70
    },
    "Vanilla": {
        "category": "Spices",
        "stages": [
            {"name": "Establishment", "duration": 90, "kc": 0.55},
            {"name": "Vine Growth", "duration": 120, "kc_start": 0.55, "kc_end": 0.85},
            {"name": "Flowering & Bean", "duration": 90, "kc": 0.85},
            {"name": "Late Season", "duration": 30, "kc_start": 0.85, "kc_end": 0.65}
        ],
        "root_depth_m": 0.30, "depletion_fraction_p": 0.35, "yield_response_factor_ky": 0.90
    },

    # ─────────────────────── COMMERCIAL & PLANTATION ───────────────────────
    "Coffee (Arabica/Robusta)": {
        "category": "Plantation",
        "stages": [
            {"name": "Dormancy / Pre-Blossom", "duration": 60, "kc": 0.70},
            {"name": "Blossom & Pin-Head Berry", "duration": 30, "kc_start": 0.70, "kc_end": 0.95},
            {"name": "Berry Development & Fill", "duration": 90, "kc": 0.95},
            {"name": "Harvest & Post-Harvest", "duration": 30, "kc_start": 0.95, "kc_end": 0.75}
        ],
        "root_depth_m": 0.80, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 0.85
    },
    "Tea": {
        "category": "Plantation",
        "stages": [
            {"name": "Dormancy", "duration": 40, "kc": 0.80},
            {"name": "Flush Period 1", "duration": 40, "kc_start": 0.80, "kc_end": 1.00},
            {"name": "Active Growth", "duration": 120, "kc": 1.00},
            {"name": "Rest Period", "duration": 30, "kc_start": 1.00, "kc_end": 0.80}
        ],
        "root_depth_m": 0.60, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 0.80
    },
    "Arecanut (Betel Nut)": {
        "category": "Plantation",
        "stages": [
            {"name": "Vegetative", "duration": 90, "kc": 0.85},
            {"name": "Inflorescence", "duration": 30, "kc_start": 0.85, "kc_end": 1.00},
            {"name": "Nut Development", "duration": 90, "kc": 1.00},
            {"name": "Harvest", "duration": 30, "kc_start": 1.00, "kc_end": 0.85}
        ],
        "root_depth_m": 0.60, "depletion_fraction_p": 0.35, "yield_response_factor_ky": 0.90
    },
    "Coconut": {
        "category": "Plantation",
        "stages": [
            {"name": "Year-Round (Juvenile)", "duration": 90, "kc": 0.80},
            {"name": "Inflorescence", "duration": 30, "kc_start": 0.80, "kc_end": 1.00},
            {"name": "Nut Development", "duration": 120, "kc": 1.00},
            {"name": "Harvest Cycle", "duration": 30, "kc_start": 1.00, "kc_end": 0.85}
        ],
        "root_depth_m": 0.70, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 0.80
    },
    "Cashew": {
        "category": "Plantation",
        "stages": [
            {"name": "Dormancy", "duration": 60, "kc": 0.45},
            {"name": "Flowering", "duration": 30, "kc_start": 0.45, "kc_end": 0.70},
            {"name": "Nut Development", "duration": 60, "kc": 0.70},
            {"name": "Harvest", "duration": 30, "kc_start": 0.70, "kc_end": 0.50}
        ],
        "root_depth_m": 0.90, "depletion_fraction_p": 0.55, "yield_response_factor_ky": 0.70
    },
    "Rubber": {
        "category": "Plantation",
        "stages": [
            {"name": "Wintering (Leaf Fall)", "duration": 30, "kc": 0.60},
            {"name": "Re-Foliation", "duration": 30, "kc_start": 0.60, "kc_end": 0.95},
            {"name": "Active Tapping", "duration": 180, "kc": 0.95},
            {"name": "Pre-Wintering", "duration": 30, "kc_start": 0.95, "kc_end": 0.70}
        ],
        "root_depth_m": 1.00, "depletion_fraction_p": 0.45, "yield_response_factor_ky": 0.75
    },
    "Sugarcane": {
        "category": "Commercial",
        "stages": [
            {"name": "Germination & Establishment", "duration": 35, "kc": 0.40},
            {"name": "Tillering & Grand Growth", "duration": 60, "kc_start": 0.40, "kc_end": 1.25},
            {"name": "Elongation & Ripening", "duration": 90, "kc": 1.25},
            {"name": "Maturation & Harvest", "duration": 45, "kc_start": 1.25, "kc_end": 0.75}
        ],
        "root_depth_m": 0.60, "depletion_fraction_p": 0.65, "yield_response_factor_ky": 1.20
    },
    "Cotton": {
        "category": "Commercial",
        "stages": [
            {"name": "Emergence", "duration": 30, "kc": 0.35},
            {"name": "Vegetative & Square", "duration": 50, "kc_start": 0.35, "kc_end": 1.15},
            {"name": "Flowering & Boll Fill", "duration": 55, "kc": 1.15},
            {"name": "Boll Opening & Harvest", "duration": 30, "kc_start": 1.15, "kc_end": 0.50}
        ],
        "root_depth_m": 0.70, "depletion_fraction_p": 0.65, "yield_response_factor_ky": 0.85
    },
    "Tobacco": {
        "category": "Commercial",
        "stages": [
            {"name": "Transplant", "duration": 20, "kc": 0.50},
            {"name": "Vegetative", "duration": 30, "kc_start": 0.50, "kc_end": 1.10},
            {"name": "Leaf Development", "duration": 35, "kc": 1.10},
            {"name": "Harvest & Curing", "duration": 25, "kc_start": 1.10, "kc_end": 0.80}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.50, "yield_response_factor_ky": 0.90
    },
    "Mulberry (Sericulture)": {
        "category": "Commercial",
        "stages": [
            {"name": "Post-Pruning Regrowth", "duration": 15, "kc": 0.50},
            {"name": "Active Leaf Growth", "duration": 25, "kc_start": 0.50, "kc_end": 1.00},
            {"name": "Full Canopy Harvest", "duration": 20, "kc": 1.00},
            {"name": "Pre-Pruning", "duration": 10, "kc_start": 1.00, "kc_end": 0.70}
        ],
        "root_depth_m": 0.60, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 0.90
    },

    # ─────────────────────── FLOWERS ───────────────────────
    "Jasmine (Mallige)": {
        "category": "Flowers",
        "stages": [
            {"name": "Pruning Recovery", "duration": 20, "kc": 0.50},
            {"name": "Vegetative & Bud Formation", "duration": 30, "kc_start": 0.50, "kc_end": 0.85},
            {"name": "Flowering Season", "duration": 120, "kc": 0.85},
            {"name": "Rest", "duration": 30, "kc_start": 0.85, "kc_end": 0.55}
        ],
        "root_depth_m": 0.40, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 0.90
    },
    "Marigold (Chendu Hoovu)": {
        "category": "Flowers",
        "stages": [
            {"name": "Transplant", "duration": 15, "kc": 0.45},
            {"name": "Vegetative", "duration": 25, "kc_start": 0.45, "kc_end": 0.90},
            {"name": "Flowering", "duration": 40, "kc": 0.90},
            {"name": "Late Picking", "duration": 15, "kc_start": 0.90, "kc_end": 0.70}
        ],
        "root_depth_m": 0.30, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 0.85
    },
    "Rose (Gulab)": {
        "category": "Flowers",
        "stages": [
            {"name": "Pruning Recovery", "duration": 20, "kc": 0.50},
            {"name": "Vegetative & Bud", "duration": 25, "kc_start": 0.50, "kc_end": 0.85},
            {"name": "Flowering", "duration": 90, "kc": 0.85},
            {"name": "Rest", "duration": 20, "kc_start": 0.85, "kc_end": 0.55}
        ],
        "root_depth_m": 0.50, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 0.90
    },
    "Chrysanthemum (Sevanthi)": {
        "category": "Flowers",
        "stages": [
            {"name": "Transplant", "duration": 20, "kc": 0.45},
            {"name": "Vegetative & Pinching", "duration": 30, "kc_start": 0.45, "kc_end": 0.90},
            {"name": "Bud & Flowering", "duration": 35, "kc": 0.90},
            {"name": "Late Harvest", "duration": 15, "kc_start": 0.90, "kc_end": 0.70}
        ],
        "root_depth_m": 0.30, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 0.85
    },
    "Crossandra (Kanakambara)": {
        "category": "Flowers",
        "stages": [
            {"name": "Establishment", "duration": 30, "kc": 0.45},
            {"name": "Vegetative", "duration": 30, "kc_start": 0.45, "kc_end": 0.80},
            {"name": "Flowering", "duration": 120, "kc": 0.80},
            {"name": "Rest", "duration": 30, "kc_start": 0.80, "kc_end": 0.50}
        ],
        "root_depth_m": 0.30, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 0.85
    },
    "Tuberose (Rajnigandha)": {
        "category": "Flowers",
        "stages": [
            {"name": "Bulb Sprouting", "duration": 25, "kc": 0.45},
            {"name": "Vegetative", "duration": 35, "kc_start": 0.45, "kc_end": 0.85},
            {"name": "Flowering", "duration": 60, "kc": 0.85},
            {"name": "Late Season", "duration": 20, "kc_start": 0.85, "kc_end": 0.60}
        ],
        "root_depth_m": 0.25, "depletion_fraction_p": 0.40, "yield_response_factor_ky": 0.85
    },
}

# ============================================================================
# SOIL DATABASE — 12+ Karnataka soil types
# ============================================================================
SOIL_DATABASE: Dict[str, Dict[str, float]] = {
    "Red Sandy Loam": {
        "fc": 0.22, "wp": 0.10, "description": "Common across Eastern and Southern Dry Zones of Karnataka. Good drainage, moderate fertility."
    },
    "Red Laterite": {
        "fc": 0.25, "wp": 0.12, "description": "Found in Malnad and transition zones. High iron content, acidic, moderate water retention."
    },
    "Deep Black Cotton Soil (Vertisol)": {
        "fc": 0.40, "wp": 0.22, "description": "Dominant in North Karnataka (Belagavi, Dharwad, Kalaburagi). Very high clay content, swells when wet, cracks when dry."
    },
    "Shallow Black Soil": {
        "fc": 0.32, "wp": 0.18, "description": "Thin black soil layer over hard rock. Found in parts of Bidar, Raichur. Limited root depth."
    },
    "Coastal Alluvial": {
        "fc": 0.28, "wp": 0.12, "description": "Found along Karnataka coast (DK, Udupi, UK). Sandy with high organic matter near river deltas."
    },
    "Laterite (Coastal/Malnad)": {
        "fc": 0.26, "wp": 0.14, "description": "Highly weathered soil in Western Ghats foothills and coast. Acidic, poor in nitrogen & phosphorus."
    },
    "Sandy Soil": {
        "fc": 0.12, "wp": 0.05, "description": "Found in parts of Ramanagara, Chitradurga. Very low water holding capacity, needs frequent irrigation."
    },
    "Clay Loam": {
        "fc": 0.35, "wp": 0.17, "description": "Balanced texture soil found in transition zones. Good water and nutrient retention."
    },
    "Silty Clay": {
        "fc": 0.38, "wp": 0.20, "description": "Found in river valley areas. High water retention but prone to waterlogging."
    },
    "Forest Loam": {
        "fc": 0.30, "wp": 0.13, "description": "Rich organic soil in Western Ghats forest areas (Kodagu, Chikkamagaluru). Excellent for coffee and spices."
    },
    "Gravelly Red Soil": {
        "fc": 0.18, "wp": 0.08, "description": "Found in undulating terrain of Tumakuru, Chitradurga. Coarse with poor water retention."
    },
    "Saline-Alkaline": {
        "fc": 0.30, "wp": 0.16, "description": "Found in parts of Mandya, Raichur. High salt content, needs reclamation for productive agriculture."
    },
}


# ============================================================================
# KARNATAKA DISTRICT WEATHER — 31 districts with agro-climatic normals
# ============================================================================
KARNATAKA_DISTRICT_WEATHER: Dict[str, Dict[str, Any]] = {
    "Bengaluru Urban": {
        "zone": "Eastern Dry Zone (ACZ-5)",
        "latitude": 12.9716, "longitude": 77.5946,
        "elevation_m": 920,
        "default_soil": "Red Sandy Loam",
        "temp_min_c": 19.5, "temp_max_c": 31.0,
        "annual_rainfall_mm": 920,
        "monsoon_rain_daily_avg_mm": 6.5,
        "primary_crops": ["Finger Millet (Ragi)", "Tomato", "Cabbage", "Maize (Corn)"]
    },
    "Bengaluru Rural": {
        "zone": "Eastern Dry Zone (ACZ-5)",
        "latitude": 13.1294, "longitude": 77.5730,
        "elevation_m": 905,
        "default_soil": "Red Sandy Loam",
        "temp_min_c": 19.0, "temp_max_c": 31.5,
        "annual_rainfall_mm": 880,
        "monsoon_rain_daily_avg_mm": 6.0,
        "primary_crops": ["Finger Millet (Ragi)", "Chili (Green/Red)", "Mango", "Tomato"]
    },
    "Mysuru (Mysore)": {
        "zone": "Southern Dry Zone (ACZ-6)",
        "latitude": 12.2958, "longitude": 76.6394,
        "elevation_m": 763,
        "default_soil": "Red Sandy Loam",
        "temp_min_c": 20.0, "temp_max_c": 32.5,
        "annual_rainfall_mm": 790,
        "monsoon_rain_daily_avg_mm": 5.2,
        "primary_crops": ["Sugarcane", "Rice (Paddy)", "Finger Millet (Ragi)", "Cotton"]
    },
    "Mandya (Cauvery Basin)": {
        "zone": "Southern Dry Zone (ACZ-6)",
        "latitude": 12.5218, "longitude": 76.8951,
        "elevation_m": 695,
        "default_soil": "Red Sandy Loam",
        "temp_min_c": 20.5, "temp_max_c": 33.0,
        "annual_rainfall_mm": 710,
        "monsoon_rain_daily_avg_mm": 4.5,
        "primary_crops": ["Sugarcane", "Rice (Paddy)", "Coconut", "Finger Millet (Ragi)"]
    },
    "Chamarajanagar": {
        "zone": "Southern Dry Zone (ACZ-6)",
        "latitude": 11.9261, "longitude": 76.9437,
        "elevation_m": 690,
        "default_soil": "Red Sandy Loam",
        "temp_min_c": 20.5, "temp_max_c": 33.5,
        "annual_rainfall_mm": 750,
        "monsoon_rain_daily_avg_mm": 5.0,
        "primary_crops": ["Sugarcane", "Rice (Paddy)", "Maize (Corn)", "Banana"]
    },
    "Kodagu (Coorg)": {
        "zone": "Hilly Zone (ACZ-9) / Western Ghats",
        "latitude": 12.4244, "longitude": 75.7382,
        "elevation_m": 1150,
        "default_soil": "Forest Loam",
        "temp_min_c": 15.0, "temp_max_c": 27.5,
        "annual_rainfall_mm": 2850,
        "monsoon_rain_daily_avg_mm": 28.0,
        "primary_crops": ["Coffee (Arabica/Robusta)", "Black Pepper (Kari Menasu)", "Cardamom (Yalakki)", "Rice (Paddy)"]
    },
    "Hassan": {
        "zone": "Southern Transition Zone (ACZ-7)",
        "latitude": 13.0072, "longitude": 76.0961,
        "elevation_m": 957,
        "default_soil": "Red Sandy Loam",
        "temp_min_c": 18.5, "temp_max_c": 30.5,
        "annual_rainfall_mm": 1030,
        "monsoon_rain_daily_avg_mm": 8.5,
        "primary_crops": ["Potato", "Coffee (Arabica/Robusta)", "Finger Millet (Ragi)", "Maize (Corn)"]
    },
    "Chikkamagaluru": {
        "zone": "Hilly Zone (ACZ-9) / Western Ghats",
        "latitude": 13.3161, "longitude": 75.7720,
        "elevation_m": 1090,
        "default_soil": "Laterite (Coastal/Malnad)",
        "temp_min_c": 17.5, "temp_max_c": 28.5,
        "annual_rainfall_mm": 1950,
        "monsoon_rain_daily_avg_mm": 20.0,
        "primary_crops": ["Coffee (Arabica/Robusta)", "Arecanut (Betel Nut)", "Black Pepper (Kari Menasu)", "Cardamom (Yalakki)"]
    },
    "Shivamogga (Shimoga)": {
        "zone": "Southern Transition Zone (ACZ-7)",
        "latitude": 13.9299, "longitude": 75.5681,
        "elevation_m": 584,
        "default_soil": "Laterite (Coastal/Malnad)",
        "temp_min_c": 20.0, "temp_max_c": 31.5,
        "annual_rainfall_mm": 1820,
        "monsoon_rain_daily_avg_mm": 18.5,
        "primary_crops": ["Arecanut (Betel Nut)", "Rice (Paddy)", "Maize (Corn)", "Ginger"]
    },
    "Dakshina Kannada (Mangaluru)": {
        "zone": "Coastal Zone (ACZ-10)",
        "latitude": 12.9141, "longitude": 74.8560,
        "elevation_m": 22,
        "default_soil": "Laterite (Coastal/Malnad)",
        "temp_min_c": 23.5, "temp_max_c": 33.0,
        "annual_rainfall_mm": 3950,
        "monsoon_rain_daily_avg_mm": 35.0,
        "primary_crops": ["Arecanut (Betel Nut)", "Coconut", "Rice (Paddy)", "Cashew"]
    },
    "Udupi": {
        "zone": "Coastal Zone (ACZ-10)",
        "latitude": 13.3409, "longitude": 74.7421,
        "elevation_m": 18,
        "default_soil": "Laterite (Coastal/Malnad)",
        "temp_min_c": 23.5, "temp_max_c": 32.5,
        "annual_rainfall_mm": 4100,
        "monsoon_rain_daily_avg_mm": 38.0,
        "primary_crops": ["Coconut", "Arecanut (Betel Nut)", "Rice (Paddy)", "Cashew"]
    },
    "Uttara Kannada (Karwar)": {
        "zone": "Coastal Zone (ACZ-10)",
        "latitude": 14.8185, "longitude": 74.1240,
        "elevation_m": 15,
        "default_soil": "Laterite (Coastal/Malnad)",
        "temp_min_c": 22.5, "temp_max_c": 32.0,
        "annual_rainfall_mm": 3400,
        "monsoon_rain_daily_avg_mm": 30.0,
        "primary_crops": ["Arecanut (Betel Nut)", "Coconut", "Rice (Paddy)", "Cashew"]
    },
    "Belagavi (Belgaum)": {
        "zone": "Northern Transition Zone (ACZ-8)",
        "latitude": 15.8497, "longitude": 74.4977,
        "elevation_m": 784,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 19.5, "temp_max_c": 33.0,
        "annual_rainfall_mm": 1200,
        "monsoon_rain_daily_avg_mm": 9.5,
        "primary_crops": ["Sugarcane", "Soybean", "Maize (Corn)", "Groundnut (Peanut)"]
    },
    "Dharwad (Hubballi-Dharwad)": {
        "zone": "Northern Transition Zone (ACZ-8)",
        "latitude": 15.4589, "longitude": 75.0078,
        "elevation_m": 750,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 20.0, "temp_max_c": 33.5,
        "annual_rainfall_mm": 780,
        "monsoon_rain_daily_avg_mm": 6.2,
        "primary_crops": ["Soybean", "Cotton", "Groundnut (Peanut)", "Wheat"]
    },
    "Haveri": {
        "zone": "Northern Transition Zone (ACZ-8)",
        "latitude": 14.7951, "longitude": 75.4040,
        "elevation_m": 570,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 20.5, "temp_max_c": 34.0,
        "annual_rainfall_mm": 700,
        "monsoon_rain_daily_avg_mm": 5.5,
        "primary_crops": ["Maize (Corn)", "Cotton", "Arecanut (Betel Nut)", "Groundnut (Peanut)"]
    },
    "Gadag": {
        "zone": "Northern Dry Zone (ACZ-3)",
        "latitude": 15.4315, "longitude": 75.6355,
        "elevation_m": 650,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 21.0, "temp_max_c": 35.0,
        "annual_rainfall_mm": 590,
        "monsoon_rain_daily_avg_mm": 4.0,
        "primary_crops": ["Cotton", "Sorghum (Jowar)", "Groundnut (Peanut)", "Sunflower"]
    },
    "Bagalkot (Ghataprabha Basin)": {
        "zone": "Northern Dry Zone (ACZ-3)",
        "latitude": 16.1691, "longitude": 75.6615,
        "elevation_m": 535,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 21.5, "temp_max_c": 36.0,
        "annual_rainfall_mm": 560,
        "monsoon_rain_daily_avg_mm": 3.8,
        "primary_crops": ["Grape", "Sugarcane", "Wheat", "Sorghum (Jowar)"]
    },
    "Vijayapura (Bijapur)": {
        "zone": "Northern Dry Zone (ACZ-3)",
        "latitude": 16.8302, "longitude": 75.7100,
        "elevation_m": 592,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 22.0, "temp_max_c": 37.5,
        "annual_rainfall_mm": 550,
        "monsoon_rain_daily_avg_mm": 3.5,
        "primary_crops": ["Pigeon Pea (Tur/Arhar)", "Sorghum (Jowar)", "Sunflower", "Grape"]
    },
    "Kalaburagi (Gulbarga)": {
        "zone": "North Eastern Dry Zone (ACZ-2)",
        "latitude": 17.3297, "longitude": 76.8343,
        "elevation_m": 454,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 22.0, "temp_max_c": 38.5,
        "annual_rainfall_mm": 750,
        "monsoon_rain_daily_avg_mm": 5.0,
        "primary_crops": ["Pigeon Pea (Tur/Arhar)", "Cotton", "Sorghum (Jowar)", "Chickpea (Bengal Gram)"]
    },
    "Bidar": {
        "zone": "North Eastern Dry Zone (ACZ-2)",
        "latitude": 17.9135, "longitude": 77.5200,
        "elevation_m": 715,
        "default_soil": "Shallow Black Soil",
        "temp_min_c": 21.0, "temp_max_c": 36.0,
        "annual_rainfall_mm": 870,
        "monsoon_rain_daily_avg_mm": 6.0,
        "primary_crops": ["Sorghum (Jowar)", "Pigeon Pea (Tur/Arhar)", "Soybean", "Sugarcane"]
    },
    "Raichur (Doab Basin)": {
        "zone": "North Eastern Dry Zone (ACZ-2)",
        "latitude": 16.2076, "longitude": 77.3550,
        "elevation_m": 407,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 23.0, "temp_max_c": 39.0,
        "annual_rainfall_mm": 620,
        "monsoon_rain_daily_avg_mm": 3.8,
        "primary_crops": ["Rice (Paddy)", "Cotton", "Groundnut (Peanut)", "Sorghum (Jowar)"]
    },
    "Ballari (Bellary)": {
        "zone": "North Eastern Dry Zone (ACZ-2)",
        "latitude": 15.1394, "longitude": 76.9214,
        "elevation_m": 495,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 22.5, "temp_max_c": 38.0,
        "annual_rainfall_mm": 610,
        "monsoon_rain_daily_avg_mm": 4.0,
        "primary_crops": ["Rice (Paddy)", "Cotton", "Chili (Green/Red)", "Sunflower"]
    },
    "Koppal": {
        "zone": "Northern Dry Zone (ACZ-3)",
        "latitude": 15.3547, "longitude": 76.1546,
        "elevation_m": 517,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 22.0, "temp_max_c": 37.0,
        "annual_rainfall_mm": 570,
        "monsoon_rain_daily_avg_mm": 3.5,
        "primary_crops": ["Rice (Paddy)", "Sorghum (Jowar)", "Groundnut (Peanut)", "Cotton"]
    },
    "Yadgir": {
        "zone": "North Eastern Dry Zone (ACZ-2)",
        "latitude": 16.7701, "longitude": 77.1335,
        "elevation_m": 420,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 22.5, "temp_max_c": 38.0,
        "annual_rainfall_mm": 680,
        "monsoon_rain_daily_avg_mm": 4.5,
        "primary_crops": ["Pigeon Pea (Tur/Arhar)", "Sorghum (Jowar)", "Chickpea (Bengal Gram)", "Cotton"]
    },
    "Davangere": {
        "zone": "Central Dry Zone (ACZ-4)",
        "latitude": 14.4644, "longitude": 75.9218,
        "elevation_m": 602,
        "default_soil": "Deep Black Cotton Soil (Vertisol)",
        "temp_min_c": 21.0, "temp_max_c": 34.5,
        "annual_rainfall_mm": 640,
        "monsoon_rain_daily_avg_mm": 4.5,
        "primary_crops": ["Maize (Corn)", "Rice (Paddy)", "Sugarcane", "Arecanut (Betel Nut)"]
    },
    "Chitradurga": {
        "zone": "Central Dry Zone (ACZ-4)",
        "latitude": 14.2304, "longitude": 76.3980,
        "elevation_m": 732,
        "default_soil": "Gravelly Red Soil",
        "temp_min_c": 20.5, "temp_max_c": 34.0,
        "annual_rainfall_mm": 580,
        "monsoon_rain_daily_avg_mm": 4.0,
        "primary_crops": ["Groundnut (Peanut)", "Sunflower", "Maize (Corn)", "Finger Millet (Ragi)"]
    },
    "Tumakuru (Tumkur)": {
        "zone": "Central Dry Zone (ACZ-4)",
        "latitude": 13.3392, "longitude": 77.1166,
        "elevation_m": 822,
        "default_soil": "Red Sandy Loam",
        "temp_min_c": 19.5, "temp_max_c": 33.0,
        "annual_rainfall_mm": 720,
        "monsoon_rain_daily_avg_mm": 4.5,
        "primary_crops": ["Coconut", "Finger Millet (Ragi)", "Groundnut (Peanut)", "Arecanut (Betel Nut)"]
    },
    "Kolar": {
        "zone": "Eastern Dry Zone (ACZ-5)",
        "latitude": 13.1367, "longitude": 78.1290,
        "elevation_m": 822,
        "default_soil": "Red Sandy Loam",
        "temp_min_c": 18.5, "temp_max_c": 32.5,
        "annual_rainfall_mm": 740,
        "monsoon_rain_daily_avg_mm": 4.2,
        "primary_crops": ["Tomato", "Mango", "Potato", "Finger Millet (Ragi)"]
    },
    "Chikkaballapura": {
        "zone": "Eastern Dry Zone (ACZ-5)",
        "latitude": 13.4325, "longitude": 77.7273,
        "elevation_m": 915,
        "default_soil": "Red Sandy Loam",
        "temp_min_c": 18.0, "temp_max_c": 32.0,
        "annual_rainfall_mm": 710,
        "monsoon_rain_daily_avg_mm": 4.0,
        "primary_crops": ["Tomato", "Grape", "Pomegranate", "Finger Millet (Ragi)"]
    },
    "Ramanagara": {
        "zone": "Eastern Dry Zone (ACZ-5)",
        "latitude": 12.7159, "longitude": 77.2810,
        "elevation_m": 800,
        "default_soil": "Red Sandy Loam",
        "temp_min_c": 19.0, "temp_max_c": 32.0,
        "annual_rainfall_mm": 770,
        "monsoon_rain_daily_avg_mm": 5.0,
        "primary_crops": ["Mulberry (Sericulture)", "Finger Millet (Ragi)", "Coconut", "Mango"]
    },
}


# ============================================================================
# FAO-56 COMPUTATION ENGINE
# ============================================================================
class FAO56IrrigationEngine:
    """
    Computes reference evapotranspiration (ET₀), crop water need (ETc),
    soil water balance, and irrigation scheduling advisory per FAO-56 standards.
    """

    @staticmethod
    def _hargreaves_et0(temp_min_c: float, temp_max_c: float, latitude_deg: float, day_of_year: int = 200) -> float:
        """Hargreaves-Samani method for reference ET₀ (mm/day)."""
        t_mean = (temp_min_c + temp_max_c) / 2.0
        t_range = max(0.1, temp_max_c - temp_min_c)
        lat_rad = math.radians(latitude_deg)
        dr = 1.0 + 0.033 * math.cos(2.0 * math.pi * day_of_year / 365.0)
        delta = 0.409 * math.sin(2.0 * math.pi * day_of_year / 365.0 - 1.39)
        ws = math.acos(max(-1.0, min(1.0, -math.tan(lat_rad) * math.tan(delta))))
        ra = (24.0 * 60.0 / math.pi) * 0.0820 * dr * (
            ws * math.sin(lat_rad) * math.sin(delta) +
            math.cos(lat_rad) * math.cos(delta) * math.sin(ws)
        )
        et0 = 0.0023 * ra * (t_mean + 17.8) * math.sqrt(t_range)
        return round(max(0.5, et0), 2)

    @staticmethod
    def _get_kc_for_day(crop_data: dict, days_since_planting: int) -> tuple:
        """Returns (current_kc, growth_stage_name) for the given day since planting."""
        stages = crop_data["stages"]
        cumulative = 0
        for stage in stages:
            stage_start = cumulative
            stage_end = cumulative + stage["duration"]
            if days_since_planting < stage_end:
                day_in_stage = days_since_planting - stage_start
                fraction = day_in_stage / max(1, stage["duration"])
                if "kc" in stage:
                    return stage["kc"], stage["name"]
                else:
                    kc = stage["kc_start"] + (stage["kc_end"] - stage["kc_start"]) * fraction
                    return round(kc, 3), stage["name"]
            cumulative = stage_end
        last_stage = stages[-1]
        kc = last_stage.get("kc", last_stage.get("kc_end", 0.50))
        return kc, last_stage["name"]

    @staticmethod
    def compute_irrigation_advisory(
        crop_name: str,
        days_since_planting: int,
        soil_type: str,
        temp_min_c: float,
        temp_max_c: float,
        recent_rainfall_mm: float,
        current_depletion_mm: float,
        latitude_deg: float = 13.0,
        field_area_ha: float = 1.0,
        district_name: str = "Bengaluru Urban"
    ) -> Dict[str, Any]:
        """Main computation: returns full irrigation advisory."""

        crop = CROP_DATABASE.get(crop_name)
        if not crop:
            first_crop = list(CROP_DATABASE.keys())[0]
            crop = CROP_DATABASE[first_crop]
            crop_name = first_crop

        soil = SOIL_DATABASE.get(soil_type)
        if not soil:
            soil = SOIL_DATABASE.get("Red Sandy Loam", list(SOIL_DATABASE.values())[0])
            soil_type = "Red Sandy Loam"

        fc = soil["fc"]
        wp = soil["wp"]
        root_depth = crop["root_depth_m"]
        p = crop["depletion_fraction_p"]

        et0 = FAO56IrrigationEngine._hargreaves_et0(temp_min_c, temp_max_c, latitude_deg)
        kc, growth_stage = FAO56IrrigationEngine._get_kc_for_day(crop, days_since_planting)
        etc = round(et0 * kc, 2)

        effective_rain = round(recent_rainfall_mm * 0.80, 2)

        taw = round((fc - wp) * root_depth * 1000.0, 2)
        raw = round(p * taw, 2)

        depletion_after_rain = max(0.0, current_depletion_mm - effective_rain)
        depletion_pct_raw = round((depletion_after_rain / max(0.1, raw)) * 100.0, 1)
        depletion_pct_taw = round((depletion_after_rain / max(0.1, taw)) * 100.0, 1)

        needs_irrigation = depletion_after_rain >= raw
        if needs_irrigation:
            net_mm = round(depletion_after_rain, 2)
            gross_mm = round(net_mm / 0.85, 2)
            irrigation_status = "IRRIGATE TODAY"
            urgency_color = "#ef4444"
        elif depletion_pct_raw >= 70:
            net_mm = 0.0
            gross_mm = 0.0
            irrigation_status = "IRRIGATION NEEDED SOON"
            urgency_color = "#f59e0b"
        else:
            net_mm = 0.0
            gross_mm = 0.0
            irrigation_status = "ADEQUATE SOIL MOISTURE"
            urgency_color = "#10b981"

        water_volume_m3 = round(gross_mm * field_area_ha * 10.0, 1)

        # Simple advisory in farmer-friendly language
        if needs_irrigation:
            advisory = f"Your {crop_name} in {district_name} needs watering today. The soil has dried beyond the safe limit. Apply about {gross_mm:.0f} mm of water ({water_volume_m3:.0f} m³ for your {field_area_ha} hectare field). The crop is in the '{growth_stage}' phase and needs {etc} mm of water daily."
        elif depletion_pct_raw >= 70:
            days_left = max(0, round((raw - depletion_after_rain) / max(0.5, etc)))
            advisory = f"Your {crop_name} in {district_name} will need watering in about {days_left} day(s). The soil still has some moisture but is getting low. Keep watching and prepare to irrigate."
        else:
            days_left = max(0, round((raw - depletion_after_rain) / max(0.5, etc)))
            advisory = f"Your {crop_name} in {district_name} has enough soil moisture. No watering needed today. The soil can supply water for about {days_left} more day(s). The crop is in the '{growth_stage}' phase."

        # 7-day forecast
        forecast = []
        proj_depletion = depletion_after_rain
        for i in range(1, 8):
            proj_depletion += etc
            forecast.append({
                "day": f"Day +{i}",
                "forecast_etc_mm": etc,
                "projected_depletion_mm": round(proj_depletion, 2),
                "threshold_raw_mm": raw,
                "irrigate_flag": proj_depletion >= raw
            })

        return {
            "crop": crop_name,
            "crop_category": crop.get("category", "General"),
            "district_name": district_name,
            "growth_stage": growth_stage,
            "days_since_planting": days_since_planting,
            "soil_type": soil_type,
            "soil_description": soil.get("description", ""),
            "et0_reference_mm_day": et0,
            "crop_coefficient_kc": kc,
            "etc_crop_water_need_mm_day": etc,
            "effective_rainfall_mm": effective_rain,
            "taw_total_available_water_mm": taw,
            "raw_readily_available_water_mm": raw,
            "current_depletion_mm": round(depletion_after_rain, 2),
            "depletion_percentage_raw": depletion_pct_raw,
            "depletion_percentage_taw": depletion_pct_taw,
            "needs_irrigation": needs_irrigation,
            "irrigation_status": irrigation_status,
            "urgency_color": urgency_color,
            "recommended_net_mm": net_mm,
            "recommended_gross_mm": gross_mm,
            "required_water_volume_m3": water_volume_m3,
            "field_area_ha": field_area_ha,
            "advisory_summary": advisory,
            "forecast_7day": forecast
        }
