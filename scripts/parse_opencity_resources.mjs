import fs from 'fs';

const filePath = 'C:/Users/Pavan/.gemini/antigravity-ide/brain/6b4950e7-3364-4c9c-aadc-00e0c4d1e4a1/.system_generated/steps/4249/content.md';
const text = fs.readFileSync(filePath, 'utf8');

// Match resource items in CKAN markup
const resourceRegex = /<li class="resource-item"[^>]*>([\s\S]*?)<\/li>/g;
let match;
const items = [];

while ((match = resourceRegex.exec(text)) !== null) {
  const block = match[1];
  const titleMatch = block.match(/title="([^"]+)"/);
  const hrefMatch = block.match(/href="([^"]+)"/);
  const formatMatch = block.match(/data-format="([^"]+)"/);
  items.push({
    title: titleMatch ? titleMatch[1] : 'Unknown',
    href: hrefMatch ? hrefMatch[1] : '',
    format: formatMatch ? formatMatch[1] : ''
  });
}

console.log('Total resource items found:', items.length);
console.log(JSON.stringify(items, null, 2));
