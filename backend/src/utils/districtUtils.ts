/**
 * Karnataka 31 Districts Canonical Normalization Utility
 * Ensures consistent district ID resolution across database queries, APIs, and GeoJSON.
 */

export const DISTRICT_CANONICAL_MAP: Record<string, string> = {
  bagalkote: 'bagalkot',
  bagalkot: 'bagalkot',
  ballari: 'ballari',
  bellary: 'ballari',
  belagavi: 'belagavi',
  belgaum: 'belagavi',
  bengaluru_rural: 'bengaluru_rural',
  bangalore_rural: 'bengaluru_rural',
  bengaluru_urban: 'bengaluru_urban',
  bangalore_urban: 'bengaluru_urban',
  bidar: 'bidar',
  chamarajanagar: 'chamarajanagar',
  chamarajanagara: 'chamarajanagar',
  chikkaballapura: 'chikkaballapura',
  chikkaballapur: 'chikkaballapura',
  chickballapur: 'chikkaballapura',
  chikkamagaluru: 'chikkamagaluru',
  chikmagalur: 'chikkamagaluru',
  chitradurga: 'chitradurga',
  dakshina_kannada: 'dakshina_kannada',
  south_canara: 'dakshina_kannada',
  mangaluru: 'dakshina_kannada',
  davangere: 'davangere',
  davanagere: 'davangere',
  dharwad: 'dharwad',
  gadag: 'gadag',
  hassan: 'hassan',
  haveri: 'haveri',
  kalaburagi: 'kalaburagi',
  gulbarga: 'kalaburagi',
  kodagu: 'kodagu',
  coorg: 'kodagu',
  kolar: 'kolar',
  koppal: 'koppal',
  mandya: 'mandya',
  mysuru: 'mysuru',
  mysore: 'mysuru',
  raichur: 'raichur',
  ramanagara: 'ramanagara',
  ramnagara: 'ramanagara',
  shivamogga: 'shivamogga',
  shimoga: 'shivamogga',
  tumakuru: 'tumakuru',
  tumkur: 'tumakuru',
  udupi: 'udupi',
  uttara_kannada: 'uttara_kannada',
  north_canara: 'uttara_kannada',
  karwar: 'uttara_kannada',
  vijayapura: 'vijayapura',
  bijapur: 'vijayapura',
  vijayanagara: 'vijayanagara',
  hospet: 'vijayanagara',
  yadgir: 'yadgir',
  yadagiri: 'yadgir',
};

export const ALL_31_DISTRICT_IDS: string[] = [
  'bagalkot', 'ballari', 'belagavi', 'bengaluru_rural', 'bengaluru_urban',
  'bidar', 'chamarajanagar', 'chikkaballapura', 'chikkamagaluru', 'chitradurga',
  'dakshina_kannada', 'davangere', 'dharwad', 'gadag', 'hassan',
  'haveri', 'kalaburagi', 'kodagu', 'kolar', 'koppal',
  'mandya', 'mysuru', 'raichur', 'ramanagara', 'shivamogga',
  'tumakuru', 'udupi', 'uttara_kannada', 'vijayapura', 'vijayanagara', 'yadgir'
];

export const DISTRICT_GEO_KEY_MAP: Record<string, string> = {
  bagalkot: 'Bagalkot (Ghataprabha Basin)',
  ballari: 'Ballari (Bellary)',
  belagavi: 'Belagavi (Belgaum)',
  bengaluru_rural: 'Bengaluru Rural',
  bengaluru_urban: 'Bengaluru Urban',
  bidar: 'Bidar',
  chamarajanagar: 'Chamarajanagar',
  chikkaballapura: 'Chikkaballapura',
  chikkamagaluru: 'Chikkamagaluru',
  chitradurga: 'Chitradurga',
  dakshina_kannada: 'Dakshina Kannada (Mangaluru)',
  davangere: 'Davangere',
  dharwad: 'Dharwad (Hubballi-Dharwad)',
  gadag: 'Gadag',
  hassan: 'Hassan',
  haveri: 'Haveri',
  kalaburagi: 'Kalaburagi (Gulbarga)',
  kodagu: 'Kodagu (Coorg)',
  kolar: 'Kolar',
  koppal: 'Koppal',
  mandya: 'Mandya (Cauvery Basin)',
  mysuru: 'Mysuru (Mysore)',
  raichur: 'Raichur (Doab Basin)',
  ramanagara: 'Ramanagara',
  shivamogga: 'Shivamogga (Shimoga)',
  tumakuru: 'Tumakuru (Tumkur)',
  udupi: 'Udupi',
  uttara_kannada: 'Uttara Kannada (Karwar)',
  vijayapura: 'Vijayapura (Bijapur)',
  vijayanagara: 'Vijayanagara (Hospet)',
  yadgir: 'Yadgir'
};

export function canonicalDistrictId(rawId?: string | null): string {
  if (!rawId || typeof rawId !== 'string') return 'bengaluru_urban';
  const norm = rawId.toLowerCase().trim().replace(/[\s-]+/g, '_');
  return DISTRICT_CANONICAL_MAP[norm] || norm;
}

export function getDistrictGeoKey(rawId?: string | null): string {
  const canon = canonicalDistrictId(rawId);
  return DISTRICT_GEO_KEY_MAP[canon] || 'Bengaluru Urban';
}
