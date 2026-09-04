import { pool, initializeDatabase, query } from './index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  console.log('[*] Starting Database Seeding with Expanded Karnataka Basins & Rigorous Civil Drainage Advisories...');
  await initializeDatabase();

  // 1. Comprehensive Study Areas covering all Karnataka regions + Global Benchmarks
  const studyAreas = [
    {
      id: 'bengaluru_bellandur',
      name: 'Bengaluru East (Bellandur-Varthur Basin)',
      state_region: 'Karnataka (Eastern Dry Zone)',
      country: 'India',
      description: 'Major urban tech corridor with historical severe monsoonal waterlogging, lake catchment overflow, and road underpass choke points.',
      center_lat: 12.9352,
      center_lng: 77.6850,
      zoom_level: 13,
      bounds_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [77.6400, 12.9050],
            [77.7450, 12.9050],
            [77.7450, 12.9650],
            [77.6400, 12.9650],
            [77.6400, 12.9050]
          ]
        ]
      }
    },
    {
      id: 'shivamogga_tunga_bhadra',
      name: 'Shivamogga - Bhadravathi (Tunga-Bhadra Malnad Catchment)',
      state_region: 'Karnataka (Malnad / Transition Zone)',
      country: 'India',
      description: 'High precipitation Western Ghats foothills basin with extensive arecanut, paddy, and sugarcane valleys subject to riverine backwater stagnation.',
      center_lat: 13.9299,
      center_lng: 75.5681,
      zoom_level: 13,
      bounds_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [75.4800, 13.8500],
            [75.6800, 13.8500],
            [75.6800, 14.0200],
            [75.4800, 14.0200],
            [75.4800, 13.8500]
          ]
        ]
      }
    },
    {
      id: 'mysuru_mandya_cauvery',
      name: 'Mysuru - Mandya (Cauvery Irrigation Command Delta)',
      state_region: 'Karnataka (Southern Dry Zone)',
      country: 'India',
      description: 'Intensively irrigated sugarcane and paddy delta along Cauvery river prone to high water table saturation and canal sluice backflow.',
      center_lat: 12.5218,
      center_lng: 76.8950,
      zoom_level: 12,
      bounds_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [76.8000, 12.4500],
            [77.0000, 12.4500],
            [77.0000, 12.6000],
            [76.8000, 12.6000],
            [76.8000, 12.4500]
          ]
        ]
      }
    },
    {
      id: 'belagavi_krishna_basin',
      name: 'Belagavi - Bagalkot (Krishna & Ghataprabha River Floodplain)',
      state_region: 'Karnataka (Northern Transition & Dry Zone)',
      country: 'India',
      description: 'Deep black vertisol floodplain prone to prolonged riverine inundation and poor gravity percolation during monsoon dam discharge.',
      center_lat: 16.1875,
      center_lng: 75.6950,
      zoom_level: 12,
      bounds_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [75.5500, 16.1000],
            [75.8500, 16.1000],
            [75.8500, 16.3000],
            [75.5500, 16.3000],
            [75.5500, 16.1000]
          ]
        ]
      }
    },
    {
      id: 'mangaluru_netravati_coastal',
      name: 'Mangaluru - Udupi (Netravati Coastal Estuary)',
      state_region: 'Karnataka (Coastal Zone)',
      country: 'India',
      description: 'Heavy monsoonal coastal catchment (>3900mm annual rain) with tidal backwater intrusion and low-gradient estuarine stagnation.',
      center_lat: 12.9141,
      center_lng: 74.8560,
      zoom_level: 13,
      bounds_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [74.8000, 12.8300],
            [74.9300, 12.8300],
            [74.9300, 12.9800],
            [74.8000, 12.9800],
            [74.8000, 12.8300]
          ]
        ]
      }
    },
    {
      id: 'kalaburagi_bhima_basin',
      name: 'Kalaburagi - Raichur (Bhima & Tungabhadra Semi-Arid Basin)',
      state_region: 'Karnataka (North Eastern Dry Zone)',
      country: 'India',
      description: 'Extensive black cotton soil plateau with major pulses and cotton fields prone to sudden depression pooling after heavy cloudbursts.',
      center_lat: 17.3297,
      center_lng: 76.8343,
      zoom_level: 12,
      bounds_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [76.7000, 17.2000],
            [77.0000, 17.2000],
            [77.0000, 17.4500],
            [76.7000, 17.4500],
            [76.7000, 17.2000]
          ]
        ]
      }
    },
    {
      id: 'delhi_ghazipur',
      name: 'Delhi Yamuna Floodplain (Ghazipur Drain Basin)',
      state_region: 'Delhi NCR',
      country: 'India',
      description: 'Dense urban drainage catchment along Ghazipur drain with heavy siltation, low gradient terrain, and frequent stormwater congestion.',
      center_lat: 28.6280,
      center_lng: 77.3250,
      zoom_level: 13,
      bounds_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [77.2800, 28.6000],
            [77.3600, 28.6000],
            [77.3600, 28.6600],
            [77.2800, 28.6600],
            [77.2800, 28.6000]
          ]
        ]
      }
    },
    {
      id: 'patna_gangetic',
      name: 'Patna Gangetic Lowland (Rajendra Nagar & Kankarbagh)',
      state_region: 'Bihar',
      country: 'India',
      description: 'Flat alluvial Gangetic plain prone to severe seasonal backwater stagnation, urban sump saturation, and prolonged waterlogging.',
      center_lat: 25.5941,
      center_lng: 85.1588,
      zoom_level: 13,
      bounds_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [85.1100, 25.5650],
            [85.2000, 25.5650],
            [85.2000, 25.6250],
            [85.1100, 25.6250],
            [85.1100, 25.5650]
          ]
        ]
      }
    }
  ];

  for (const sa of studyAreas) {
    await query(
      `INSERT INTO study_areas (id, name, state_region, country, description, center_lat, center_lng, zoom_level, bounds_geojson)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         state_region = EXCLUDED.state_region,
         description = EXCLUDED.description,
         center_lat = EXCLUDED.center_lat,
         center_lng = EXCLUDED.center_lng,
         bounds_geojson = EXCLUDED.bounds_geojson;`,
      [sa.id, sa.name, sa.state_region, sa.country, sa.description, sa.center_lat, sa.center_lng, sa.zoom_level, JSON.stringify(sa.bounds_geojson)]
    );
  }
  console.log(`[+] Seeded ${studyAreas.length} Study Areas across Karnataka.`);

  // 2. Comprehensive Runs, Zones, and Civil Drainage Advisories for all Karnataka Basins
  const basinDataSets = [
    // --- BENGALURU ---
    {
      studyAreaId: 'bengaluru_bellandur',
      runId: 'run_blr_postmonsoon_2026',
      rainfallMm: 78.5,
      totalAreaKm2: 42.5,
      waterloggedKm2: 9.4,
      waterloggedPct: 22.1,
      severeCount: 3,
      moderateCount: 2,
      lowCount: 2,
      zones: [
        {
          id: 'blr_z1',
          name: 'Ecospace - Outer Ring Road Arterial Culvert',
          severity: 'Severe',
          probability: 0.94,
          elevation_m: 872.4,
          slope_deg: 0.9,
          land_use: 'urban_builtup',
          area_ha: 14.8,
          is_persistent: true,
          ndwi: 0.62,
          mndwi: 0.74,
          ndvi: 0.08,
          vv_db: -21.4,
          vh_db: -28.6,
          polygon: [[77.679, 12.923], [77.692, 12.923], [77.692, 12.932], [77.679, 12.932], [77.679, 12.923]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 96,
            headline: 'Emergency Dewatering Pump Deployment & Culvert Desiltation',
            diagnosis: 'Severe storm runoff pooling detected via Sentinel-1 SAR (-21.4 dB) and MNDWI (0.74). Elevation trough at 872m with only 0.9° slope causes arterial roadway inundation.',
            intervention: 'Mobilize two 150 HP diesel submersible dewatering pumps (650 m³/hr each). Deploy tracked excavator to clear primary cross-culvert under Outer Ring Road to prevent highway waterlogging.',
            equipment: ['150 HP Diesel Pumps (x2)', 'Tracked Excavator', 'High-Pressure Silt Jetter'],
            agency: 'BBMP Stormwater Dept / SDRF',
            timeline: 'Deploy within 4 hours',
            cost: '₹ 4,50,000',
            status: 'Pending Dispatch'
          }
        },
        {
          id: 'blr_z2',
          name: 'Rainbow Drive Layout Inflow Depression',
          severity: 'Severe',
          probability: 0.89,
          elevation_m: 868.1,
          slope_deg: 0.6,
          land_use: 'residential',
          area_ha: 8.5,
          is_persistent: true,
          ndwi: 0.58,
          mndwi: 0.69,
          ndvi: 0.12,
          vv_db: -19.8,
          vh_db: -26.1,
          polygon: [[77.702, 12.911], [77.712, 12.911], [77.712, 12.919], [77.702, 12.919], [77.702, 12.911]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 92,
            headline: 'Breach Relief Swale & Sandbag Flood Barrier Construction',
            diagnosis: 'Basin bowl depression trapping overland stormwater. Gated residential perimeter lacks gravity outfall capacity.',
            intervention: 'Excavate temporary 1.5m relief swale to divert floodwaters towards south retention wetland. Erect 2,000-sandbag flood perimeter along residential fringe.',
            equipment: ['Backhoe Loader (JCB 3DX)', '2,000 Polypropylene Sandbags', 'Submersible Slurry Pump'],
            agency: 'Karnataka State Disaster Management Authority (KSDMA)',
            timeline: 'Deploy within 6 hours',
            cost: '₹ 2,80,000',
            status: 'In Progress'
          }
        },
        {
          id: 'blr_z3',
          name: 'Panathur Railway Underpass Choke',
          severity: 'Severe',
          probability: 0.91,
          elevation_m: 865.0,
          slope_deg: 0.4,
          land_use: 'infrastructure',
          area_ha: 4.2,
          is_persistent: true,
          ndwi: 0.65,
          mndwi: 0.78,
          ndvi: 0.05,
          vv_db: -22.5,
          vh_db: -29.2,
          polygon: [[77.698, 12.939], [77.706, 12.939], [77.706, 12.946], [77.698, 12.946], [77.698, 12.939]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 94,
            headline: 'Underpass High-Head Pump Activation & Sump Desiltation',
            diagnosis: 'Railway underpass invert elevation is lowest point in micro-catchment (865m). Float switch siltation causing pump failure.',
            intervention: 'Flush underpass sump pit with high-pressure suction jetter. Deploy backup mobile 75 HP generator pump and calibrate automated level sensors.',
            equipment: ['Suction Jetting Tanker', '75 HP Portable Pump', 'Emergency Barrier Crew'],
            agency: 'South Western Railways / BBMP Roads',
            timeline: 'Deploy within 4 hours',
            cost: '₹ 1,90,000',
            status: 'Scheduled'
          }
        },
        {
          id: 'blr_z4',
          name: 'Varthur Lake Southern Wetland Buffer',
          severity: 'Moderate',
          probability: 0.54,
          elevation_m: 878.5,
          slope_deg: 1.8,
          land_use: 'agricultural',
          area_ha: 22.0,
          is_persistent: false,
          ndwi: 0.28,
          mndwi: 0.38,
          ndvi: 0.35,
          vv_db: -14.2,
          vh_db: -19.8,
          polygon: [[77.722, 12.928], [77.738, 12.928], [77.738, 12.942], [77.722, 12.942], [77.722, 12.928]],
          advisory: {
            priority: 'Priority 2 (High)',
            urgency_score: 78,
            headline: 'Detention Pond Sluice Gate Adjustment & Weir Desiltation',
            diagnosis: 'Moderate surface moisture and vegetation root-zone saturation. Slope (1.8°) permits natural gravity outflow if weir bottlenecks are opened.',
            intervention: 'Open secondary weir bypass gates by 40% to balance hydraulic head. Clear accumulated aquatic hyacinth obstructing natural outfall stream.',
            equipment: ['Weir Control Winch', 'Weed Harvester Pontoon', 'Debris Skimmer'],
            agency: 'Minor Irrigation Department / Lake Authority',
            timeline: 'Execute within 12 hours',
            cost: '₹ 1,75,000',
            status: 'Scheduled'
          }
        },
        {
          id: 'blr_z5',
          name: 'Kadubeesanahalli Storm Canal',
          severity: 'Moderate',
          probability: 0.48,
          elevation_m: 882.0,
          slope_deg: 1.6,
          land_use: 'commercial',
          area_ha: 11.2,
          is_persistent: false,
          ndwi: 0.22,
          mndwi: 0.31,
          ndvi: 0.28,
          vv_db: -13.6,
          vh_db: -18.5,
          polygon: [[77.684, 12.934], [77.696, 12.934], [77.696, 12.942], [77.684, 12.942], [77.684, 12.934]],
          advisory: {
            priority: 'Priority 2 (High)',
            urgency_score: 71,
            headline: 'Perimeter Bund Trenching & Deep Subsurface Drainage',
            diagnosis: 'Runoff accumulating along building foundations and open parking areas due to blocked perimeter swales.',
            intervention: 'Construct 60cm perforated corrugated sub-surface drains along boundary perimeters with gravel filter media.',
            equipment: ['Trench Digger', 'Perforated PVC 150mm', 'Gravel Filter Media'],
            agency: 'BBMP Stormwater Dept',
            timeline: 'Execute within 24 hours',
            cost: '₹ 1,20,000',
            status: 'In Progress'
          }
        }
      ]
    },

    // --- SHIVAMOGGA ---
    {
      studyAreaId: 'shivamogga_tunga_bhadra',
      runId: 'run_shv_monsoon_2026',
      rainfallMm: 115.0,
      totalAreaKm2: 55.0,
      waterloggedKm2: 12.8,
      waterloggedPct: 23.3,
      severeCount: 2,
      moderateCount: 2,
      lowCount: 1,
      zones: [
        {
          id: 'shv_z1',
          name: 'Tunga River Confluence Agricultural Lowland',
          severity: 'Severe',
          probability: 0.97,
          elevation_m: 574.0,
          slope_deg: 0.5,
          land_use: 'agricultural',
          area_ha: 21.0,
          is_persistent: true,
          ndwi: 0.68,
          mndwi: 0.81,
          ndvi: 0.15,
          vv_db: -23.1,
          vh_db: -30.4,
          polygon: [[75.545, 13.910], [75.565, 13.910], [75.565, 13.928], [75.545, 13.928], [75.545, 13.910]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 97,
            headline: 'Emergency River Embankment Relief & Dewatering Pump Mobilization',
            diagnosis: 'Riverine backflow from Tunga River cresting over low-gradient agricultural bunds. Arecanut and paddy root-zone submerged under 50cm stagnant water.',
            intervention: 'Deploy two 150 HP diesel tractor-mounted high-head dewatering pumps. Clear drainage outfall gates along the river revetment to restore gravity discharge.',
            equipment: ['150 HP Mobile Pumps (x2)', 'Tracked Excavator', 'Tractor PTO Pumps'],
            agency: 'Water Resources Dept (WRD) / Agriculture Wing',
            timeline: 'Deploy within 4 hours',
            cost: '₹ 3,90,000',
            status: 'Pending Dispatch'
          }
        },
        {
          id: 'shv_z2',
          name: 'Bhadravathi Industrial Corridor Depression',
          severity: 'Severe',
          probability: 0.92,
          elevation_m: 568.5,
          slope_deg: 0.7,
          land_use: 'residential',
          area_ha: 14.5,
          is_persistent: true,
          ndwi: 0.61,
          mndwi: 0.72,
          ndvi: 0.10,
          vv_db: -21.0,
          vh_db: -27.8,
          polygon: [[75.580, 13.880], [75.600, 13.880], [75.600, 13.895], [75.580, 13.895], [75.580, 13.880]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 93,
            headline: 'Industrial Storm Canal Relief & Sandbag Levee Reinforcement',
            diagnosis: 'Sediment choking industrial stormwater bypass culvert. Heavy stagnation threatening local settlement and storage yards.',
            intervention: 'Excavate 2.0m relief bypass trench to divert excess runoff into northern detention buffer. Place 1,500 sandbags along settlement border.',
            equipment: ['JCB Excavator', '1,500 Sandbags', 'Slurry Trash Pump'],
            agency: 'City Municipal Council Bhadravathi / KSDMA',
            timeline: 'Deploy within 6 hours',
            cost: '₹ 2,60,000',
            status: 'In Progress'
          }
        },
        {
          id: 'shv_z3',
          name: 'Ghadikoppa Outfall Canal & Wetland Swale',
          severity: 'Moderate',
          probability: 0.58,
          elevation_m: 582.0,
          slope_deg: 1.9,
          land_use: 'agricultural',
          area_ha: 18.0,
          is_persistent: false,
          ndwi: 0.32,
          mndwi: 0.41,
          ndvi: 0.42,
          vv_db: -15.1,
          vh_db: -20.2,
          polygon: [[75.550, 13.940], [75.570, 13.940], [75.570, 13.955], [75.550, 13.955], [75.550, 13.940]],
          advisory: {
            priority: 'Priority 2 (High)',
            urgency_score: 75,
            headline: 'Deep Agricultural Interceptor Ditch Aeration & Desilting',
            diagnosis: 'Moderate saturation in vertisol-laterite transitional soil. Crop root anoxia imminent if not aerated within 24 hours.',
            intervention: 'Excavate 80cm deep interceptor perimeter ditches to dewater root zone of tomato and finger millet patches. Clear silt build-up from field culverts.',
            equipment: ['Mini Excavator', 'Ditch Trencher', 'Drainage Gravel'],
            agency: 'Karnataka Dept of Agriculture (Watershed Wing)',
            timeline: 'Execute within 18 hours',
            cost: '₹ 1,45,000',
            status: 'Scheduled'
          }
        },
        {
          id: 'shv_z4',
          name: 'Shivamogga East Railway Bypass Sump',
          severity: 'Moderate',
          probability: 0.46,
          elevation_m: 586.5,
          slope_deg: 2.1,
          land_use: 'infrastructure',
          area_ha: 8.0,
          is_persistent: false,
          ndwi: 0.24,
          mndwi: 0.32,
          ndvi: 0.26,
          vv_db: -13.8,
          vh_db: -18.9,
          polygon: [[75.575, 13.920], [75.590, 13.920], [75.590, 13.932], [75.575, 13.932], [75.575, 13.920]],
          advisory: {
            priority: 'Priority 3 (Routine)',
            urgency_score: 52,
            headline: 'Gravity Drainage Swale Clearing & Trash Rack Jetting',
            diagnosis: 'Trash racks clogged with urban plastic debris, creating partial backwater pooling during rain peaks.',
            intervention: 'Clear inlet trash screens manually and flush roadside culverts with municipal jetting unit. Regrade gravel discharge swales.',
            equipment: ['Municipal Jetting Truck', 'Screen Rakes', 'Inspection Crew'],
            agency: 'Shivamogga City Corporation / PWD',
            timeline: 'Routine (Within 48 hours)',
            cost: '₹ 45,000',
            status: 'Completed'
          }
        }
      ]
    },

    // --- MYSURU - MANDYA ---
    {
      studyAreaId: 'mysuru_mandya_cauvery',
      runId: 'run_mys_monsoon_2026',
      rainfallMm: 68.0,
      totalAreaKm2: 62.0,
      waterloggedKm2: 14.2,
      waterloggedPct: 22.9,
      severeCount: 2,
      moderateCount: 2,
      lowCount: 1,
      zones: [
        {
          id: 'mys_z1',
          name: 'KRS Dam Canal Tail-End Inflow Depression',
          severity: 'Severe',
          probability: 0.95,
          elevation_m: 685.0,
          slope_deg: 0.6,
          land_use: 'agricultural',
          area_ha: 26.0,
          is_persistent: true,
          ndwi: 0.64,
          mndwi: 0.76,
          ndvi: 0.18,
          vv_db: -22.4,
          vh_db: -29.1,
          polygon: [[76.840, 12.490], [76.870, 12.490], [76.870, 12.510], [76.840, 12.510], [76.840, 12.490]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 95,
            headline: 'Canal Head Sluice Regulation & Emergency Flood Pumping',
            diagnosis: 'Excess canal discharge combined with storm precipitation causing severe waterlogging across 26 hectares of sugarcane delta.',
            intervention: 'Throttle upstream canal sluice gate by 60%. Mobilize three mobile diesel pumps to transfer excess floodwater into Cauvery mainstem.',
            equipment: ['Canal Sluice Winch', '120 HP Diesel Pumps (x3)', 'Excavator'],
            agency: 'Cauvery Neeravari Nigam Limited (CNNL)',
            timeline: 'Deploy within 4 hours',
            cost: '₹ 3,80,000',
            status: 'Pending Dispatch'
          }
        },
        {
          id: 'mys_z2',
          name: 'Pandavapura Sugarcane Basin Sump',
          severity: 'Severe',
          probability: 0.88,
          elevation_m: 678.0,
          slope_deg: 0.8,
          land_use: 'agricultural',
          area_ha: 19.5,
          is_persistent: true,
          ndwi: 0.59,
          mndwi: 0.70,
          ndvi: 0.22,
          vv_db: -20.2,
          vh_db: -26.8,
          polygon: [[76.880, 12.520], [76.910, 12.520], [76.910, 12.540], [76.880, 12.540], [76.880, 12.520]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 90,
            headline: 'Deep Subsurface Tile Drainage & Tail-Water Swale Excavation',
            diagnosis: 'Persistent high water table causing root anoxia in young ratoon cane crops. Soil permeability low in clay loam layer.',
            intervention: 'Excavate 1.2m deep collector trenches and install perforated PVC pipes. Open tail-water drainage outlet into southern stream.',
            equipment: ['Trench Digger', 'Perforated PVC 200mm Pipes', 'Gravel Filter'],
            agency: 'Command Area Development Authority (CADA) Cauvery',
            timeline: 'Deploy within 8 hours',
            cost: '₹ 2,40,000',
            status: 'In Progress'
          }
        },
        {
          id: 'mys_z3',
          name: 'Srirangapatna Island Fringe Buffer',
          severity: 'Moderate',
          probability: 0.58,
          elevation_m: 692.0,
          slope_deg: 1.8,
          land_use: 'residential',
          area_ha: 15.0,
          is_persistent: false,
          ndwi: 0.31,
          mndwi: 0.39,
          ndvi: 0.38,
          vv_db: -14.8,
          vh_db: -19.9,
          polygon: [[76.860, 12.440], [76.880, 12.440], [76.880, 12.460], [76.860, 12.460], [76.860, 12.440]],
          advisory: {
            priority: 'Priority 2 (High)',
            urgency_score: 76,
            headline: 'Storm Drain Desiltation & Retention Weir Calibration',
            diagnosis: 'Moderate water pooling along residential heritage corridor due to river weir backwater during rainfall spikes.',
            intervention: 'Mechanically desilt roadside storm channels. Check non-return flap valves on river outfall culverts.',
            equipment: ['Silt Removal Excavator', 'Jetting Machine', 'Flap Gate Technicians'],
            agency: 'Town Municipal Council Srirangapatna',
            timeline: 'Execute within 16 hours',
            cost: '₹ 1,30,000',
            status: 'Scheduled'
          }
        }
      ]
    },

    // --- BELAGAVI - BAGALKOT ---
    {
      studyAreaId: 'belagavi_krishna_basin',
      runId: 'run_bel_monsoon_2026',
      rainfallMm: 145.0,
      totalAreaKm2: 78.0,
      waterloggedKm2: 21.5,
      waterloggedPct: 27.6,
      severeCount: 2,
      moderateCount: 2,
      lowCount: 1,
      zones: [
        {
          id: 'bel_z1',
          name: 'Ghataprabha River Embankment Floodplain',
          severity: 'Severe',
          probability: 0.97,
          elevation_m: 542.0,
          slope_deg: 0.4,
          land_use: 'agricultural',
          area_ha: 35.0,
          is_persistent: true,
          ndwi: 0.72,
          mndwi: 0.84,
          ndvi: 0.11,
          vv_db: -24.5,
          vh_db: -31.8,
          polygon: [[75.640, 16.180], [75.680, 16.180], [75.680, 16.210], [75.640, 16.210], [75.640, 16.180]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 98,
            headline: 'Emergency Levee Reinforcement & High-Volume Dewatering Dispatch',
            diagnosis: 'Deep black vertisol plain inundated under 60cm water due to dam overflow discharge. Infiltration zero due to saturated montmorillonite clay.',
            intervention: 'Erect 3,000-sandbag flood levee along village boundary. Deploy four 200 HP heavy axial pumps to evacuate floodwaters back into river channel.',
            equipment: ['200 HP Axial Pumps (x4)', 'Tracked Long-Boom Excavator', '3,000 Sandbags'],
            agency: 'Krishna Bhagya Jala Nigam Limited (KBJNL) / SDRF',
            timeline: 'Deploy within 3 hours',
            cost: '₹ 5,80,000',
            status: 'Pending Dispatch'
          }
        },
        {
          id: 'bel_z2',
          name: 'Chikkodi Vertisol Agricultural Trough',
          severity: 'Severe',
          probability: 0.91,
          elevation_m: 538.0,
          slope_deg: 0.6,
          land_use: 'agricultural',
          area_ha: 24.0,
          is_persistent: true,
          ndwi: 0.63,
          mndwi: 0.74,
          ndvi: 0.16,
          vv_db: -21.8,
          vh_db: -28.4,
          polygon: [[75.680, 16.210], [75.720, 16.210], [75.720, 16.235], [75.680, 16.235], [75.680, 16.210]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 91,
            headline: 'Perimeter Relief Bund Trenching & Slurry Dewatering',
            diagnosis: 'Extensive pooling over cotton and soybean acreage. Vertisol swelling prevents natural drainage.',
            intervention: 'Excavate 1.5m broad relief ditches and mobilize tractor PTO-driven slurry pumps to drain stagnant surface water.',
            equipment: ['Tractor PTO Pumps (x3)', 'Hydraulic Trencher', 'Drainage Crew'],
            agency: 'Dept of Agriculture (Watershed Development Wing)',
            timeline: 'Deploy within 6 hours',
            cost: '₹ 2,90,000',
            status: 'In Progress'
          }
        },
        {
          id: 'bel_z3',
          name: 'Bagalkot Town Detention Basin Buffer',
          severity: 'Moderate',
          probability: 0.65,
          elevation_m: 549.0,
          slope_deg: 1.5,
          land_use: 'residential',
          area_ha: 18.0,
          is_persistent: false,
          ndwi: 0.35,
          mndwi: 0.44,
          ndvi: 0.32,
          vv_db: -15.5,
          vh_db: -21.0,
          polygon: [[75.620, 16.160], [75.650, 16.160], [75.650, 16.180], [75.620, 16.180], [75.620, 16.160]],
          advisory: {
            priority: 'Priority 2 (High)',
            urgency_score: 79,
            headline: 'Stormwater Sluice Calibration & Outfall Canal Desiltation',
            diagnosis: 'Sediment build-up in municipal outfall canal causing stormwater back-up into low-lying suburban wards.',
            intervention: 'Dredge 500m of outfall canal with tracked excavator. Adjust gravity sluice gates.',
            equipment: ['Tracked Excavator', 'Silt Dump Trucks', 'Gate Mechanics'],
            agency: 'Bagalkot City Municipal Council / PWD',
            timeline: 'Execute within 18 hours',
            cost: '₹ 1,85,000',
            status: 'Scheduled'
          }
        }
      ]
    },

    // --- MANGALURU - UDUPI ---
    {
      studyAreaId: 'mangaluru_netravati_coastal',
      runId: 'run_mng_monsoon_2026',
      rainfallMm: 185.0,
      totalAreaKm2: 48.0,
      waterloggedKm2: 15.6,
      waterloggedPct: 32.5,
      severeCount: 2,
      moderateCount: 2,
      lowCount: 1,
      zones: [
        {
          id: 'mng_z1',
          name: 'Netravati Estuarine Tidal Lowland',
          severity: 'Severe',
          probability: 0.98,
          elevation_m: 4.5,
          slope_deg: 0.3,
          land_use: 'agricultural',
          area_ha: 28.0,
          is_persistent: true,
          ndwi: 0.75,
          mndwi: 0.88,
          ndvi: 0.08,
          vv_db: -25.2,
          vh_db: -32.6,
          polygon: [[74.830, 12.850], [74.860, 12.850], [74.860, 12.880], [74.830, 12.880], [74.830, 12.850]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 98,
            headline: 'Tidal Sluice Flap Valve Calibration & High-Capacity Dewatering',
            diagnosis: 'High tide seawater backflow combined with 185mm monsoon deluge causing estuarine flooding across 28 hectares of coastal paddy and coconut groves.',
            intervention: 'Inspect and seal non-return tidal flap gates. Mobilize two 180 HP marine submersible dewatering pumps to pump water over the coastal bund.',
            equipment: ['180 HP Marine Dewatering Pumps (x2)', 'Flap Gate Inspection Divers', 'Mobile Generator Truck'],
            agency: 'Minor Irrigation & Coastal Engineering Dept / KSDMA',
            timeline: 'Deploy within 3 hours',
            cost: '₹ 5,20,000',
            status: 'Pending Dispatch'
          }
        },
        {
          id: 'mng_z2',
          name: 'Baikampady Industrial Lowland Corridor',
          severity: 'Severe',
          probability: 0.93,
          elevation_m: 6.2,
          slope_deg: 0.5,
          land_use: 'industrial',
          area_ha: 16.5,
          is_persistent: true,
          ndwi: 0.66,
          mndwi: 0.77,
          ndvi: 0.05,
          vv_db: -22.1,
          vh_db: -29.0,
          polygon: [[74.820, 12.920], [74.845, 12.920], [74.845, 12.945], [74.820, 12.945], [74.820, 12.920]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 93,
            headline: 'Industrial Outfall Drainage Dredging & Sump Jetting',
            diagnosis: 'Silt and debris choking outfall into Gurupura river. Industrial access roads and sub-stations under 45cm water.',
            intervention: 'Deploy amphibious excavator to dredge 800m of industrial outfall ditch. Flush stormwater culverts with high-pressure water jet.',
            equipment: ['Amphibious Dredger', 'Super Sucker Jetting Truck', '100 HP Pump'],
            agency: 'Mangaluru City Corporation / KIADB',
            timeline: 'Deploy within 5 hours',
            cost: '₹ 3,40,000',
            status: 'In Progress'
          }
        }
      ]
    },

    // --- KALABURAGI - RAICHUR ---
    {
      studyAreaId: 'kalaburagi_bhima_basin',
      runId: 'run_klb_monsoon_2026',
      rainfallMm: 85.0,
      totalAreaKm2: 65.0,
      waterloggedKm2: 13.0,
      waterloggedPct: 20.0,
      severeCount: 2,
      moderateCount: 2,
      lowCount: 1,
      zones: [
        {
          id: 'klb_z1',
          name: 'Bhima River Floodplain Trough',
          severity: 'Severe',
          probability: 0.94,
          elevation_m: 432.0,
          slope_deg: 0.5,
          land_use: 'agricultural',
          area_ha: 29.0,
          is_persistent: true,
          ndwi: 0.65,
          mndwi: 0.78,
          ndvi: 0.14,
          vv_db: -22.8,
          vh_db: -29.8,
          polygon: [[76.780, 17.260], [76.820, 17.260], [76.820, 17.290], [76.780, 17.290], [76.780, 17.260]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 95,
            headline: 'Emergency Vertisol Drainage Swale Excavation & Tractor Dewatering',
            diagnosis: 'Deep black vertisols expanding and sealing percolation. Water stagnant over major red gram (tur dal) seed production plots.',
            intervention: 'Excavate 1.2m broad diversion drains to connect into Bhima tributary. Mobilize tractor-mounted PTO pumps to remove stagnant water.',
            equipment: ['Tractor PTO Pumps (x3)', 'Hydraulic Backhoe', 'Trenching Crew'],
            agency: 'Krishna Bhagya Jala Nigam (KBJNL) / Agriculture Wing',
            timeline: 'Deploy within 4 hours',
            cost: '₹ 3,10,000',
            status: 'Pending Dispatch'
          }
        },
        {
          id: 'klb_z2',
          name: 'Sedam Road Lowland Depression',
          severity: 'Severe',
          probability: 0.89,
          elevation_m: 440.0,
          slope_deg: 0.7,
          land_use: 'residential',
          area_ha: 12.0,
          is_persistent: true,
          ndwi: 0.58,
          mndwi: 0.68,
          ndvi: 0.12,
          vv_db: -20.1,
          vh_db: -26.5,
          polygon: [[76.830, 17.310], [76.860, 17.310], [76.860, 17.330], [76.830, 17.330], [76.830, 17.310]],
          advisory: {
            priority: 'Priority 1 (Critical)',
            urgency_score: 90,
            headline: 'Highway Underpass Drainage Pumping & Culvert Clearing',
            diagnosis: 'Stormwater pooling in low highway trough, cutting off vehicle transit and inundating roadside residences.',
            intervention: 'Deploy 100 HP mobile pump. Clear limestone dust and gravel choking the downstream culvert.',
            equipment: ['100 HP Mobile Pump', 'Suction Tanker', 'PWD Road Crew'],
            agency: 'Kalaburagi City Corporation / National Highways',
            timeline: 'Deploy within 6 hours',
            cost: '₹ 1,75,000',
            status: 'In Progress'
          }
        }
      ]
    }
  ];

  // Insert all runs, zones, and advisories
  for (const b of basinDataSets) {
    await query(
      `INSERT INTO analysis_runs (id, study_area_id, model_type, pre_event_date, post_event_date, rainfall_mm, total_area_km2, waterlogged_area_km2, waterlogged_percentage, severe_count, moderate_count, low_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         rainfall_mm = EXCLUDED.rainfall_mm,
         total_area_km2 = EXCLUDED.total_area_km2,
         waterlogged_area_km2 = EXCLUDED.waterlogged_area_km2,
         waterlogged_percentage = EXCLUDED.waterlogged_percentage,
         severe_count = EXCLUDED.severe_count,
         moderate_count = EXCLUDED.moderate_count,
         low_count = EXCLUDED.low_count;`,
      [b.runId, b.studyAreaId, 'random_forest', '2026-06-10', '2026-08-25', b.rainfallMm, b.totalAreaKm2, b.waterloggedKm2, b.waterloggedPct, b.severeCount, b.moderateCount, b.lowCount]
    );

    for (const z of b.zones) {
      const geojsonFeature = {
        type: 'Feature',
        properties: {
          id: z.id,
          name: z.name,
          severity: z.severity,
          probability: z.probability,
          elevation_m: z.elevation_m,
          slope_deg: z.slope_deg,
          land_use: z.land_use,
          area_ha: z.area_ha,
          is_persistent: z.is_persistent
        },
        geometry: {
          type: 'Polygon',
          coordinates: [z.polygon]
        }
      };

      await query(
        `INSERT INTO severity_zones (id, analysis_run_id, zone_name, severity, probability, elevation_m, slope_deg, land_use, area_ha, is_persistent, ndwi, mndwi, ndvi, vv_db, vh_db, geojson_feature)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO UPDATE SET
           severity = EXCLUDED.severity,
           probability = EXCLUDED.probability,
           elevation_m = EXCLUDED.elevation_m,
           slope_deg = EXCLUDED.slope_deg,
           area_ha = EXCLUDED.area_ha,
           geojson_feature = EXCLUDED.geojson_feature;`,
        [z.id, b.runId, z.name, z.severity, z.probability, z.elevation_m, z.slope_deg, z.land_use, z.area_ha, z.is_persistent, z.ndwi, z.mndwi, z.ndvi, z.vv_db, z.vh_db, JSON.stringify(geojsonFeature)]
      );

      // Seed Drainage Advisories
      if (z.advisory) {
        const advId = `adv_${z.id}`;
        const adv = z.advisory;
        const volumeM3 = Math.round(z.area_ha * 10000 * (z.severity === 'Severe' ? 0.40 : 0.20));

        await query(
          `INSERT INTO drainage_advisories (id, analysis_run_id, zone_id, zone_name, priority, urgency_score, title, diagnosis, action_recommendation, estimated_volume_m3, mitigation_actions)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             priority = EXCLUDED.priority,
             urgency_score = EXCLUDED.urgency_score,
             title = EXCLUDED.title,
             diagnosis = EXCLUDED.diagnosis,
             action_recommendation = EXCLUDED.action_recommendation,
             estimated_volume_m3 = EXCLUDED.estimated_volume_m3,
             mitigation_actions = EXCLUDED.mitigation_actions;`,
          [
            advId,
            b.runId,
            z.id,
            z.name,
            adv.priority,
            adv.urgency_score,
            adv.headline,
            adv.diagnosis,
            adv.intervention,
            volumeM3,
            JSON.stringify({
              equipment_required: adv.equipment,
              agency: adv.agency,
              timeline: adv.timeline,
              estimated_cost_inr: adv.cost,
              status: adv.status
            })
          ]
        );
      }
    }
  }

  // 3. Seed Model Evaluations from artifacts
  const metricsJsonPath = path.join(__dirname, '../../../ml_service/artifacts/evaluation_metrics.json');
  if (fs.existsSync(metricsJsonPath)) {
    const rawMetrics = JSON.parse(fs.readFileSync(metricsJsonPath, 'utf8'));
    const rf = rawMetrics.primary_model_rf;
    await query(
      `INSERT INTO model_evaluations (id, model_name, accuracy, precision_val, recall_val, f1_score, roc_auc, metrics_payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         accuracy = EXCLUDED.accuracy,
         f1_score = EXCLUDED.f1_score,
         roc_auc = EXCLUDED.roc_auc,
         metrics_payload = EXCLUDED.metrics_payload;`,
      ['eval_rf_sen1floods', rf.model_name, rf.accuracy, rf.precision, rf.recall, rf.f1_score, rf.roc_auc, JSON.stringify(rawMetrics)]
    );
  }

  console.log('[+] Database Seeding Complete with All 6 Karnataka Agro-Climatic Regions & Real Drainage Action Protocols!');
}

if (process.argv[1] && process.argv[1].includes('seed.ts')) {
  seedDatabase().then(() => pool.end());
}
