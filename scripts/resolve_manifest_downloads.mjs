import fs from 'fs';

const manifestPath = 'backend/data/drainage_manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

async function resolveDirectLinks() {
  console.log('Resolving direct download links for 31 districts...');
  const results = {};

  for (const [distId, item] of Object.entries(manifest)) {
    if (!item.resourceId) {
      console.log(`District ${distId}: No OpenCity resource ID`);
      results[distId] = { ...item, downloadUrl: null };
      continue;
    }

    try {
      const pageUrl = item.resourcePageUrl;
      const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        console.warn(`District ${distId}: HTTP ${res.status}`);
        results[distId] = { ...item, downloadUrl: null };
        continue;
      }
      const html = await res.text();
      const m = html.match(/href="([^"]+\.kml[^"]*)"/i) || html.match(/class="[^"]*resource-url-analytics[^"]*"[^>]*href="([^"]+)"/i);
      const downloadUrl = m ? m[1] : null;
      console.log(`District ${distId} (${item.districtName}): ${downloadUrl ? 'OK' : 'Not found'}`);
      results[distId] = {
        ...item,
        downloadUrl
      };
    } catch (err) {
      console.error(`District ${distId} error:`, err.message);
      results[distId] = { ...item, downloadUrl: null };
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  const resolvedCount = Object.values(results).filter(r => r.downloadUrl).length;
  console.log(`Successfully resolved ${resolvedCount} / 31 direct KML download URLs.`);
}

resolveDirectLinks();
