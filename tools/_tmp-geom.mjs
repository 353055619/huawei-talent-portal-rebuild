import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('file:///Users/godw/GodwGarage/sandbox/高校人才/replica/learning-all.html', { waitUntil: 'load' });
await page.waitForTimeout(1400);
await page.evaluate(() => { const c = document.querySelector('.cookie-close'); if (c) c.click(); });
const data = await page.evaluate(() => {
  const r = (sel) => { const el = document.querySelector(sel); const b = el.getBoundingClientRect(); return [Math.round(b.top + window.scrollY), Math.round(b.height)]; };
  const col3 = document.querySelectorAll('.com-footer-content-left ul')[2];
  return { foot: r('.com-footer-wrapper'), fcontent: r('.com-footer-content'), fbot: r('.footer-bottom'),
    col3: [Math.round(col3.getBoundingClientRect().top + window.scrollY), Math.round(col3.getBoundingClientRect().height)],
    bodyH: document.body.scrollHeight };
});
console.log(JSON.stringify(data));
await browser.close();
