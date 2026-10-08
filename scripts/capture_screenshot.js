const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function capture() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const outputDir = path.resolve(__dirname, '..', 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'flood_map.png');

  console.log('Launching browser with Edge executable...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log('Navigating to http://127.0.0.1:3000 ...');
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Give Leaflet map tiles and Recharts animation time to settle
  console.log('Waiting 5 seconds for tiles, radar, and charts to settle...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Capturing screenshot buffer...');
  const buffer = await page.screenshot({ fullPage: false, type: 'png' });
  
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  console.log('Written to:', outputPath, 'Bytes:', buffer.length);

  await browser.close();
  console.log('Done! Screenshot saved successfully to:', outputPath);
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
