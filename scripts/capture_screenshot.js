const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function capture() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const outputDir = path.resolve(__dirname, '..', 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('Launching browser with Edge executable...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  console.log('Navigating to http://localhost:3000/#map ...');
  await page.goto('http://localhost:3000/#map', { waitUntil: 'networkidle2', timeout: 30000 });

  // Ensure Flood Map tab is active
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const mapBtn = buttons.find(b => b.textContent && b.textContent.includes('Flood Map'));
    if (mapBtn) mapBtn.click();
  });

  // 1. Ensure dark mode is active and capture
  const isCurrentlyDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isCurrentlyDark) {
    await page.click('button[aria-label="Toggle theme"]');
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('Waiting 4 seconds for map tiles and vector hexes in dark mode...');
  await new Promise(r => setTimeout(r, 4000));

  const darkPath = path.join(outputDir, 'flood_map_dark.png');
  await page.screenshot({ path: darkPath, type: 'png' });
  console.log('[✓] Dark mode screenshot saved to:', darkPath);

  // 2. Click theme toggle button to switch to light mode
  console.log('Toggling to light mode...');
  await page.click('button[aria-label="Toggle theme"]');
  console.log('Waiting 4 seconds for map tiles in light mode...');
  await new Promise(r => setTimeout(r, 4000));

  const lightPath = path.join(outputDir, 'flood_map_light.png');
  await page.screenshot({ path: lightPath, type: 'png' });
  console.log('[✓] Light mode screenshot saved to:', lightPath);


  // 3. Inspect selector district count from DOM
  const selectorInfo = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Select Karnataka District"]');
    if (btn) btn.click();
    return {
      buttonText: btn ? btn.textContent : null,
      districtItemsCount: document.querySelectorAll('.divide-y button').length
    };
  });
  console.log('[*] District selector info:', JSON.stringify(selectorInfo));

  console.log('[*] Console errors detected during session:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }

  await browser.close();
  console.log('Done capturing all verification artifacts.');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
