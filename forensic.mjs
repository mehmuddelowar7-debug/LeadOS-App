import puppeteer from 'puppeteer';

(async () => {
  console.log("Starting browser...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type().toUpperCase(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  console.log("Navigating to local prod server...");
  const response = await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  
  console.log("HTTP Status:", response?.status());
  
  // 1. Check HTML
  const rootExists = await page.evaluate(() => !!document.getElementById('root'));
  console.log("Root div exists:", rootExists);
  
  // 2. Check DOM inside #root
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
  console.log("Root innerHTML length:", rootHtml?.length);
  console.log("Root innerHTML snippet:", rootHtml?.substring(0, 500));
  
  // 3. Check CSS of #root and its first child
  const cssStyles = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return null;
    const computed = window.getComputedStyle(root);
    const child = root.firstElementChild;
    const childComputed = child ? window.getComputedStyle(child) : null;
    
    return {
      root: {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        height: computed.height,
        position: computed.position
      },
      child: child ? {
        tagName: child.tagName,
        id: child.id,
        className: child.className,
        display: childComputed?.display,
        visibility: childComputed?.visibility,
        opacity: childComputed?.opacity,
        height: childComputed?.height,
        position: childComputed?.position
      } : null
    };
  });
  console.log("CSS Styles:", JSON.stringify(cssStyles, null, 2));

  // 4. Check active route
  const currentUrl = await page.url();
  console.log("Final URL:", currentUrl);

  await browser.close();
})();
