const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const urls = [
    { name: 'dashboard', url: 'http://localhost:3001/admin' },
    { name: 'questions', url: 'http://localhost:3001/admin/questions' },
    { name: 'blueprint', url: 'http://localhost:3001/admin/blueprint' },
    { name: 'results', url: 'http://localhost:3001/admin/results' }
  ];

  for (const {name, url} of urls) {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: `/Users/jasureshonov/Desktop/quest/${name}.png` });
    console.log(`Saved screenshot to ${name}.png`);
  }

  await browser.close();
})();
