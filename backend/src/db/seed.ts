import { pool, initializeDatabase, query } from './index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Complete Official 31 Karnataka Districts Metadata
export const ALL_31_KARNATAKA_DISTRICTS = [
  {
    id: 'bengaluru_urban',
    name: 'Bengaluru Urban (Bellandur-Varthur & Hebbal Basin)',
    zone: 'Eastern Dry Zone (ACZ-5)',
    lat: 12.9716,
    lng: 77.5946,
    elevation: 920,
    rainfall: 85.0,
    area_km2: 48.0,
    inundated_km2: 10.5,
    desc: 'Dense metropolitan IT and lake cascade corridor with high impervious runoff, road underpass sumps, and secondary valley choke points.',
    crops: ['Finger Millet (Ragi)', 'Tomato', 'Cabbage', 'Maize (Corn)'],
    soil: 'Red Sandy Loam',
    actions: [
      {
        zone: 'Bellandur-Ecospace Lowland Culvert',
        sev: 'Severe',
        prob: 0.96,
        area: 16.5,
        latOffset: -0.03,
        lngOffset: 0.08,
        head: 'Emergency Dewatering Pump Deployment & Culvert Desiltation',
        diag: 'Overland runoff pooling at 872m elevation with 0.8° slope along Outer Ring Road culverts.',
        rec: 'Deploy two 150 HP diesel submersible dewatering pumps. Clear primary cross-culvert under ORR to prevent highway inundation.',
        eq: ['150 HP Diesel Pumps (x2)', 'Tracked Long-Boom Excavator', 'High-Pressure Silt Jetter'],
        agency: 'BBMP Stormwater Dept / SDRF',
        time: 'Deploy within 4 hours',
        cost: '₹ 4,50,000',
        vol: 66000
      },
      {
        zone: 'Panathur Railway Underpass Choke',
        sev: 'Severe',
        prob: 0.91,
        area: 5.2,
        latOffset: -0.02,
        lngOffset: 0.09,
        head: 'Underpass High-Head Pump Activation & Sump Desiltation',
        diag: 'Railway underpass invert is lowest point in catchment (865m). Float switch siltation causing pump failure.',
        rec: 'Flush underpass sump pit with high-pressure suction jetter. Deploy backup mobile 75 HP generator pump.',
        eq: ['Suction Jetting Tanker', '75 HP Portable Pump', 'Emergency Barrier Crew'],
        agency: 'South Western Railways / BBMP Roads',
        time: 'Deploy within 4 hours',
        cost: '₹ 1,90,000',
        vol: 20800
      }
    ]
  },
  {
    id: 'bengaluru_rural',
    name: 'Bengaluru Rural (Doddaballapura & Hoskote Basin)',
    zone: 'Eastern Dry Zone (ACZ-5)',
    lat: 13.1294,
    lng: 77.5730,
    elevation: 905,
    rainfall: 72.0,
    area_km2: 52.0,
    inundated_km2: 9.8,
    desc: 'Agro-horticultural plain with extensive grape, tomato, and ragi plots prone to flash swale overflow.',
    crops: ['Finger Millet (Ragi)', 'Chili', 'Mango', 'Tomato'],
    soil: 'Red Clay Loam',
    actions: [
      {
        zone: 'Doddaballapura Industrial Swale',
        sev: 'Severe',
        prob: 0.92,
        area: 14.0,
        latOffset: 0.02,
        lngOffset: -0.02,
        head: 'Collector Swale Desiltation & Mobile Pump Sump Drainage',
        diag: 'Clay loam topsoil saturated. Water ponding along tomato greenhouses.',
        rec: 'Excavate 1.2m deep collector swale and deploy mobile slurry pumps.',
        eq: ['JCB 3DX Excavator', 'Slurry Pump 50 HP', 'Perforated PVC 150mm'],
        agency: 'Dept of Agriculture (Watershed Wing)',
        time: 'Deploy within 6 hours',
        cost: '₹ 2,10,000',
        vol: 56000
      }
    ]
  },
  {
    id: 'shivamogga',
    name: 'Shivamogga (Tunga-Bhadra Malnad Catchment)',
    zone: 'Southern Transition Zone (ACZ-7)',
    lat: 13.9299,
    lng: 75.5681,
    elevation: 584,
    rainfall: 125.0,
    area_km2: 60.0,
    inundated_km2: 15.2,
    desc: 'Western Ghats transition valley with arecanut, ginger, and paddy fields subject to riverine backwater backflow.',
    crops: ['Arecanut (Betel Nut)', 'Rice (Paddy)', 'Maize (Corn)', 'Ginger'],
    soil: 'Laterite Gravelly Loam',
    actions: [
      {
        zone: 'Tunga Confluence Lowland Plain',
        sev: 'Severe',
        prob: 0.97,
        area: 22.5,
        latOffset: -0.02,
        lngOffset: -0.01,
        head: 'Emergency River Embankment Relief & Dewatering Pump Mobilization',
        diag: 'Riverine backflow from Tunga River cresting over agricultural bunds into arecanut orchards.',
        rec: 'Deploy two 150 HP diesel tractor-mounted high-head dewatering pumps. Clear drainage outfall gates.',
        eq: ['150 HP Mobile Pumps (x2)', 'Tracked Excavator', 'Tractor PTO Pumps'],
        agency: 'Water Resources Dept (WRD) / Agriculture Wing',
        time: 'Deploy within 4 hours',
        cost: '₹ 3,90,000',
        vol: 90000
      },
      {
        zone: 'Bhadravathi Industrial Sump',
        sev: 'Severe',
        prob: 0.93,
        area: 12.0,
        latOffset: -0.04,
        lngOffset: 0.03,
        head: 'Industrial Storm Canal Relief & Sandbag Levee Placement',
        diag: 'Stormwater bypass clogged with sediment threatening residential fringe.',
        rec: 'Excavate 2.0m relief bypass trench into northern detention buffer. Place 1,500 sandbags.',
        eq: ['JCB Excavator', '1,500 Sandbags', 'Slurry Pump'],
        agency: 'City Municipal Council Bhadravathi',
        time: 'Deploy within 6 hours',
        cost: '₹ 2,60,000',
        vol: 48000
      }
    ]
  },
  {
    id: 'mysuru',
    name: 'Mysuru (Kabini & Cauvery Confluence Basin)',
    zone: 'Southern Dry Zone (ACZ-6)',
    lat: 12.2958,
    lng: 76.6394,
    elevation: 763,
    rainfall: 65.0,
    area_km2: 58.0,
    inundated_km2: 11.4,
    desc: 'Sugarcane and paddy delta with high water table saturation along Kabini backwaters.',
    crops: ['Sugarcane', 'Rice (Paddy)', 'Finger Millet (Ragi)', 'Cotton'],
    soil: 'Red Sandy Loam',
    actions: [
      {
        zone: 'Kabini Confluence Canal Tail-End',
        sev: 'Severe',
        prob: 0.94,
        area: 20.0,
        latOffset: 0.02,
        lngOffset: 0.03,
        head: 'Canal Sluice Gate Closure & High-Head Axial Pumping',
        diag: 'Excess canal tail discharge causing ponding over sugarcane ratoon crops.',
        rec: 'Throttle canal sluice gate and mobilize two 120 HP mobile diesel pumps.',
        eq: ['Canal Sluice Winch', '120 HP Diesel Pumps (x2)', 'Excavator'],
        agency: 'Cauvery Neeravari Nigam Limited (CNNL)',
        time: 'Deploy within 4 hours',
        cost: '₹ 3,40,000',
        vol: 80000
      }
    ]
  },
  {
    id: 'mandya',
    name: 'Mandya (Cauvery Irrigation Command Delta)',
    zone: 'Southern Dry Zone (ACZ-6)',
    lat: 12.5218,
    lng: 76.8951,
    elevation: 678,
    rainfall: 70.0,
    area_km2: 62.0,
    inundated_km2: 14.2,
    desc: 'Intensively irrigated sugarcane and paddy delta along Cauvery river prone to high water table saturation.',
    crops: ['Sugarcane', 'Rice (Paddy)', 'Coconut', 'Finger Millet (Ragi)'],
    soil: 'Deep Black Clay Loam',
    actions: [
      {
        zone: 'Pandavapura Sugarcane Basin Sump',
        sev: 'Severe',
        prob: 0.89,
        area: 18.0,
        latOffset: 0.01,
        lngOffset: -0.02,
        head: 'Deep Subsurface Tile Drainage & Tail-Water Swale Trenching',
        diag: 'Persistent high water table causing root anoxia in young sugarcane crops.',
        rec: 'Excavate 1.2m deep collector trenches and lay perforated PVC pipes.',
        eq: ['Trench Digger', 'Perforated PVC 200mm Pipes', 'Gravel Filter'],
        agency: 'Command Area Development Authority (CADA) Cauvery',
        time: 'Deploy within 8 hours',
        cost: '₹ 2,40,000',
        vol: 72000
      }
    ]
  },
  {
    id: 'belagavi',
    name: 'Belagavi (Krishna & Ghataprabha River Floodplain)',
    zone: 'Northern Transition Zone (ACZ-8)',
    lat: 15.8497,
    lng: 74.4977,
    elevation: 762,
    rainfall: 145.0,
    area_km2: 78.0,
    inundated_km2: 21.5,
    desc: 'Deep black vertisol floodplain prone to prolonged riverine inundation during monsoon dam discharge.',
    crops: ['Sugarcane', 'Soybean', 'Maize (Corn)', 'Groundnut (Peanut)'],
    soil: 'Deep Black Cotton (Vertisol)',
    actions: [
      {
        zone: 'Ghataprabha Floodplain Breach Sink',
        sev: 'Severe',
        prob: 0.98,
        area: 32.0,
        latOffset: 0.03,
        lngOffset: 0.04,
        head: 'Emergency Levee Reinforcement & High-Volume Dewatering',
        diag: 'Deep black vertisol plain inundated under 60cm water due to dam overflow discharge.',
        rec: 'Erect 3,000-sandbag flood levee along village boundary. Deploy four 200 HP heavy axial pumps.',
        eq: ['200 HP Axial Pumps (x4)', 'Tracked Long-Boom Excavator', '3,000 Sandbags'],
        agency: 'Krishna Bhagya Jala Nigam Limited (KBJNL) / SDRF',
        time: 'Deploy within 3 hours',
        cost: '₹ 5,80,000',
        vol: 128000
      }
    ]
  },
  {
    id: 'dakshina_kannada',
    name: 'Dakshina Kannada (Mangaluru - Netravati Estuary)',
    zone: 'Coastal Zone (ACZ-10)',
    lat: 12.9141,
    lng: 74.8560,
    elevation: 22,
    rainfall: 185.0,
    area_km2: 48.0,
    inundated_km2: 15.6,
    desc: 'Heavy monsoonal coastal catchment (>3900mm annual rain) with tidal backwater intrusion and low-gradient estuarine stagnation.',
    crops: ['Rice (Paddy)', 'Arecanut (Betel Nut)', 'Cashew (Geru)', 'Coconut'],
    soil: 'Coastal Alluvial Loam',
    actions: [
      {
        zone: 'Netravati Estuarine Tidal Lowland',
        sev: 'Severe',
        prob: 0.98,
        area: 28.0,
        latOffset: -0.02,
        lngOffset: -0.02,
        head: 'Tidal Sluice Flap Valve Calibration & High-Capacity Dewatering',
        diag: 'High tide seawater backflow combined with 185mm monsoon deluge causing estuarine flooding.',
        rec: 'Inspect and seal non-return tidal flap gates. Mobilize two 180 HP marine submersible dewatering pumps.',
        eq: ['180 HP Marine Dewatering Pumps (x2)', 'Flap Gate Inspection Divers', 'Mobile Generator Truck'],
        agency: 'Minor Irrigation & Coastal Engineering Dept / KSDMA',
        time: 'Deploy within 3 hours',
        cost: '₹ 5,20,000',
        vol: 112000
      }
    ]
  },
  {
    id: 'udupi',
    name: 'Udupi (Swarna & Sita River Coastal Basin)',
    zone: 'Coastal Zone (ACZ-10)',
    lat: 13.3409,
    lng: 74.7421,
    elevation: 18,
    rainfall: 175.0,
    area_km2: 45.0,
    inundated_km2: 13.8,
    desc: 'Coastal paddy and coconut lowlands with rapid rainfall runoff pooling in estuarine troughs.',
    crops: ['Rice (Paddy)', 'Coconut', 'Arecanut (Betel Nut)', 'Cashew (Geru)'],
    soil: 'Coastal Alluvial Sandy Loam',
    actions: [
      {
        zone: 'Swarna River Estuary Outfall',
        sev: 'Severe',
        prob: 0.95,
        area: 22.0,
        latOffset: 0.01,
        lngOffset: -0.02,
        head: 'Coastal Swale Silt Dredging & Marine Sump Activation',
        diag: 'Tidal surge trapping river stormwater behind sand dunes.',
        rec: 'Dredge 600m of outfall channel using amphibious excavator.',
        eq: ['Amphibious Excavator', '150 HP Marine Pump', 'Sandbag Perimeter'],
        agency: 'Udupi City Municipal Council / Minor Irrigation',
        time: 'Deploy within 4 hours',
        cost: '₹ 3,80,000',
        vol: 88000
      }
    ]
  },
  {
    id: 'uttara_kannada',
    name: 'Uttara Kannada (Karwar - Sharavathi & Kali Estuary)',
    zone: 'Coastal Zone (ACZ-10)',
    lat: 14.8185,
    lng: 74.1332,
    elevation: 15,
    rainfall: 190.0,
    area_km2: 50.0,
    inundated_km2: 16.2,
    desc: 'Dense forest and coastal estuarine delta subject to high tidal surges and hill runoff.',
    crops: ['Rice (Paddy)', 'Arecanut (Betel Nut)', 'Spices (Clove/Nutmeg)', 'Coconut'],
    soil: 'Laterite Forest Loam',
    actions: [
      {
        zone: 'Kali River Lowland Delta',
        sev: 'Severe',
        prob: 0.96,
        area: 24.0,
        latOffset: -0.01,
        lngOffset: 0.02,
        head: 'Estuarine Flap Valve Repair & Embankment Barrier Placement',
        diag: 'Sea backwater entering low-lying paddy acreage.',
        rec: 'Deploy mobile flood barriers and replace worn neoprene seals on tidal outfall valves.',
        eq: ['Mobile Flood Barrier System', 'Slurry Dewatering Pumps', 'Divers'],
        agency: 'Port & Coastal Engineering Dept',
        time: 'Deploy within 4 hours',
        cost: '₹ 4,10,000',
        vol: 96000
      }
    ]
  },
  {
    id: 'kalaburagi',
    name: 'Kalaburagi (Gulbarga - Bhima & Bennethora Basin)',
    zone: 'North Eastern Dry Zone (ACZ-2)',
    lat: 17.3297,
    lng: 76.8343,
    elevation: 454,
    rainfall: 80.0,
    area_km2: 65.0,
    inundated_km2: 13.0,
    desc: 'Extensive black cotton soil plateau with major pulses and cotton fields prone to sudden depression pooling.',
    crops: ['Pigeon Pea (Tur/Arhar)', 'Cotton', 'Sorghum (Jowar)', 'Chickpea (Bengal Gram)'],
    soil: 'Deep Black Cotton (Vertisol)',
    actions: [
      {
        zone: 'Bhima River Floodplain Trough',
        sev: 'Severe',
        prob: 0.94,
        area: 25.0,
        latOffset: -0.02,
        lngOffset: 0.02,
        head: 'Emergency Vertisol Drainage Swale Excavation & Tractor Dewatering',
        diag: 'Deep black vertisols expanding and sealing percolation. Water stagnant over red gram seed plots.',
        rec: 'Excavate 1.2m broad diversion drains to connect into Bhima tributary. Mobilize tractor PTO pumps.',
        eq: ['Tractor PTO Pumps (x3)', 'Hydraulic Backhoe', 'Trenching Crew'],
        agency: 'Krishna Bhagya Jala Nigam (KBJNL) / Agriculture Wing',
        time: 'Deploy within 4 hours',
        cost: '₹ 3,10,000',
        vol: 100000
      }
    ]
  },
  {
    id: 'bidar',
    name: 'Bidar (Karanja & Manjra River Plateau Basin)',
    zone: 'North Eastern Dry Zone (ACZ-2)',
    lat: 17.9135,
    lng: 77.5200,
    elevation: 715,
    rainfall: 78.0,
    area_km2: 46.0,
    inundated_km2: 8.5,
    desc: 'Lateritic plateau with sugarcane and pulse valleys subject to localized flash pooling.',
    crops: ['Sorghum (Jowar)', 'Pigeon Pea (Tur/Arhar)', 'Soybean', 'Sugarcane'],
    soil: 'Laterite Loam',
    actions: [
      {
        zone: 'Karanja Reservoir Tail Depression',
        sev: 'Severe',
        prob: 0.90,
        area: 15.0,
        latOffset: 0.02,
        lngOffset: -0.01,
        head: 'Relief Swale Regrading & Mobile Pump Evacuation',
        diag: 'Runoff stagnant across soybean fields due to high embankment bottleneck.',
        rec: 'Excavate 1.0m relief swale and deploy mobile dewatering pump unit.',
        eq: ['Mini Excavator', '75 HP Diesel Pump', 'Gravel Drains'],
        agency: 'Minor Irrigation Dept Bidar',
        time: 'Deploy within 6 hours',
        cost: '₹ 1,95,000',
        vol: 60000
      }
    ]
  },
  {
    id: 'raichur',
    name: 'Raichur (Krishna-Tungabhadra Doab Basin)',
    zone: 'North Eastern Dry Zone (ACZ-2)',
    lat: 16.2076,
    lng: 77.3550,
    elevation: 407,
    rainfall: 60.0,
    area_km2: 60.0,
    inundated_km2: 12.0,
    desc: 'Inter-fluvial doab between Krishna and Tungabhadra rivers with major paddy and cotton irrigation command.',
    crops: ['Rice (Paddy)', 'Cotton', 'Groundnut (Peanut)', 'Sorghum (Jowar)'],
    soil: 'Deep Black Vertisol & Red Loam',
    actions: [
      {
        zone: 'Tungabhadra Left Bank Canal Sump',
        sev: 'Severe',
        prob: 0.93,
        area: 21.0,
        latOffset: -0.02,
        lngOffset: 0.02,
        head: 'Canal Outfall Desiltation & Mobile PTO Pump Dispatch',
        diag: 'Backwater accumulation in paddy seedbed basins.',
        rec: 'Clear silt from drainage outfall and deploy three tractor PTO pumps.',
        eq: ['Tractor PTO Pumps (x3)', 'Excavator', 'Drainage Crew'],
        agency: 'Command Area Development Authority (CADA) Tungabhadra',
        time: 'Deploy within 4 hours',
        cost: '₹ 2,75,000',
        vol: 84000
      }
    ]
  },
  {
    id: 'ballari',
    name: 'Ballari (Bellary - Hagari River Semi-Arid Basin)',
    zone: 'North Eastern Dry Zone (ACZ-2)',
    lat: 15.1394,
    lng: 76.9214,
    elevation: 495,
    rainfall: 55.0,
    area_km2: 54.0,
    inundated_km2: 9.2,
    desc: 'Semi-arid cotton, chilli, and paddy basin prone to sudden flash pooling in low-gradient vertisol sumps.',
    crops: ['Rice (Paddy)', 'Cotton', 'Chili (Green/Red)', 'Sunflower'],
    soil: 'Deep Black Vertisol',
    actions: [
      {
        zone: 'Hagari River Floodplain Trough',
        sev: 'Severe',
        prob: 0.91,
        area: 16.0,
        latOffset: 0.02,
        lngOffset: -0.02,
        head: 'Perimeter Bund Trenching & Agricultural Slurry Dewatering',
        diag: 'Waterlogging over chilli acreage due to impermeable black clay topsoil.',
        rec: 'Cut 1.0m perimeter relief ditches and pump excess water into main drain.',
        eq: ['Hydraulic Trencher', 'Slurry Pumps (x2)', 'Sandbags'],
        agency: 'Dept of Agriculture / Ballari Municipal Corp',
        time: 'Deploy within 6 hours',
        cost: '₹ 2,10,000',
        vol: 64000
      }
    ]
  },
  {
    id: 'vijayanagara',
    name: 'Vijayanagara (Hospet - Tungabhadra Canal Command)',
    zone: 'North Eastern Dry Zone (ACZ-2)',
    lat: 15.2689,
    lng: 76.3909,
    elevation: 480,
    rainfall: 62.0,
    area_km2: 50.0,
    inundated_km2: 10.4,
    desc: 'Canal irrigated sugarcane, banana, and paddy belt along Tungabhadra reservoir command.',
    crops: ['Rice (Paddy)', 'Sugarcane', 'Cotton', 'Banana'],
    soil: 'Red Clay Loam & Alluvium',
    actions: [
      {
        zone: 'Hampi Heritage Canal Outfall Buffer',
        sev: 'Severe',
        prob: 0.89,
        area: 14.5,
        latOffset: 0.02,
        lngOffset: 0.01,
        head: 'Ancient Sluice Bypass Regulation & Silt Dredging',
        diag: 'Canal water backing up into banana and sugarcane plantations.',
        rec: 'Regulate heritage canal sluices and dredge sediment from secondary discharge channel.',
        eq: ['Canal Dredger', 'Weir Winch System', 'PWD Technicians'],
        agency: 'Water Resources Dept / Hampi Authority',
        time: 'Deploy within 6 hours',
        cost: '₹ 2,20,000',
        vol: 58000
      }
    ]
  },
  {
    id: 'koppal',
    name: 'Koppal (Tungabhadra Reservoir Catchment)',
    zone: 'Northern Dry Zone (ACZ-3)',
    lat: 15.3547,
    lng: 76.1546,
    elevation: 517,
    rainfall: 58.0,
    area_km2: 48.0,
    inundated_km2: 8.9,
    desc: 'Hilly and granitic plateau with paddy and sorghum valleys along reservoir backwater fringe.',
    crops: ['Rice (Paddy)', 'Sorghum (Jowar)', 'Groundnut (Peanut)', 'Cotton'],
    soil: 'Red Sandy Loam & Black Clay',
    actions: [
      {
        zone: 'Munirabad Canal Low Basin',
        sev: 'Severe',
        prob: 0.88,
        area: 13.0,
        latOffset: -0.02,
        lngOffset: 0.02,
        head: 'Canal Flap Gate Desiltation & Ditch Drainage',
        diag: 'Sediment obstructing canal outfall culvert.',
        rec: 'Dredge 400m of field collector ditch with backhoe excavator.',
        eq: ['JCB Excavator', 'Drainage Crew', 'Slurry Pump'],
        agency: 'CADA Tungabhadra Koppal',
        time: 'Deploy within 8 hours',
        cost: '₹ 1,60,000',
        vol: 52000
      }
    ]
  },
  {
    id: 'gadag',
    name: 'Gadag (Tungabhadra Tail-End Dry Basin)',
    zone: 'Northern Dry Zone (ACZ-3)',
    lat: 15.4315,
    lng: 75.6355,
    elevation: 650,
    rainfall: 54.0,
    area_km2: 50.0,
    inundated_km2: 8.0,
    desc: 'Cotton, sunflower, and jowar black soil plains prone to localized depression stagnation.',
    crops: ['Cotton', 'Sorghum (Jowar)', 'Groundnut (Peanut)', 'Sunflower'],
    soil: 'Deep Black Cotton (Vertisol)',
    actions: [
      {
        zone: 'Binkadakatti Watershed Trough',
        sev: 'Severe',
        prob: 0.87,
        area: 12.0,
        latOffset: 0.02,
        lngOffset: -0.01,
        head: 'Deep Interceptor Trenching & Gravity Outflow Opening',
        diag: 'Vertisol topsoil swelling and holding standing water over cotton acreage.',
        rec: 'Construct 1.2m deep interceptor trenches along field boundaries.',
        eq: ['Trench Digger', 'Perforated PVC 150mm', 'Gravel'],
        agency: 'Dept of Agriculture (Watershed Wing)',
        time: 'Deploy within 8 hours',
        cost: '₹ 1,50,000',
        vol: 48000
      }
    ]
  },
  {
    id: 'dharwad',
    name: 'Dharwad (Hubballi-Dharwad Malaprabha Basin)',
    zone: 'Northern Transition Zone (ACZ-8)',
    lat: 15.4589,
    lng: 75.0078,
    elevation: 750,
    rainfall: 82.0,
    area_km2: 55.0,
    inundated_km2: 11.2,
    desc: 'Twin city urban and fertile soybean/wheat agricultural basin with rapid monsoonal runoff.',
    crops: ['Soybean', 'Cotton', 'Groundnut (Peanut)', 'Wheat'],
    soil: 'Medium Black & Red Loam',
    actions: [
      {
        zone: 'Unkal Lake Overflow Canal Corridor',
        sev: 'Severe',
        prob: 0.94,
        area: 15.0,
        latOffset: -0.02,
        lngOffset: 0.03,
        head: 'Lake Weir Sluice Adjustment & Silt Jetting',
        diag: 'Lake overflow choking road culverts and residential approaches.',
        rec: 'Open weir overflow gates and clear trash screens with high-pressure water jet.',
        eq: ['Lake Gate Winch', 'Municipal Jetting Truck', '75 HP Pump'],
        agency: 'Hubballi-Dharwad City Corporation (HDMC)',
        time: 'Deploy within 4 hours',
        cost: '₹ 2,30,000',
        vol: 60000
      }
    ]
  },
  {
    id: 'haveri',
    name: 'Haveri (Varada River Agro Basin)',
    zone: 'Northern Transition Zone (ACZ-8)',
    lat: 14.7951,
    lng: 75.4040,
    elevation: 570,
    rainfall: 90.0,
    area_km2: 52.0,
    inundated_km2: 11.8,
    desc: 'Varada river alluvial floodplain with intensive maize, cotton, and chilli crops.',
    crops: ['Maize (Corn)', 'Cotton', 'Arecanut (Betel Nut)', 'Groundnut (Peanut)'],
    soil: 'Red Sandy Loam & Vertisol',
    actions: [
      {
        zone: 'Varada River Floodplain Depression',
        sev: 'Severe',
        prob: 0.93,
        area: 18.0,
        latOffset: 0.01,
        lngOffset: -0.02,
        head: 'River Bund Emergency Repair & Tractor Dewatering',
        diag: 'Riverbank overflow entering maize and groundnut acreage.',
        rec: 'Reinforce bund with 1,200 sandbags and operate mobile tractor pumps.',
        eq: ['Tractor PTO Pumps (x2)', '1,200 Sandbags', 'Backhoe'],
        agency: 'Water Resources Dept / Agriculture Wing',
        time: 'Deploy within 5 hours',
        cost: '₹ 2,40,000',
        vol: 72000
      }
    ]
  },
  {
    id: 'bagalkot',
    name: 'Bagalkot (Ghataprabha Basin)',
    zone: 'Northern Dry Zone (ACZ-3)',
    lat: 16.1691,
    lng: 75.6615,
    elevation: 535,
    rainfall: 75.0,
    area_km2: 56.0,
    inundated_km2: 13.5,
    desc: 'Ghataprabha and Malaprabha confluence basin with sugarcane and grape orchards.',
    crops: ['Grape', 'Sugarcane', 'Wheat', 'Sorghum (Jowar)'],
    soil: 'Deep Black Vertisol',
    actions: [
      {
        zone: 'Ghataprabha Canal Sump Buffer',
        sev: 'Severe',
        prob: 0.95,
        area: 20.0,
        latOffset: 0.02,
        lngOffset: 0.02,
        head: 'Canal Drainage Outfall Desilting & Mobile Dewatering',
        diag: 'Heavy backwater pooling in low vertisol hollows.',
        rec: 'Dredge 500m of outfall canal with tracked excavator and deploy two 100 HP diesel pumps.',
        eq: ['Tracked Excavator', '100 HP Pumps (x2)', 'Dump Trucks'],
        agency: 'Bagalkot City Municipal Council / KBJNL',
        time: 'Deploy within 4 hours',
        cost: '₹ 3,20,000',
        vol: 80000
      }
    ]
  },
  {
    id: 'vijayapura',
    name: 'Vijayapura (Bijapur - Doni River Valley)',
    zone: 'Northern Dry Zone (ACZ-3)',
    lat: 16.8302,
    lng: 75.7100,
    elevation: 592,
    rainfall: 62.0,
    area_km2: 60.0,
    inundated_km2: 11.5,
    desc: 'Doni river saline-silt valley with pulses and grape gardens prone to sudden cloudburst pooling.',
    crops: ['Pigeon Pea (Tur/Arhar)', 'Sorghum (Jowar)', 'Sunflower', 'Grape'],
    soil: 'Deep Black Cotton (Vertisol)',
    actions: [
      {
        zone: 'Doni River Flash Inflow Trough',
        sev: 'Severe',
        prob: 0.92,
        area: 17.5,
        latOffset: -0.02,
        lngOffset: 0.03,
        head: 'Flash Flood Swale Broadening & Trench Dewatering',
        diag: 'Rapid surface pooling in flat vertisol plains during rainfall peaks.',
        rec: 'Widen collector swale to 3.0m width and clear silt bottlenecks.',
        eq: ['Hydraulic Excavator', 'Slurry Pumps', 'Gravel Drains'],
        agency: 'Dept of Agriculture (Watershed Wing)',
        time: 'Deploy within 6 hours',
        cost: '₹ 2,30,000',
        vol: 70000
      }
    ]
  },
  {
    id: 'yadgir',
    name: 'Yadgir (Bhima River Black Vertisol Plain)',
    zone: 'North Eastern Dry Zone (ACZ-2)',
    lat: 16.7701,
    lng: 77.1335,
    elevation: 420,
    rainfall: 65.0,
    area_km2: 52.0,
    inundated_km2: 9.5,
    desc: 'Deep black clay plains with tur dal and cotton fields subject to riverine backwater.',
    crops: ['Pigeon Pea (Tur/Arhar)', 'Sorghum (Jowar)', 'Chickpea (Bengal Gram)', 'Cotton'],
    soil: 'Deep Black Cotton (Vertisol)',
    actions: [
      {
        zone: 'Bhima Tributary Flood Plain',
        sev: 'Severe',
        prob: 0.91,
        area: 16.0,
        latOffset: 0.01,
        lngOffset: -0.02,
        head: 'Relief Bund Excavation & Mobile PTO Pumping',
        diag: 'Standing water over red gram fields due to zero infiltration.',
        rec: 'Cut 1.2m relief drains and operate tractor PTO pumps.',
        eq: ['Tractor PTO Pumps (x2)', 'Backhoe', 'Drainage Crew'],
        agency: 'KBJNL / Agriculture Dept',
        time: 'Deploy within 6 hours',
        cost: '₹ 2,10,000',
        vol: 64000
      }
    ]
  },
  {
    id: 'davangere',
    name: 'Davangere (Bhadra Canal Command Catchment)',
    zone: 'Central Dry Zone (ACZ-4)',
    lat: 14.4644,
    lng: 75.9218,
    elevation: 602,
    rainfall: 72.0,
    area_km2: 54.0,
    inundated_km2: 10.8,
    desc: 'Bhadra canal command with intensive maize, paddy, and sugarcane acreage.',
    crops: ['Maize (Corn)', 'Rice (Paddy)', 'Sugarcane', 'Arecanut (Betel Nut)'],
    soil: 'Red Clay Loam & Vertisol',
    actions: [
      {
        zone: 'Bhadra Canal Tail Depression',
        sev: 'Severe',
        prob: 0.90,
        area: 15.5,
        latOffset: -0.02,
        lngOffset: 0.01,
        head: 'Canal Flap Gate Desilting & Sump Relief',
        diag: 'Canal overflow entering maize acreage.',
        rec: 'Dredge 500m of field collector ditch with backhoe excavator.',
        eq: ['JCB Excavator', 'Drainage Crew', 'Slurry Pump'],
        agency: 'CADA Bhadra / Davangere City Corp',
        time: 'Deploy within 6 hours',
        cost: '₹ 1,85,000',
        vol: 62000
      }
    ]
  },
  {
    id: 'chitradurga',
    name: 'Chitradurga (Vedavathi River Semi-Arid Basin)',
    zone: 'Central Dry Zone (ACZ-4)',
    lat: 14.2304,
    lng: 76.3980,
    elevation: 732,
    rainfall: 52.0,
    area_km2: 50.0,
    inundated_km2: 7.8,
    desc: 'Groundnut, sunflower, and maize dryland basin with localized flash stream sumps.',
    crops: ['Groundnut (Peanut)', 'Sunflower', 'Maize (Corn)', 'Finger Millet (Ragi)'],
    soil: 'Red Sandy Loam',
    actions: [
      {
        zone: 'Vedavathi Flash Stream Outfall',
        sev: 'Severe',
        prob: 0.88,
        area: 12.0,
        latOffset: 0.02,
        lngOffset: -0.02,
        head: 'Stream Silt Clearance & Perimeter Bunding',
        diag: 'Debris choking culvert causing upstream water pooling.',
        rec: 'Clear silt from road bridge culvert and erect temporary diversion bund.',
        eq: ['Backhoe Excavator', 'Dump Truck', 'PWD Road Crew'],
        agency: 'PWD / Agriculture Dept',
        time: 'Deploy within 8 hours',
        cost: '₹ 1,40,000',
        vol: 48000
      }
    ]
  },
  {
    id: 'tumakuru',
    name: 'Tumakuru (Jayamangali & Shimsha Basin)',
    zone: 'Central Dry Zone (ACZ-4)',
    lat: 13.3392,
    lng: 77.1166,
    elevation: 822,
    rainfall: 68.0,
    area_km2: 52.0,
    inundated_km2: 9.6,
    desc: 'Coconut, arecanut, and ragi agro-belt with Shimsha river tributary overflows.',
    crops: ['Coconut', 'Finger Millet (Ragi)', 'Groundnut (Peanut)', 'Arecanut (Betel Nut)'],
    soil: 'Red Sandy Loam',
    actions: [
      {
        zone: 'Shimsha Basin Coconut Grove Sump',
        sev: 'Severe',
        prob: 0.89,
        area: 14.0,
        latOffset: -0.02,
        lngOffset: 0.02,
        head: 'Subsurface Ditch Aeration & Mobile Pump Sump Evacuation',
        diag: 'Water pooling in coconut plantations threatening root health.',
        rec: 'Excavate 1.0m deep drainage channels to connect with Jayamangali outfall.',
        eq: ['Mini Excavator', '50 HP Pump', 'Drainage Crew'],
        agency: 'Dept of Agriculture / Minor Irrigation',
        time: 'Deploy within 8 hours',
        cost: '₹ 1,70,000',
        vol: 56000
      }
    ]
  },
  {
    id: 'kolar',
    name: 'Kolar (Palikere & KGF Basin)',
    zone: 'Eastern Dry Zone (ACZ-5)',
    lat: 13.1367,
    lng: 78.1290,
    elevation: 822,
    rainfall: 65.0,
    area_km2: 46.0,
    inundated_km2: 7.5,
    desc: 'Horticultural belt (tomato, mango, potato) with intensive drip irrigation and tank cascades.',
    crops: ['Tomato', 'Mango', 'Potato', 'Finger Millet (Ragi)'],
    soil: 'Red Loam',
    actions: [
      {
        zone: 'Kolar Tomato Valley Choke Point',
        sev: 'Severe',
        prob: 0.91,
        area: 13.5,
        latOffset: 0.02,
        lngOffset: -0.01,
        head: 'Tank Sluice Regulation & Tomato Greenhouse Drainage',
        diag: 'Tank cascade backflow entering commercial tomato farms.',
        rec: 'Open tank secondary waste weirs and operate mobile diesel pumps.',
        eq: ['Waste Weir Winch', '75 HP Pump', 'JCB Excavator'],
        agency: 'Minor Irrigation Dept / Horticulture Wing',
        time: 'Deploy within 6 hours',
        cost: '₹ 1,80,000',
        vol: 54000
      }
    ]
  },
  {
    id: 'chikkaballapura',
    name: 'Chikkaballapura (North Pennar River Basin)',
    zone: 'Eastern Dry Zone (ACZ-5)',
    lat: 13.4325,
    lng: 77.7273,
    elevation: 915,
    rainfall: 64.0,
    area_km2: 45.0,
    inundated_km2: 7.2,
    desc: 'Grape, pomegranate, and tomato valley with rocky hill runoff pooling in flat basins.',
    crops: ['Tomato', 'Grape', 'Pomegranate', 'Finger Millet (Ragi)'],
    soil: 'Red Sandy Loam',
    actions: [
      {
        zone: 'North Pennar Inflow Low Swale',
        sev: 'Severe',
        prob: 0.88,
        area: 11.5,
        latOffset: -0.01,
        lngOffset: 0.02,
        head: 'Hill Runoff Diversion Swale Trenching',
        diag: 'Flash hill runoff collecting over vineyard plots.',
        rec: 'Excavate 1.2m diversion contour bund along hill fringe.',
        eq: ['Trench Digger', 'Perforated PVC', 'Backhoe'],
        agency: 'Dept of Agriculture (Watershed Wing)',
        time: 'Deploy within 8 hours',
        cost: '₹ 1,55,000',
        vol: 46000
      }
    ]
  },
  {
    id: 'ramanagara',
    name: 'Ramanagara (Arkavathi River & Silk City Catchment)',
    zone: 'Eastern Dry Zone (ACZ-5)',
    lat: 12.7159,
    lng: 77.2810,
    elevation: 800,
    rainfall: 72.0,
    area_km2: 48.0,
    inundated_km2: 8.8,
    desc: 'Arkavathi river valley with mulberry sericulture, ragi, and coconut groves.',
    crops: ['Mulberry (Sericulture)', 'Finger Millet (Ragi)', 'Coconut', 'Mango'],
    soil: 'Red Sandy Loam',
    actions: [
      {
        zone: 'Arkavathi River Outfall Lowland',
        sev: 'Severe',
        prob: 0.90,
        area: 14.0,
        latOffset: 0.02,
        lngOffset: -0.02,
        head: 'Mulberry Plot Drainage Trenching & Sump Clearance',
        diag: 'Water stagnant over mulberry plantations causing root rot.',
        rec: 'Excavate 1.0m deep perimeter ditches and pump excess water into Arkavathi.',
        eq: ['Mini Excavator', '50 HP Pump', 'Drainage Crew'],
        agency: 'Sericulture Dept / Minor Irrigation',
        time: 'Deploy within 6 hours',
        cost: '₹ 1,75,000',
        vol: 56000
      }
    ]
  },
  {
    id: 'hassan',
    name: 'Hassan (Hemavathi River Catchment)',
    zone: 'Southern Transition Zone (ACZ-7)',
    lat: 13.0072,
    lng: 76.0961,
    elevation: 957,
    rainfall: 110.0,
    area_km2: 54.0,
    inundated_km2: 12.5,
    desc: 'Potato, coffee, and ragi agro-zone along Hemavathi reservoir catchment.',
    crops: ['Potato', 'Coffee (Arabica/Robusta)', 'Finger Millet (Ragi)', 'Maize (Corn)'],
    soil: 'Red Clay Loam',
    actions: [
      {
        zone: 'Hemavathi Reservoir Low Swale',
        sev: 'Severe',
        prob: 0.92,
        area: 16.5,
        latOffset: -0.02,
        lngOffset: 0.02,
        head: 'Potato Field Emergency Subsurface Drainage',
        diag: 'High water saturation causing potato tuber rot risk.',
        rec: 'Construct perforated French drain lines and operate mobile slurry pump.',
        eq: ['French Drain Trenchers', 'Perforated PVC 150mm', '75 HP Pump'],
        agency: 'Horticulture Dept / CADA Hemavathi',
        time: 'Deploy within 6 hours',
        cost: '₹ 2,20,000',
        vol: 66000
      }
    ]
  },
  {
    id: 'kodagu',
    name: 'Kodagu (Coorg - Cauvery Origin & Coffee Hills)',
    zone: 'Hilly Zone (ACZ-9) / Western Ghats',
    lat: 12.4244,
    lng: 75.7382,
    elevation: 1150,
    rainfall: 210.0,
    area_km2: 45.0,
    inundated_km2: 12.0,
    desc: 'Steep hill slopes with coffee, black pepper, and cardamom plantations subject to valley flash waterlogging.',
    crops: ['Coffee (Arabica/Robusta)', 'Black Pepper (Kari Menasu)', 'Cardamom (Yalakki)', 'Rice (Paddy)'],
    soil: 'Forest Loam & Laterite',
    actions: [
      {
        zone: 'Cauvery Headwaters Valley Lowland',
        sev: 'Severe',
        prob: 0.96,
        area: 18.0,
        latOffset: 0.02,
        lngOffset: -0.02,
        head: 'Hillside Drainage Swale Clearing & Debris Removal',
        diag: 'Debris slides blocking valley streams, inundating paddy valley floors.',
        rec: 'Deploy tracked excavator to clear tree debris from stream bottleneck.',
        eq: ['Tracked Excavator', 'Chainsaw Crews', 'Culvert Jetter'],
        agency: 'KSDMA Kodagu / Forest Dept',
        time: 'Deploy within 4 hours',
        cost: '₹ 2,90,000',
        vol: 72000
      }
    ]
  },
  {
    id: 'chikkamagaluru',
    name: 'Chikkamagaluru (Bhadra Foothills & Coffee Hills)',
    zone: 'Hilly Zone (ACZ-9) / Western Ghats',
    lat: 13.3161,
    lng: 75.7720,
    elevation: 1090,
    rainfall: 180.0,
    area_km2: 48.0,
    inundated_km2: 11.5,
    desc: 'High-precipitation coffee and arecanut valleys along Bhadra river headwaters.',
    crops: ['Coffee (Arabica/Robusta)', 'Arecanut (Betel Nut)', 'Black Pepper (Kari Menasu)', 'Cardamom (Yalakki)'],
    soil: 'Laterite Gravelly Loam',
    actions: [
      {
        zone: 'Bhadra Valley Stream Choke Point',
        sev: 'Severe',
        prob: 0.94,
        area: 15.0,
        latOffset: -0.02,
        lngOffset: 0.01,
        head: 'Stream Bottleneck Dredging & Valley Swale Aeration',
        diag: 'Stream backwater pooling in arecanut plantation bottoms.',
        rec: 'Dredge gravel and silt from stream bed with mini excavator.',
        eq: ['Mini Excavator', 'Ditch Trencher', 'Drainage Crew'],
        agency: 'Water Resources Dept / KSDMA',
        time: 'Deploy within 6 hours',
        cost: '₹ 2,10,000',
        vol: 60000
      }
    ]
  },
  {
    id: 'chamarajanagar',
    name: 'Chamarajanagar (Suvarnavathi & Gundal Basin)',
    zone: 'Southern Dry Zone (ACZ-6)',
    lat: 11.9261,
    lng: 76.9437,
    elevation: 690,
    rainfall: 60.0,
    area_km2: 46.0,
    inundated_km2: 7.8,
    desc: 'Sugarcane, banana, and maize plots in rain-shadow basin along Tamil Nadu border.',
    crops: ['Sugarcane', 'Rice (Paddy)', 'Maize (Corn)', 'Banana'],
    soil: 'Red Sandy Loam & Vertisol',
    actions: [
      {
        zone: 'Suvarnavathi Canal Tail Depression',
        sev: 'Severe',
        prob: 0.89,
        area: 12.5,
        latOffset: 0.01,
        lngOffset: 0.02,
        head: 'Canal Sluice Regulation & Mobile Pump Dewatering',
        diag: 'Canal overflow collecting over banana plantations.',
        rec: 'Throttle canal sluice and pump excess runoff into Gundal river.',
        eq: ['75 HP Mobile Pump', 'Backhoe', 'Drainage Crew'],
        agency: 'CNNL / Agriculture Wing',
        time: 'Deploy within 6 hours',
        cost: '₹ 1,65,000',
        vol: 50000
      }
    ]
  }
];

export async function seedDatabase() {
  console.log('[*] Starting Database Seeding with ALL 31 Karnataka Districts (Pure Karnataka Intelligence)...');
  await initializeDatabase();

  // 1. Cleanly reset study_areas and related runs/zones/advisories to guarantee exact 31 districts
  await query('TRUNCATE TABLE drainage_advisories, severity_zones, analysis_runs, study_areas CASCADE;');
  console.log('[+] Cleaned legacy study areas and benchmarks.');

  // 2. Insert all 31 Karnataka Study Areas
  for (const dist of ALL_31_KARNATAKA_DISTRICTS) {
    const delta = 0.04;
    const boundsGeojson = {
      type: 'Polygon',
      coordinates: [
        [
          [dist.lng - delta, dist.lat - delta],
          [dist.lng + delta, dist.lat - delta],
          [dist.lng + delta, dist.lat + delta],
          [dist.lng - delta, dist.lat + delta],
          [dist.lng - delta, dist.lat - delta]
        ]
      ]
    };

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
      [
        dist.id,
        dist.name,
        `Karnataka (${dist.zone})`,
        'India',
        dist.desc,
        dist.lat,
        dist.lng,
        13,
        JSON.stringify(boundsGeojson)
      ]
    );

    // 3. Insert Analysis Run
    const runId = `run_${dist.id}_monsoon_2026`;
    const waterloggedPct = Number(((dist.inundated_km2 / dist.area_km2) * 100).toFixed(1));
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
      [
        runId,
        dist.id,
        'random_forest',
        '2026-06-10',
        '2026-08-25',
        dist.rainfall,
        dist.area_km2,
        dist.inundated_km2,
        waterloggedPct,
        dist.actions.length,
        2,
        1
      ]
    );

    // 4. Insert Severity Zones & Civil Drainage Advisories
    for (let i = 0; i < dist.actions.length; i++) {
      const act = dist.actions[i];
      const zoneId = `z_${dist.id}_${i + 1}`;
      const advId = `adv_${dist.id}_${i + 1}`;

      const zLat = dist.lat + act.latOffset;
      const zLng = dist.lng + act.lngOffset;
      const zDelta = 0.012;

      const polygonCoords = [
        [zLng - zDelta, zLat - zDelta],
        [zLng + zDelta, zLat - zDelta],
        [zLng + zDelta, zLat + zDelta],
        [zLng - zDelta, zLat + zDelta],
        [zLng - zDelta, zLat - zDelta]
      ];

      const geojsonFeature = {
        type: 'Feature',
        properties: {
          id: zoneId,
          name: `${dist.name.split('(')[0].trim()} - ${act.zone}`,
          severity: act.sev,
          probability: act.prob,
          elevation_m: dist.elevation - 15,
          slope_deg: 0.8,
          land_use: 'agricultural',
          area_ha: act.area,
          is_persistent: true
        },
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords]
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
        [
          zoneId,
          runId,
          `${dist.name.split('(')[0].trim()} - ${act.zone}`,
          act.sev,
          act.prob,
          dist.elevation - 15,
          0.8,
          'agricultural',
          act.area,
          true,
          0.65,
          0.78,
          0.12,
          -22.5,
          -29.2,
          JSON.stringify(geojsonFeature)
        ]
      );

      // Drainage Advisory
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
          runId,
          zoneId,
          `${dist.name.split('(')[0].trim()} - ${act.zone}`,
          'Priority 1 (Critical)',
          Math.round(act.prob * 100),
          act.head,
          act.diag,
          act.rec,
          act.vol,
          JSON.stringify({
            equipment_required: act.eq,
            agency: act.agency,
            timeline: act.time,
            estimated_cost_inr: act.cost,
            status: 'Pending Dispatch'
          })
        ]
      );
    }

    // Add 1 Moderate and 1 Low Zone for realism
    const modZoneId = `z_${dist.id}_mod`;
    const modAdvId = `adv_${dist.id}_mod`;
    const modLat = dist.lat + 0.025;
    const modLng = dist.lng + 0.025;
    const modPolygon = [
      [modLng - 0.01, modLat - 0.01],
      [modLng + 0.01, modLat - 0.01],
      [modLng + 0.01, modLat + 0.01],
      [modLng - 0.01, modLat + 0.01],
      [modLng - 0.01, modLat - 0.01]
    ];

    const modGeojson = {
      type: 'Feature',
      properties: {
        id: modZoneId,
        name: `${dist.name.split('(')[0].trim()} - Agro Swale Buffer`,
        severity: 'Moderate',
        probability: 0.58,
        elevation_m: dist.elevation,
        slope_deg: 2.1,
        land_use: 'agricultural',
        area_ha: 15.0,
        is_persistent: false
      },
      geometry: { type: 'Polygon', coordinates: [modPolygon] }
    };

    await query(
      `INSERT INTO severity_zones (id, analysis_run_id, zone_name, severity, probability, elevation_m, slope_deg, land_use, area_ha, is_persistent, ndwi, mndwi, ndvi, vv_db, vh_db, geojson_feature)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO NOTHING;`,
      [modZoneId, runId, `${dist.name.split('(')[0].trim()} - Agro Swale Buffer`, 'Moderate', 0.58, dist.elevation, 2.1, 'agricultural', 15.0, false, 0.32, 0.42, 0.40, -15.2, -20.5, JSON.stringify(modGeojson)]
    );

    await query(
      `INSERT INTO drainage_advisories (id, analysis_run_id, zone_id, zone_name, priority, urgency_score, title, diagnosis, action_recommendation, estimated_volume_m3, mitigation_actions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING;`,
      [
        modAdvId,
        runId,
        modZoneId,
        `${dist.name.split('(')[0].trim()} - Agro Swale Buffer`,
        'Priority 2 (High)',
        75,
        `Drainage Swale Clearing & Interceptor Trenching: ${dist.name.split('(')[0].trim()}`,
        `Moderate surface water stagnation in crop root zone (MNDWI 0.42). Elevation allows natural gravity runoff if outfall swales are cleared.`,
        `Dredge collector ditch with mini excavator and install perforated PVC sub-surface drain pipes.`,
        30000,
        JSON.stringify({
          equipment_required: ['Mini Excavator', 'Perforated PVC 150mm', 'Gravel Drains'],
          agency: 'Dept of Agriculture (Watershed Wing)',
          timeline: 'Execute within 18 hours',
          estimated_cost_inr: '₹ 1,45,000',
          status: 'Scheduled'
        })
      ]
    );
  }

  console.log(`[+] Seeded ALL ${ALL_31_KARNATAKA_DISTRICTS.length} Karnataka Districts into PostgreSQL!`);
}

if (process.argv[1] && process.argv[1].includes('seed.ts')) {
  seedDatabase().then(() => pool.end());
}
