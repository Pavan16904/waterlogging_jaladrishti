import fs from 'fs';
import path from 'path';

async function testFetch() {
  const url = 'https://data.opencity.in/dataset/148679f9-7672-4ffd-9498-e8fd3de3d257/resource/5c9121cf-981e-4b20-a06a-e23318de49c7/download/3169b46a-e31f-4bb2-ab22-a804345fe3f7.kml';
  console.log('Downloading Bengaluru Rural KML from OpenCity...');
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) {
    console.error('Fetch failed with status:', res.status);
    return;
  }
  const text = await res.text();
  console.log('Downloaded size bytes:', text.length);
  console.log('Starts with:', text.slice(0, 150));
  
  // Count placemarks
  const placemarks = text.split('<Placemark').length - 1;
  console.log('Placemarks in KML:', placemarks);
}

testFetch();
