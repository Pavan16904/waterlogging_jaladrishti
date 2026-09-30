/**
 * Karnataka 31-District Agro-Pedological Matrix
 * 
 * Maps every Karnataka district to its scientifically verified indigenous soil series
 * and primary commercial & staple agricultural crops grown within that district.
 */

export interface DistrictAgriProfile {
  name: string;
  zone: string;
  defaultSoil: string;
  soils: string[];
  defaultCrop: string;
  crops: string[];
}

export const KARNATAKA_DISTRICT_AGRI: Record<string, DistrictAgriProfile> = {
  "Bengaluru Urban": {
    name: "Bengaluru Urban",
    zone: "Eastern Dry Zone (ACZ-5)",
    defaultSoil: "Red Sandy Loam",
    soils: ["Red Sandy Loam", "Clay Loam"],
    defaultCrop: "Finger Millet (Ragi)",
    crops: [
      "Finger Millet (Ragi)",
      "Tomato",
      "Cabbage",
      "Maize (Corn)",
      "Carrot",
      "French Bean",
      "Spinach (Palak)",
      "Rose (Gulab)",
      "Marigold (Chendu Hoovu)"
    ]
  },
  "Bengaluru Rural": {
    name: "Bengaluru Rural",
    zone: "Eastern Dry Zone (ACZ-5)",
    defaultSoil: "Red Sandy Loam",
    soils: ["Red Sandy Loam", "Gravelly Red Soil", "Clay Loam"],
    defaultCrop: "Finger Millet (Ragi)",
    crops: [
      "Finger Millet (Ragi)",
      "Tomato",
      "Chili (Green/Red)",
      "Mango",
      "Grapes",
      "Mulberry (Sericulture)",
      "Maize (Corn)",
      "Cowpea (Alsande)"
    ]
  },
  "Ramanagara": {
    name: "Ramanagara",
    zone: "Eastern Dry Zone (ACZ-5)",
    defaultSoil: "Red Sandy Loam",
    soils: ["Red Sandy Loam", "Sandy Soil", "Clay Loam"],
    defaultCrop: "Mulberry (Sericulture)",
    crops: [
      "Mulberry (Sericulture)",
      "Finger Millet (Ragi)",
      "Coconut",
      "Mango",
      "Tomato",
      "Banana",
      "Horse Gram (Hurali)"
    ]
  },
  "Kolar": {
    name: "Kolar",
    zone: "Eastern Dry Zone (ACZ-5)",
    defaultSoil: "Red Sandy Loam",
    soils: ["Red Sandy Loam", "Gravelly Red Soil"],
    defaultCrop: "Tomato",
    crops: [
      "Tomato",
      "Potato",
      "Mango",
      "Finger Millet (Ragi)",
      "Mulberry (Sericulture)",
      "Groundnut (Peanut)",
      "French Bean",
      "Carrot"
    ]
  },
  "Chikkaballapura": {
    name: "Chikkaballapura",
    zone: "Eastern Dry Zone (ACZ-5)",
    defaultSoil: "Red Sandy Loam",
    soils: ["Red Sandy Loam", "Gravelly Red Soil", "Sandy Soil"],
    defaultCrop: "Tomato",
    crops: [
      "Tomato",
      "Grapes",
      "Pomegranate",
      "Finger Millet (Ragi)",
      "Mulberry (Sericulture)",
      "Potato",
      "Maize (Corn)",
      "Rose (Gulab)"
    ]
  },
  "Tumakuru (Tumkur)": {
    name: "Tumakuru (Tumkur)",
    zone: "Central Dry Zone (ACZ-4)",
    defaultSoil: "Red Sandy Loam",
    soils: ["Red Sandy Loam", "Gravelly Red Soil", "Medium Black Soil"],
    defaultCrop: "Coconut",
    crops: [
      "Coconut",
      "Finger Millet (Ragi)",
      "Groundnut (Peanut)",
      "Arecanut (Betel Nut)",
      "Castor",
      "Pigeon Pea (Tur/Arhar)",
      "Rice (Paddy)"
    ]
  },
  "Chitradurga": {
    name: "Chitradurga",
    zone: "Central Dry Zone (ACZ-4)",
    defaultSoil: "Gravelly Red Soil",
    soils: ["Gravelly Red Soil", "Deep Black Cotton Soil (Vertisol)", "Medium Black Soil"],
    defaultCrop: "Groundnut (Peanut)",
    crops: [
      "Groundnut (Peanut)",
      "Sunflower",
      "Maize (Corn)",
      "Finger Millet (Ragi)",
      "Onion",
      "Pomegranate",
      "Cotton",
      "Sorghum (Jowar)"
    ]
  },
  "Davangere": {
    name: "Davangere",
    zone: "Central Dry Zone (ACZ-4)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Red Sandy Loam", "Medium Black Soil"],
    defaultCrop: "Maize (Corn)",
    crops: [
      "Maize (Corn)",
      "Rice (Paddy)",
      "Sugarcane",
      "Arecanut (Betel Nut)",
      "Cotton",
      "Sorghum (Jowar)",
      "Sunflower"
    ]
  },
  "Shivamogga (Shimoga)": {
    name: "Shivamogga (Shimoga)",
    zone: "Southern Transition Zone (ACZ-7)",
    defaultSoil: "Laterite (Coastal/Malnad)",
    soils: ["Laterite (Coastal/Malnad)", "Red Laterite", "Clay Loam"],
    defaultCrop: "Arecanut (Betel Nut)",
    crops: [
      "Arecanut (Betel Nut)",
      "Rice (Paddy)",
      "Maize (Corn)",
      "Ginger",
      "Black Pepper (Kari Menasu)",
      "Rubber",
      "Banana"
    ]
  },
  "Chikkamagaluru": {
    name: "Chikkamagaluru",
    zone: "Hilly Zone (ACZ-9) / Western Ghats",
    defaultSoil: "Forest Loam",
    soils: ["Forest Loam", "Laterite (Coastal/Malnad)", "Red Laterite"],
    defaultCrop: "Coffee (Arabica/Robusta)",
    crops: [
      "Coffee (Arabica/Robusta)",
      "Arecanut (Betel Nut)",
      "Black Pepper (Kari Menasu)",
      "Cardamom (Yalakki)",
      "Ginger",
      "Rice (Paddy)",
      "Tea"
    ]
  },
  "Kodagu (Coorg)": {
    name: "Kodagu (Coorg)",
    zone: "Hilly Zone (ACZ-9) / Western Ghats",
    defaultSoil: "Forest Loam",
    soils: ["Forest Loam", "Laterite (Coastal/Malnad)"],
    defaultCrop: "Coffee (Arabica/Robusta)",
    crops: [
      "Coffee (Arabica/Robusta)",
      "Black Pepper (Kari Menasu)",
      "Cardamom (Yalakki)",
      "Rice (Paddy)",
      "Ginger",
      "Sweet Orange (Mosambi)"
    ]
  },
  "Dakshina Kannada (Mangaluru)": {
    name: "Dakshina Kannada (Mangaluru)",
    zone: "Coastal Zone (ACZ-10)",
    defaultSoil: "Laterite (Coastal/Malnad)",
    soils: ["Laterite (Coastal/Malnad)", "Coastal Alluvial"],
    defaultCrop: "Arecanut (Betel Nut)",
    crops: [
      "Arecanut (Betel Nut)",
      "Coconut",
      "Rice (Paddy)",
      "Cashew",
      "Rubber",
      "Black Pepper (Kari Menasu)",
      "Banana"
    ]
  },
  "Udupi": {
    name: "Udupi",
    zone: "Coastal Zone (ACZ-10)",
    defaultSoil: "Coastal Alluvial",
    soils: ["Coastal Alluvial", "Laterite (Coastal/Malnad)"],
    defaultCrop: "Coconut",
    crops: [
      "Coconut",
      "Arecanut (Betel Nut)",
      "Rice (Paddy)",
      "Cashew",
      "Black Pepper (Kari Menasu)",
      "Jasmine (Mallige)"
    ]
  },
  "Uttara Kannada (Karwar)": {
    name: "Uttara Kannada (Karwar)",
    zone: "Coastal Zone (ACZ-10)",
    defaultSoil: "Laterite (Coastal/Malnad)",
    soils: ["Laterite (Coastal/Malnad)", "Coastal Alluvial", "Forest Loam"],
    defaultCrop: "Arecanut (Betel Nut)",
    crops: [
      "Arecanut (Betel Nut)",
      "Coconut",
      "Rice (Paddy)",
      "Cashew",
      "Black Pepper (Kari Menasu)",
      "Cardamom (Yalakki)",
      "Sugarcane"
    ]
  },
  "Hassan": {
    name: "Hassan",
    zone: "Southern Transition Zone (ACZ-7)",
    defaultSoil: "Red Sandy Loam",
    soils: ["Red Sandy Loam", "Red Laterite", "Clay Loam"],
    defaultCrop: "Potato",
    crops: [
      "Potato",
      "Coffee (Arabica/Robusta)",
      "Finger Millet (Ragi)",
      "Maize (Corn)",
      "Sugarcane",
      "Cardamom (Yalakki)",
      "Ginger"
    ]
  },
  "Mandya (Cauvery Basin)": {
    name: "Mandya (Cauvery Basin)",
    zone: "Southern Dry Zone (ACZ-6)",
    defaultSoil: "Red Sandy Loam",
    soils: ["Red Sandy Loam", "Clay Loam", "Saline-Alkaline"],
    defaultCrop: "Sugarcane",
    crops: [
      "Sugarcane",
      "Rice (Paddy)",
      "Coconut",
      "Finger Millet (Ragi)",
      "Mulberry (Sericulture)",
      "Banana",
      "Tomato"
    ]
  },
  "Mysuru (Mysore)": {
    name: "Mysuru (Mysore)",
    zone: "Southern Dry Zone (ACZ-6)",
    defaultSoil: "Red Sandy Loam",
    soils: ["Red Sandy Loam", "Clay Loam", "Red Laterite"],
    defaultCrop: "Sugarcane",
    crops: [
      "Sugarcane",
      "Rice (Paddy)",
      "Finger Millet (Ragi)",
      "Cotton",
      "Tobacco",
      "Banana",
      "Turmeric (Arishina)"
    ]
  },
  "Chamarajanagar": {
    name: "Chamarajanagar",
    zone: "Southern Dry Zone (ACZ-6)",
    defaultSoil: "Red Sandy Loam",
    soils: ["Red Sandy Loam", "Clay Loam"],
    defaultCrop: "Sugarcane",
    crops: [
      "Sugarcane",
      "Rice (Paddy)",
      "Maize (Corn)",
      "Banana",
      "Turmeric (Arishina)",
      "Finger Millet (Ragi)",
      "Cotton"
    ]
  },
  "Belagavi (Belgaum)": {
    name: "Belagavi (Belgaum)",
    zone: "Northern Transition Zone (ACZ-8)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Clay Loam", "Laterite (Coastal/Malnad)"],
    defaultCrop: "Sugarcane",
    crops: [
      "Sugarcane",
      "Soybean",
      "Maize (Corn)",
      "Groundnut (Peanut)",
      "Cotton",
      "Wheat",
      "Sunflower",
      "Chili (Green/Red)"
    ]
  },
  "Dharwad (Hubballi-Dharwad)": {
    name: "Dharwad (Hubballi-Dharwad)",
    zone: "Northern Transition Zone (ACZ-8)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Clay Loam", "Red Sandy Loam"],
    defaultCrop: "Soybean",
    crops: [
      "Soybean",
      "Cotton",
      "Groundnut (Peanut)",
      "Wheat",
      "Chilli (Byadgi)",
      "Chickpea (Bengal Gram)",
      "Sorghum (Jowar)"
    ]
  },
  "Gadag": {
    name: "Gadag",
    zone: "Northern Dry Zone (ACZ-3)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Shallow Black Soil"],
    defaultCrop: "Cotton",
    crops: [
      "Cotton",
      "Sorghum (Jowar)",
      "Groundnut (Peanut)",
      "Sunflower",
      "Chilli (Byadgi)",
      "Onion",
      "Wheat"
    ]
  },
  "Haveri": {
    name: "Haveri",
    zone: "Northern Transition Zone (ACZ-8)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Red Sandy Loam"],
    defaultCrop: "Chilli (Byadgi)",
    crops: [
      "Chilli (Byadgi)",
      "Maize (Corn)",
      "Cotton",
      "Arecanut (Betel Nut)",
      "Groundnut (Peanut)",
      "Soybean",
      "Sugarcane"
    ]
  },
  "Bagalkot (Ghataprabha Basin)": {
    name: "Bagalkot (Ghataprabha Basin)",
    zone: "Northern Dry Zone (ACZ-3)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Shallow Black Soil"],
    defaultCrop: "Sugarcane",
    crops: [
      "Sugarcane",
      "Grapes",
      "Wheat",
      "Sorghum (Jowar)",
      "Sunflower",
      "Pomegranate",
      "Chickpea (Bengal Gram)"
    ]
  },
  "Vijayapura (Bijapur)": {
    name: "Vijayapura (Bijapur)",
    zone: "Northern Dry Zone (ACZ-3)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Shallow Black Soil"],
    defaultCrop: "Pigeon Pea (Tur/Arhar)",
    crops: [
      "Pigeon Pea (Tur/Arhar)",
      "Sorghum (Jowar)",
      "Grapes",
      "Sunflower",
      "Pomegranate",
      "Wheat",
      "Chickpea (Bengal Gram)"
    ]
  },
  "Kalaburagi (Gulbarga)": {
    name: "Kalaburagi (Gulbarga)",
    zone: "North Eastern Dry Zone (ACZ-2)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Shallow Black Soil"],
    defaultCrop: "Pigeon Pea (Tur/Arhar)",
    crops: [
      "Pigeon Pea (Tur/Arhar)",
      "Cotton",
      "Sorghum (Jowar)",
      "Chickpea (Bengal Gram)",
      "Sunflower",
      "Soybean"
    ]
  },
  "Bidar": {
    name: "Bidar",
    zone: "North Eastern Dry Zone (ACZ-2)",
    defaultSoil: "Shallow Black Soil",
    soils: ["Shallow Black Soil", "Deep Black Cotton Soil (Vertisol)", "Red Laterite"],
    defaultCrop: "Soybean",
    crops: [
      "Soybean",
      "Pigeon Pea (Tur/Arhar)",
      "Sorghum (Jowar)",
      "Sugarcane",
      "Black Gram (Urad)",
      "Green Gram (Moong)"
    ]
  },
  "Raichur (Doab Basin)": {
    name: "Raichur (Doab Basin)",
    zone: "North Eastern Dry Zone (ACZ-2)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Red Sandy Loam", "Saline-Alkaline"],
    defaultCrop: "Rice (Paddy)",
    crops: [
      "Rice (Paddy)",
      "Cotton",
      "Groundnut (Peanut)",
      "Sorghum (Jowar)",
      "Chili (Green/Red)",
      "Sunflower"
    ]
  },
  "Koppal": {
    name: "Koppal",
    zone: "Northern Dry Zone (ACZ-3)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Red Sandy Loam"],
    defaultCrop: "Rice (Paddy)",
    crops: [
      "Rice (Paddy)",
      "Sorghum (Jowar)",
      "Groundnut (Peanut)",
      "Cotton",
      "Pomegranate",
      "Maize (Corn)"
    ]
  },
  "Ballari (Bellary)": {
    name: "Ballari (Bellary)",
    zone: "North Eastern Dry Zone (ACZ-2)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Red Sandy Loam"],
    defaultCrop: "Rice (Paddy)",
    crops: [
      "Rice (Paddy)",
      "Cotton",
      "Chili (Green/Red)",
      "Sunflower",
      "Groundnut (Peanut)",
      "Maize (Corn)"
    ]
  },
  "Vijayanagara": {
    name: "Vijayanagara",
    zone: "North Eastern Dry Zone (ACZ-2)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Red Sandy Loam"],
    defaultCrop: "Sugarcane",
    crops: [
      "Sugarcane",
      "Rice (Paddy)",
      "Banana",
      "Maize (Corn)",
      "Cotton",
      "Groundnut (Peanut)"
    ]
  },
  "Yadgir": {
    name: "Yadgir",
    zone: "North Eastern Dry Zone (ACZ-2)",
    defaultSoil: "Deep Black Cotton Soil (Vertisol)",
    soils: ["Deep Black Cotton Soil (Vertisol)", "Shallow Black Soil"],
    defaultCrop: "Pigeon Pea (Tur/Arhar)",
    crops: [
      "Pigeon Pea (Tur/Arhar)",
      "Sorghum (Jowar)",
      "Chickpea (Bengal Gram)",
      "Cotton",
      "Green Gram (Moong)"
    ]
  }
};

/**
 * Normalizes any incoming district string to match our comprehensive dictionary
 */
export function getDistrictProfile(districtName: string): DistrictAgriProfile {
  if (!districtName) return KARNATAKA_DISTRICT_AGRI["Bengaluru Urban"];

  // Exact match
  if (KARNATAKA_DISTRICT_AGRI[districtName]) {
    return KARNATAKA_DISTRICT_AGRI[districtName];
  }

  // Fuzzy match (e.g. "Mysuru" matching "Mysuru (Mysore)" or "Mandya" matching "Mandya (Cauvery Basin)")
  const lower = districtName.toLowerCase();
  for (const [key, profile] of Object.entries(KARNATAKA_DISTRICT_AGRI)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return profile;
    }
    const cleanKey = key.split('(')[0].trim().toLowerCase();
    const cleanInput = lower.split('(')[0].trim();
    if (cleanInput.includes(cleanKey) || cleanKey.includes(cleanInput)) {
      return profile;
    }
  }

  return KARNATAKA_DISTRICT_AGRI["Bengaluru Urban"];
}
