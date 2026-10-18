const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

let browserPath = edgePaths.find(p => fs.existsSync(p));
if (!browserPath) {
  console.error('No Edge or Chrome found');
  process.exit(1);
}

const outDir = path.join(__dirname, '..');

const shots = [
  { name: 'screenshot_desktop_light.png', width: 1440, height: 900, url: 'http://localhost:3000/#map' },
  { name: 'screenshot_desktop_dark.png', width: 1440, height: 900, url: 'http://localhost:3000/#map' },
  { name: 'screenshot_mobile.png', width: 390, height: 844, url: 'http://localhost:3000/#map' }
];

for (const s of shots) {
  const outFile = path.join(outDir, s.name);
  console.log(`Capturing ${s.name}...`);
  try {
    const cmd = `"${browserPath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --virtual-time-budget=4000 --window-size=${s.width},${s.height} --screenshot="${outFile}" "${s.url}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Saved ${outFile}`);
  } catch (e) {
    console.error(`Error capturing ${s.name}:`, e.message);
  }
}
