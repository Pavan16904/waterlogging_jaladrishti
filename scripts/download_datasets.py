"""
Dataset Download and Preprocessing Pipeline
JalaDrishti AI - Earth Observation Flood Intelligence
"""

import os
import sys
import json
import urllib.request
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
SEED_DIR = os.path.join(DATA_DIR, "seed_data")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(SEED_DIR, exist_ok=True)

SEN1FLOODS11_README = """# Sen1Floods11 Dataset Guide

Sen1Floods11 contains 446 hand-labeled Sentinel-1 SAR and Sentinel-2 optical image chips (512x512 pixels) across 11 major global flood events.

## Official Download Instructions:
1. Install Google Cloud SDK: `https://cloud.google.com/sdk/docs/install`
2. Sync the Hand-Labeled dataset (~1.5 GB for chips or ~14 GB for raw):
   ```bash
   gsutil -m rsync -r gs://sen1floods11/v1.1/data/flood_events/HandLabeled/ ./data/raw/sen1floods11/
   ```
3. Bands Included:
   - S1Hand: Sentinel-1 SAR (Band 1: VV, Band 2: VH)
   - S2Hand: Sentinel-2 Multispectral (B2 Blue, B3 Green, B4 Red, B8 NIR, B11 SWIR1, B12 SWIR2)
   - LabelHand: Ground Truth (0: No Water, 1: Water/Flood, -1: Cloud/Invalid)
"""

with open(os.path.join(RAW_DIR, "SEN1FLOODS11_INSTRUCTIONS.md"), "w") as f:
    f.write(SEN1FLOODS11_README)

print(f"[*] Dataset directories initialized at {DATA_DIR}")
print(f"[*] Instructions written to {os.path.join(RAW_DIR, 'SEN1FLOODS11_INSTRUCTIONS.md')}")
