const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function verify() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  console.log('Navigating to Flood Map...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  // Click on Flood Map tab in Header
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const mapBtn = buttons.find(b => b.textContent && b.textContent.includes('Flood Map'));
    if (mapBtn) mapBtn.click();
  });

  // 1. Wait for selector button
  const selectorBtn = await page.waitForSelector('button[aria-label="Select Karnataka District"]', { timeout: 10000 });

  const buttonTextBefore = await page.evaluate(el => el.textContent, selectorBtn);
  console.log('1. Selector Button Text:', buttonTextBefore);

  // 2. Click selector button to open dropdown
  await selectorBtn.click();
  await page.waitForSelector('.divide-y button', { timeout: 5000 });

  const count = await page.evaluate(() => document.querySelectorAll('.divide-y button').length);
  const sample = await page.evaluate(() => 
    Array.from(document.querySelectorAll('.divide-y button')).map(b => b.innerText.trim().replace(/\n/g, ' - '))
  );

  console.log(`2. Dropdown rendered district count: ${count}`);
  console.log('   First 5 districts in list:', sample.slice(0, 5));
  console.log('   Last 5 districts in list:', sample.slice(-5));

  // 3. Test selecting a district (e.g., Bengaluru Urban)
  console.log('3. Selecting "Bengaluru Urban"...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.divide-y button'));
    const bu = buttons.find(b => b.textContent && b.textContent.includes('Bengaluru Urban'));
    if (bu) bu.click();
  });

  await new Promise(r => setTimeout(r, 1500));
  const buttonTextAfter = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Select Karnataka District"]');
    return btn ? btn.textContent : null;
  });
  console.log('   Selector Button Text after click:', buttonTextAfter);

  // 4. Check console errors
  const errors = consoleLogs.filter(l => l.startsWith('[error]'));
  console.log(`4. Total console errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('   Errors found:', errors);
  }

  await browser.close();
  console.log('[✓] Verification script finished successfully.');
}

verify().catch(e => {
  console.error('Verification error:', e);
  process.exit(1);
});
