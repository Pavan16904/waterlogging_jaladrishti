const https = require('https');
const fs = require('fs');
const path = require('path');

function clipPolygon(coords, isLeft, splitX) {
  const outputList = [];
  function isInside(p) { return isLeft ? p[0] <= splitX : p[0] >= splitX; }
  function intersection(p1, p2) {
    const t = (splitX - p1[0]) / (p2[0] - p1[0]);
    return [splitX, p1[1] + t * (p2[1] - p1[1])];
  }
  let prev = coords[coords.length - 1];
  for (const curr of coords) {
    if (isInside(curr)) {
      if (!isInside(prev)) outputList.push(intersection(prev, curr));
      outputList.push(curr);
    } else if (isInside(prev)) {
      outputList.push(intersection(prev, curr));
    }
    prev = curr;
  }
  if (outputList.length > 0 && (outputList[0][0] !== outputList[outputList.length - 1][0] || outputList[0][1] !== outputList[outputList.length - 1][1])) {
    outputList.push([outputList[0][0], outputList[0][1]]);
  }
  return outputList;
}

const DISTRICT_ID_MAP = {
  'bidar': { id: 'bidar', name: 'Bidar' },
  'kalaburagi': { id: 'kalaburagi', name: 'Kalaburagi' },
  'belagavi': { id: 'belagavi', name: 'Belagavi' },
  'yadgir': { id: 'yadgir', name: 'Yadgir' },
  'bagalkote': { id: 'bagalkot', name: 'Bagalkot' },
  'bagalkot': { id: 'bagalkot', name: 'Bagalkot' },
  'raichur': { id: 'raichur', name: 'Raichur' },
  'koppal': { id: 'koppal', name: 'Koppal' },
  'gadag': { id: 'gadag', name: 'Gadag' },
  'ballari': { id: 'ballari', name: 'Ballari' },
  'bellary': { id: 'ballari', name: 'Ballari' },
  'dharwad': { id: 'dharwad', name: 'Dharwad' },
  'uttara kannada': { id: 'uttara_kannada', name: 'Uttara Kannada' },
  'haveri': { id: 'haveri', name: 'Haveri' },
  'chitradurga': { id: 'chitradurga', name: 'Chitradurga' },
  'davanagere': { id: 'davangere', name: 'Davanagere' },
  'davangere': { id: 'davangere', name: 'Davanagere' },
  'shivamogga': { id: 'shivamogga', name: 'Shivamogga' },
  'shimoga': { id: 'shivamogga', name: 'Shivamogga' },
  'udupi': { id: 'udupi', name: 'Udupi' },
  'chikkamagaluru': { id: 'chikkamagaluru', name: 'Chikkamagaluru' },
  'chikmagalur': { id: 'chikkamagaluru', name: 'Chikkamagaluru' },
  'chikkaballapura': { id: 'chikkaballapura', name: 'Chikkaballapura' },
  'hassan': { id: 'hassan', name: 'Hassan' },
  'kolar': { id: 'kolar', name: 'Kolar' },
  'bengaluru rural': { id: 'bengaluru_rural', name: 'Bengaluru Rural' },
  'bangalore rural': { id: 'bengaluru_rural', name: 'Bengaluru Rural' },
  'dakshina kannada': { id: 'dakshina_kannada', name: 'Dakshina Kannada' },
  'bengaluru urban': { id: 'bengaluru_urban', name: 'Bengaluru Urban' },
  'bangalore': { id: 'bengaluru_urban', name: 'Bengaluru Urban' },
  'bangalore urban': { id: 'bengaluru_urban', name: 'Bengaluru Urban' },
  'kodagu': { id: 'kodagu', name: 'Kodagu' },
  'chamarajanagara': { id: 'chamarajanagar', name: 'Chamarajanagar' },
  'chamarajanagar': { id: 'chamarajanagar', name: 'Chamarajanagar' },
  'tumakuru': { id: 'tumakuru', name: 'Tumakuru' },
  'tumkur': { id: 'tumakuru', name: 'Tumakuru' },
  'ramanagara': { id: 'ramanagara', name: 'Ramanagara' },
  'mandya': { id: 'mandya', name: 'Mandya' },
  'mysuru': { id: 'mysuru', name: 'Mysuru' },
  'mysore': { id: 'mysuru', name: 'Mysuru' },
  'vijayapura': { id: 'vijayapura', name: 'Vijayapura' },
  'bijapur': { id: 'vijayapura', name: 'Vijayapura' }
};

const url = 'https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states/karnataka.geojson';

https.get(url, (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(raw);
    const newFeatures = [];

    for (const feat of parsed.features) {
      const origName = (feat.properties.district || feat.properties.District || feat.properties.district_name || '').trim();
      const normKey = origName.toLowerCase();
      const mapping = DISTRICT_ID_MAP[normKey];

      if (!mapping) {
        console.warn('Unknown district:', origName);
        continue;
      }

      if (mapping.id === 'ballari') {
        // Split into Ballari (east) and Vijayanagara (west)
        const coords = feat.geometry.coordinates[0];
        const splitX = 76.58;
        const vijRing = clipPolygon(coords, true, splitX);
        const balRing = clipPolygon(coords, false, splitX);

        newFeatures.push({
          type: 'Feature',
          id: 'vijayanagara',
          properties: {
            district_id: 'vijayanagara',
            district_name: 'Vijayanagara'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [vijRing]
          }
        });

        newFeatures.push({
          type: 'Feature',
          id: 'ballari',
          properties: {
            district_id: 'ballari',
            district_name: 'Ballari'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [balRing]
          }
        });
      } else {
        newFeatures.push({
          type: 'Feature',
          id: mapping.id,
          properties: {
            district_id: mapping.id,
            district_name: mapping.name
          },
          geometry: feat.geometry
        });
      }
    }

    const outGeoJson = {
      type: 'FeatureCollection',
      features: newFeatures
    };

    console.log(`Generated Karnataka districts GeoJSON with ${outGeoJson.features.length} features.`);

    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const targetFile = path.join(dataDir, 'karnataka_districts.geojson');
    fs.writeFileSync(targetFile, JSON.stringify(outGeoJson, null, 2), 'utf8');
    console.log(`Saved to ${targetFile}`);

    // Also copy to frontend public directory for frontend static access
    const publicDataDir = path.join(__dirname, '..', 'frontend', 'public', 'data');
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDataDir, 'karnataka_districts.geojson'), JSON.stringify(outGeoJson, null, 2), 'utf8');
    console.log(`Copied to frontend/public/data/karnataka_districts.geojson`);
  });
}).on('error', err => {
  console.error('Failed to download base GeoJSON:', err);
  process.exit(1);
});
