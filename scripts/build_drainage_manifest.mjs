import fs from 'fs';

const filePath = 'C:/Users/Pavan/.gemini/antigravity-ide/brain/6b4950e7-3364-4c9c-aadc-00e0c4d1e4a1/.system_generated/steps/4249/content.md';
const text = fs.readFileSync(filePath, 'utf8');

// Match resource items in CKAN markup
const resourceRegex = /<li class="resource-item"[^>]*>([\s\S]*?)<\/li>/g;
let match;
const rawResources = [];

while ((match = resourceRegex.exec(text)) !== null) {
  const block = match[1];
  const titleMatch = block.match(/title="([^"]+)"/);
  const hrefMatch = block.match(/href="([^"]+)"/);
  if (titleMatch && hrefMatch) {
    const resourceId = hrefMatch[1].split('/').pop();
    rawResources.push({
      title: titleMatch[1],
      resourceId,
      resourcePageUrl: `https://data.opencity.in${hrefMatch[1]}`
    });
  }
}

// Canonical 31 Karnataka Districts mapping
const DISTRICT_MAP = [
  { id: 'bagalkot', search: ['bagalkot', 'bagalkote'], name: 'Bagalkot' },
  { id: 'ballari', search: ['ballari', 'bellary'], name: 'Ballari' },
  { id: 'belagavi', search: ['belagavi', 'belgaum'], name: 'Belagavi' },
  { id: 'bengaluru_rural', search: ['bengaluru rural', 'bangalore rural'], name: 'Bengaluru Rural' },
  { id: 'bengaluru_urban', search: ['bengaluru urban', 'bangalore urban'], name: 'Bengaluru Urban' },
  { id: 'bidar', search: ['bidar'], name: 'Bidar' },
  { id: 'chamarajanagar', search: ['chamarajanagar', 'chamarajanagara'], name: 'Chamarajanagar' },
  { id: 'chikkaballapura', search: ['chickballapur', 'chikkaballapur', 'chikkaballapura'], name: 'Chikkaballapura' },
  { id: 'chikkamagaluru', search: ['chikkamagaluru', 'chikmagalur'], name: 'Chikkamagaluru' },
  { id: 'chitradurga', search: ['chitradurga'], name: 'Chitradurga' },
  { id: 'dakshina_kannada', search: ['dakshina kannada', 'south canara', 'mangaluru'], name: 'Dakshina Kannada' },
  { id: 'davangere', search: ['davangere', 'davanagere'], name: 'Davanagere' },
  { id: 'dharwad', search: ['dharwad'], name: 'Dharwad' },
  { id: 'gadag', search: ['gadag'], name: 'Gadag' },
  { id: 'hassan', search: ['hassan'], name: 'Hassan' },
  { id: 'haveri', search: ['haveri'], name: 'Haveri' },
  { id: 'kalaburagi', search: ['kalaburagi', 'gulbarga'], name: 'Kalaburagi' },
  { id: 'kodagu', search: ['kodagu', 'coorg'], name: 'Kodagu' },
  { id: 'kolar', search: ['kolar'], name: 'Kolar' },
  { id: 'koppal', search: ['koppal'], name: 'Koppal' },
  { id: 'mandya', search: ['mandya'], name: 'Mandya' },
  { id: 'mysuru', search: ['mysuru', 'mysore'], name: 'Mysuru' },
  { id: 'raichur', search: ['raichur'], name: 'Raichur' },
  { id: 'ramanagara', search: ['ramnagara', 'ramanagara', 'ramanagar'], name: 'Ramanagara' },
  { id: 'shivamogga', search: ['shivamogga', 'shimoga'], name: 'Shivamogga' },
  { id: 'tumakuru', search: ['tumakuru', 'tumkur'], name: 'Tumakuru' },
  { id: 'udupi', search: ['udupi'], name: 'Udupi' },
  { id: 'uttara_kannada', search: ['uttara kannada', 'north canara', 'karwar'], name: 'Uttara Kannada' },
  { id: 'vijayapura', search: ['vijayapura', 'bijapur'], name: 'Vijayapura' },
  { id: 'vijayanagara', search: ['vijayanagara', 'hospet'], name: 'Vijayanagara' },
  { id: 'yadgir', search: ['yadagiri', 'yadgir'], name: 'Yadgir' },
];

const manifest = {};

for (const dist of DISTRICT_MAP) {
  // Find matching raw resource
  const matched = rawResources.find(r => {
    const t = r.title.toLowerCase();
    return dist.search.some(s => t.includes(s));
  });

  manifest[dist.id] = {
    districtId: dist.id,
    districtName: dist.name,
    resourceTitle: matched ? matched.title : null,
    resourceId: matched ? matched.resourceId : null,
    resourcePageUrl: matched ? matched.resourcePageUrl : null,
    cachedFile: `backend/data/drainage_kml/${dist.id}_karnataka.kml`,
    hasLocalCache: fs.existsSync(`backend/data/drainage_kml/${dist.id}_karnataka.kml`) || 
                   (dist.id === 'bengaluru_urban' && fs.existsSync(`backend/data/drainage_kml/bengaluru_all_swds.kml`)),
    source: 'Karnataka Drainage Map / OpenCity.in',
    license: 'Public Domain / Open Government Data'
  };
}

fs.writeFileSync('backend/data/drainage_manifest.json', JSON.stringify(manifest, null, 2));
console.log('Manifest generated successfully with', Object.keys(manifest).length, 'districts.');
const matchedCount = Object.values(manifest).filter(m => m.resourceId).length;
console.log('Districts matched with OpenCity resources:', matchedCount, '/ 31');
