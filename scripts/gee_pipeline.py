"""
Google Earth Engine (GEE) Satellite Data Acquisition Pipeline
Extracts Sentinel-1 SAR (VV/VH), Sentinel-2 MSI (B3, B4, B8, B11), SRTM DEM, and CHIRPS Daily Rainfall.
"""

import os
import sys

def get_gee_extraction_script():
    script_content = '''import ee

# 1. Initialize Earth Engine (Requires free GEE account: earthengine authenticate)
ee.Initialize()

# 2. Define Area of Interest (AOI) - Example: Bengaluru East Basin
aoi = ee.Geometry.Rectangle([77.6400, 12.9050, 77.7450, 12.9650])

# 3. Sentinel-2 Surface Reflectance (Optical)
def mask_s2_clouds(image):
    qa = image.select('QA60')
    cloud_bit_mask = 1 << 10
    cirrus_bit_mask = 1 << 11
    mask = qa.bitwiseAnd(cloud_bit_mask).eq(0).And(qa.bitwiseAnd(cirrus_bit_mask).eq(0))
    return image.updateMask(mask).divide(10000)

s2_collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(aoi)
    .filterDate('2026-06-01', '2026-08-30')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(mask_s2_clouds)
    .median()
    .clip(aoi))

# Compute Spectral Indices
ndwi = s2_collection.normalizedDifference(['B3', 'B8']).rename('ndwi') # (Green - NIR)/(Green + NIR)
mndwi = s2_collection.normalizedDifference(['B3', 'B11']).rename('mndwi') # (Green - SWIR)/(Green + SWIR)
ndvi = s2_collection.normalizedDifference(['B8', 'B4']).rename('ndvi') # (NIR - Red)/(NIR + Red)

# 4. Sentinel-1 SAR GRD (Microwave Radar)
s1_collection = (ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(aoi)
    .filterDate('2026-08-15', '2026-08-30')
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
    .mean()
    .clip(aoi))

vv = s1_collection.select('VV').rename('vv_db')
vh = s1_collection.select('VH').rename('vh_db')

# 5. SRTM Digital Elevation Model (30m Elevation & Slope)
dem = ee.Image('USGS/SRTMGL1_003').clip(aoi)
elevation = dem.select('elevation').rename('elevation_m')
slope = ee.Terrain.slope(elevation).rename('slope_deg')

# 6. CHIRPS Daily Rainfall (Precipitation)
chirps = (ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
    .filterBounds(aoi)
    .filterDate('2026-08-20', '2026-08-28')
    .sum()
    .clip(aoi)
    .rename('rainfall_mm'))

# 7. Stack All 8 Multimodal Bands into Feature Image
stacked_features = ee.Image.cat([
    ndwi, mndwi, ndvi, vv, vh, elevation, slope, chirps
])

print("Multimodal feature bands ready for export:", stacked_features.bandNames().getInfo())

# Export to Google Drive as GeoTIFF
task = ee.batch.Export.image.toDrive(
    image=stacked_features,
    description='Bengaluru_Waterlogging_Features_8Bands',
    folder='EarthEngine_Waterlogging',
    fileNamePrefix='bengaluru_features',
    region=aoi,
    scale=10,
    crs='EPSG:4326',
    maxPixels=1e9
)
task.start()
print("Export task started to Google Drive!")
'''
    return script_content

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(__file__), "gee_pipeline.py")
    with open(out_file, "w") as f:
        f.write(get_gee_extraction_script())
    print(f"[+] Google Earth Engine pipeline script written to {out_file}")
