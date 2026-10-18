/**
 * JalaDrishti AI — Karnataka Soil Intelligence Dataset
 * Grounded in Karnataka State Remote Sensing Applications Centre (KSRSAC) and NBSS&LUP soil surveys.
 */

export interface SoilTypeInfo {
  id: string;
  name: string;
  kannadaName: string;
  texture: string;
  drainage: 'High' | 'Moderate' | 'Poor' | 'Excessive';
  waterRetention: 'High' | 'Moderate' | 'Low';
  typicalPh: [number, number];
  primaryDistricts: string[];
  swatchBg: string;
  swatchBorder: string;
  defaultMoistureText: string;
  defaultMoisturePct: number;
  defaultDrainageText: string;
  defaultDrainagePct: number;
  defaultTempC: number;
  suitableCropHighlights: string[];
}

export const KARNATAKA_SOILS: SoilTypeInfo[] = [
  {
    id: 'clay_loam',
    name: 'Clay Loam (Heavy)',
    kannadaName: 'ಜಿಗುಟು ಜೇಡಿ ಮಣ್ಣು (Clay Loam)',
    texture: 'Fine texture, 28–40% clay, cohesive and plastic',
    drainage: 'Moderate',
    waterRetention: 'High',
    typicalPh: [6.0, 7.5],
    primaryDistricts: ['mandya', 'mysuru', 'shivamogga', 'davangere', 'ballari'],
    swatchBg: '#78350f',
    swatchBorder: '#b45309',
    defaultMoistureText: 'High',
    defaultMoisturePct: 78,
    defaultDrainageText: 'Moderate',
    defaultDrainagePct: 55,
    defaultTempC: 28,
    suitableCropHighlights: ['Rice / Paddy', 'Sugarcane', 'Wheat', 'Maize', 'Vegetables'],
  },
  {
    id: 'deep_black_clay',
    name: 'Deep Black Cotton Soil (Vertisol)',
    kannadaName: 'ಕರಿ ಮಣ್ಣು (Eregadu)',
    texture: 'Very fine, montmorillonite clay (>50%), deep self-ploughing cracks',
    drainage: 'Poor',
    waterRetention: 'High',
    typicalPh: [7.2, 8.5],
    primaryDistricts: ['kalaburagi', 'bidar', 'raichur', 'ballari', 'vijayapura', 'bagalkot'],
    swatchBg: '#1c1917',
    swatchBorder: '#44403c',
    defaultMoistureText: 'Very High',
    defaultMoisturePct: 86,
    defaultDrainageText: 'Poor / Slow',
    defaultDrainagePct: 35,
    defaultTempC: 29,
    suitableCropHighlights: ['Cotton', 'Sorghum (Rabi Jowar)', 'Bengal Gram', 'Sunflower', 'Safflower'],
  },
  {
    id: 'medium_black_soil',
    name: 'Medium Black Soil',
    kannadaName: 'ಮಧ್ಯಮ ಕಪ್ಪು ಮಣ್ಣು',
    texture: 'Medium fine texture, 35–45% clay, moderate cracking',
    drainage: 'Moderate',
    waterRetention: 'Moderate',
    typicalPh: [6.8, 8.2],
    primaryDistricts: ['dharwad', 'belagavi', 'gadag', 'haveri', 'koppal'],
    swatchBg: '#292524',
    swatchBorder: '#57534e',
    defaultMoistureText: 'Moderate',
    defaultMoisturePct: 65,
    defaultDrainageText: 'Moderate',
    defaultDrainagePct: 60,
    defaultTempC: 27,
    suitableCropHighlights: ['Soybean', 'Cotton', 'Maize', 'Red Gram', 'Chili', 'Sunflower'],
  },
  {
    id: 'red_loam',
    name: 'Red Loam',
    kannadaName: 'ಕೆಂಪು ಗೋಡು ಮಣ್ಣu',
    texture: 'Friable, porous, well-aerated with iron oxides and kaolinite clay',
    drainage: 'Moderate',
    waterRetention: 'Moderate',
    typicalPh: [6.0, 7.2],
    primaryDistricts: ['bengaluru_rural', 'bengaluru_urban', 'ramanagara', 'hassan', 'chikkamagaluru'],
    swatchBg: '#991b1b',
    swatchBorder: '#dc2626',
    defaultMoistureText: 'Moderate',
    defaultMoisturePct: 60,
    defaultDrainageText: 'Well Drained',
    defaultDrainagePct: 75,
    defaultTempC: 26,
    suitableCropHighlights: ['Finger Millet (Ragi)', 'Maize', 'Tomato', 'Potato', 'Mango', 'Mulberry'],
  },
  {
    id: 'red_sandy_loam',
    name: 'Red Sandy Loam',
    kannadaName: 'ಕೆಂಪು ಮರಳು ಗೋಡು ಮಣ್ಣು',
    texture: 'Coarse to medium sandy loam, high infiltration, low organic carbon',
    drainage: 'High',
    waterRetention: 'Low',
    typicalPh: [5.5, 6.8],
    primaryDistricts: ['kolar', 'chikkaballapura', 'tumakuru', 'chitradurga'],
    swatchBg: '#b91c1c',
    swatchBorder: '#ef4444',
    defaultMoistureText: 'Low',
    defaultMoisturePct: 45,
    defaultDrainageText: 'High / Rapid',
    defaultDrainagePct: 85,
    defaultTempC: 28,
    suitableCropHighlights: ['Groundnut', 'Finger Millet', 'Castor', 'Horse Gram', 'Pulses', 'Carrot'],
  },
  {
    id: 'alluvial_silt',
    name: 'Alluvial Riverine Silt',
    kannadaName: 'ವಂಡಲು ಮಣ್ಣು (Alluvial Silt)',
    texture: 'Silt loam to silty clay, highly fertile, deposited by Kaveri/Krishna river basins',
    drainage: 'Moderate',
    waterRetention: 'High',
    typicalPh: [6.5, 7.8],
    primaryDistricts: ['mandya', 'mysuru', 'raichur', 'belagavi', 'bagalkot'],
    swatchBg: '#854d0e',
    swatchBorder: '#ca8a04',
    defaultMoistureText: 'High',
    defaultMoisturePct: 74,
    defaultDrainageText: 'Good',
    defaultDrainagePct: 70,
    defaultTempC: 27,
    suitableCropHighlights: ['Sugarcane', 'Rice / Paddy', 'Banana', 'Turmeric', 'Vegetables'],
  },
  {
    id: 'lateritic_gravel',
    name: 'Laterite / Lateritic Loam',
    kannadaName: 'ಜಂಬಿಟ್ಟಿಗೆ ಮಣ್ಣು (Laterite)',
    texture: 'Acidic, cellular, rich in iron/aluminum sesquioxides, highly weathered',
    drainage: 'High',
    waterRetention: 'Low',
    typicalPh: [4.5, 6.2],
    primaryDistricts: ['dakshina_kannada', 'udupi', 'uttara_kannada', 'kodagu', 'shivamogga'],
    swatchBg: '#c2410c',
    swatchBorder: '#ea580c',
    defaultMoistureText: 'Moderate',
    defaultMoisturePct: 58,
    defaultDrainageText: 'Excessive',
    defaultDrainagePct: 88,
    defaultTempC: 25,
    suitableCropHighlights: ['Arecanut', 'Coconut', 'Coffee (Arabica/Robusta)', 'Black Pepper', 'Cashew', 'Rubber'],
  },
  {
    id: 'coastal_sandy',
    name: 'Coastal Alluvial Sand',
    kannadaName: 'ಕರಾವಳಿ ಮರಳು ಮಣ್ಣು',
    texture: 'Coarse marine sand, very low CEC, high salinity risk near shoreline',
    drainage: 'Excessive',
    waterRetention: 'Low',
    typicalPh: [5.8, 7.2],
    primaryDistricts: ['udupi', 'dakshina_kannada', 'uttara_kannada'],
    swatchBg: '#d97706',
    swatchBorder: '#f59e0b',
    defaultMoistureText: 'Low',
    defaultMoisturePct: 38,
    defaultDrainageText: 'Very High',
    defaultDrainagePct: 92,
    defaultTempC: 29,
    suitableCropHighlights: ['Coconut', 'Cashewnut', 'Watermelon', 'Sweet Potato', 'Betel Vine'],
  },
];
