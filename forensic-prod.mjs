import puppeteer from 'puppeteer';

(async () => {
  console.log("Starting browser...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PROD PAGE LOG:', msg.type().toUpperCase(), msg.text()));
  page.on('pageerror', error => console.log('PROD PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('PROD REQUEST FAILED:', request.url(), request.failure()?.errorText));

  console.log("Navigating to actual Vercel prod server...");
  const response = await page.goto('https://lead-os-6h61cpdek-mehmuddelowar7-2540s-projects.vercel.app', { waitUntil: 'networkidle0' });
  
  console.log("HTTP Status:", response?.status());
  
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
  console.log("Root innerHTML length:", rootHtml?.length);
  console.log("Root innerHTML snippet:", rootHtml?.substring(0, 500));
  
  await browser.close();
})();
