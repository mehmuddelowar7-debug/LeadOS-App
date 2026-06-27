import puppeteer from 'puppeteer';

(async () => {
  console.log("Starting browser...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  console.log("Navigating to local prod server...");
  // Assuming a local server is running on 4173 (vite preview)
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle2' });
  
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
  console.log("Root HTML snippet:", rootHtml?.substring(0, 200));
  
  await browser.close();
})();
