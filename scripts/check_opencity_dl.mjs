import fs from 'fs';

async function checkDownload() {
  const url = 'https://data.opencity.in/dataset/karnataka-drainage-map/resource/5c9121cf-981e-4b20-a06a-e23318de49c7';
  const res = await fetch(url);
  const html = await res.text();
  
  // Find download button/link
  const match = html.match(/href="([^"]+)"[^>]*class="[^"]*btn-primary[^"]*"/i) || 
                html.match(/<a[^>]*href="([^"]+)"[^>]*>\s*<i[^>]*><\/i>\s*Download/i) ||
                html.match(/class="[^"]*resource-url-analytics[^"]*"[^>]*href="([^"]+)"/i);
                
  console.log('Resource page download match:', match ? match[1] : 'Not found');
  
  // Look for direct .kml links in the html
  const kmlMatches = [...html.matchAll(/href="([^"]+\.kml[^"]*)"/gi)];
  console.log('Direct KML links:', kmlMatches.map(m => m[1]));
}

checkDownload();
