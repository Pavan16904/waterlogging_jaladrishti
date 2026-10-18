/**
 * Karnataka 31-District Geo Registry for Weather Dashboard
 * Aligned with the backend KARNATAKA_DISTRICTS_GEO and the FloodMapPage district list.
 */

export interface WeatherDistrict {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  elevation: number;
  zone: string;
  river: string;
}

export const KARNATAKA_31_DISTRICTS_WEATHER: WeatherDistrict[] = [
  { id: 'ballari',          name: 'Ballari (Bellary)',            displayName: 'Ballari',          lat: 15.1394, lng: 76.9214, elevation: 495,  zone: 'North Eastern Dry Zone (ACZ-2)',      river: 'Tungabhadra' },
  { id: 'bengaluru_urban',  name: 'Bengaluru Urban',              displayName: 'Bengaluru Urban',  lat: 12.9716, lng: 77.5946, elevation: 920,  zone: 'Eastern Dry Zone (ACZ-5)',            river: 'Vrishabhavathi / Pinakini' },
  { id: 'bengaluru_rural',  name: 'Bengaluru Rural',              displayName: 'Bengaluru Rural',  lat: 13.1294, lng: 77.5730, elevation: 905,  zone: 'Eastern Dry Zone (ACZ-5)',            river: 'Arkavathi Basin' },
  { id: 'ramanagara',       name: 'Ramanagara',                   displayName: 'Ramanagara',       lat: 12.7159, lng: 77.2810, elevation: 800,  zone: 'Eastern Dry Zone (ACZ-5)',            river: 'Cauvery' },
  { id: 'kolar',            name: 'Kolar',                        displayName: 'Kolar',            lat: 13.1367, lng: 78.1290, elevation: 822,  zone: 'Eastern Dry Zone (ACZ-5)',            river: 'Pennar' },
  { id: 'chikkaballapura',  name: 'Chikkaballapura',              displayName: 'Chikkaballapura',  lat: 13.4325, lng: 77.7273, elevation: 915,  zone: 'Eastern Dry Zone (ACZ-5)',            river: 'Tungabhadra' },
  { id: 'tumakuru',         name: 'Tumakuru (Tumkur)',            displayName: 'Tumakuru',         lat: 13.3392, lng: 77.1166, elevation: 822,  zone: 'Central Dry Zone (ACZ-4)',            river: 'Pennar' },
  { id: 'chitradurga',      name: 'Chitradurga',                  displayName: 'Chitradurga',      lat: 14.2304, lng: 76.3980, elevation: 732,  zone: 'Central Dry Zone (ACZ-4)',            river: 'Vedavathi' },
  { id: 'davangere',        name: 'Davanagere',                   displayName: 'Davanagere',       lat: 14.4644, lng: 75.9218, elevation: 602,  zone: 'Central Dry Zone (ACZ-4)',            river: 'Heggarayi' },
  { id: 'shivamogga',       name: 'Shivamogga (Shimoga)',         displayName: 'Shivamogga',       lat: 13.9299, lng: 75.5681, elevation: 584,  zone: 'Southern Transition Zone (ACZ-7)',    river: 'Heggarayi' },
  { id: 'chikkamagaluru',   name: 'Chikkamagaluru',               displayName: 'Chikkamagaluru',   lat: 13.3161, lng: 75.7720, elevation: 1090, zone: 'Hilly Zone (ACZ-9) / Western Ghats', river: 'Bhadra / Hemavathi' },
  { id: 'hassan',           name: 'Hassan',                       displayName: 'Hassan',           lat: 13.0072, lng: 76.0961, elevation: 957,  zone: 'Southern Transition Zone (ACZ-7)',    river: 'Hemavathi Reservoir' },
  { id: 'kodagu',           name: 'Kodagu (Coorg)',               displayName: 'Kodagu',           lat: 12.4244, lng: 75.7382, elevation: 1150, zone: 'Hilly Zone (ACZ-9) / Western Ghats', river: 'Kaveri' },
  { id: 'mysuru',           name: 'Mysuru (Mysore)',              displayName: 'Mysuru',           lat: 12.2958, lng: 76.6394, elevation: 763,  zone: 'Southern Dry Zone (ACZ-6)',           river: 'Kaveri' },
  { id: 'mandya',           name: 'Mandya (Cauvery Basin)',       displayName: 'Mandya',           lat: 12.5218, lng: 76.8951, elevation: 678,  zone: 'Southern Dry Zone (ACZ-6)',           river: 'Cauvery' },
  { id: 'chamarajanagar',   name: 'Chamarajanagar',               displayName: 'Chamarajanagar',   lat: 11.9261, lng: 76.9437, elevation: 690,  zone: 'Southern Dry Zone (ACZ-6)',           river: 'Suvarnavathi' },
  { id: 'dakshina_kannada', name: 'Dakshina Kannada (Mangaluru)', displayName: 'Dakshina Kannada', lat: 12.9141, lng: 74.8560, elevation: 22,   zone: 'Coastal Zone (ACZ-10)',               river: 'Netravati' },
  { id: 'udupi',            name: 'Udupi',                        displayName: 'Udupi',            lat: 13.3409, lng: 74.7421, elevation: 18,   zone: 'Coastal Zone (ACZ-10)',               river: 'Venkatapura' },
  { id: 'uttara_kannada',   name: 'Uttara Kannada (Karwar)',      displayName: 'Uttara Kannada',   lat: 14.8185, lng: 74.1332, elevation: 15,   zone: 'Coastal Zone (ACZ-10)',               river: 'Gangavali' },
  { id: 'belagavi',         name: 'Belagavi (Belgaum)',           displayName: 'Belagavi',         lat: 15.8497, lng: 74.4977, elevation: 762,  zone: 'Northern Transition Zone (ACZ-8)',    river: 'Krishna / Ghataprabha' },
  { id: 'dharwad',          name: 'Dharwad (Hubballi-Dharwad)',   displayName: 'Dharwad',          lat: 15.4589, lng: 75.0078, elevation: 750,  zone: 'Northern Transition Zone (ACZ-8)',    river: 'Dharwad' },
  { id: 'haveri',           name: 'Haveri',                       displayName: 'Haveri',           lat: 14.7951, lng: 75.4040, elevation: 570,  zone: 'Northern Transition Zone (ACZ-8)',    river: 'Varada' },
  { id: 'gadag',            name: 'Gadag',                        displayName: 'Gadag',            lat: 15.4315, lng: 75.6355, elevation: 650,  zone: 'Northern Dry Zone (ACZ-3)',           river: 'Tungabhadra Basin' },
  { id: 'bagalkot',         name: 'Bagalkot (Ghataprabha Basin)', displayName: 'Bagalkot',         lat: 16.1691, lng: 75.6615, elevation: 535,  zone: 'Northern Dry Zone (ACZ-3)',           river: 'Ghataprabha' },
  { id: 'vijayapura',       name: 'Vijayapura (Bijapur)',         displayName: 'Vijayapura',       lat: 16.8302, lng: 75.7100, elevation: 592,  zone: 'Northern Dry Zone (ACZ-3)',           river: 'Bhima' },
  { id: 'kalaburagi',       name: 'Kalaburagi (Gulbarga)',        displayName: 'Kalaburagi',       lat: 17.3297, lng: 76.8343, elevation: 454,  zone: 'North Eastern Dry Zone (ACZ-2)',      river: 'Kallamma' },
  { id: 'yadgir',           name: 'Yadgir',                       displayName: 'Yadgir',           lat: 16.7697, lng: 77.1388, elevation: 420,  zone: 'North Eastern Dry Zone (ACZ-2)',      river: 'Krishna' },
  { id: 'koppal',           name: 'Koppal',                       displayName: 'Koppal',           lat: 15.3500, lng: 76.1550, elevation: 505,  zone: 'North Eastern Dry Zone (ACZ-2)',      river: 'Tungabhadra' },
  { id: 'raichur',          name: 'Raichur',                      displayName: 'Raichur',          lat: 16.2010, lng: 77.3566, elevation: 408,  zone: 'North Eastern Dry Zone (ACZ-2)',      river: 'Krishna / Tungabhadra' },
  { id: 'bidar',            name: 'Bidar',                        displayName: 'Bidar',            lat: 17.9104, lng: 77.5199, elevation: 665,  zone: 'North Eastern Dry Zone (ACZ-2)',      river: 'Manjra' },
  { id: 'vijayanagara',     name: 'Vijayanagara',                 displayName: 'Vijayanagara',     lat: 15.3167, lng: 76.4600, elevation: 520,  zone: 'North Eastern Dry Zone (ACZ-2)',      river: 'Tungabhadra' },
];
