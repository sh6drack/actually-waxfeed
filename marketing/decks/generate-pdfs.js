const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const files = ['college-radio-pitch', 'financials-traction', 'growth-strategy', 'investor-pitch'];

  for (const name of files) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await page.goto(`file://${__dirname}/${name}.html`);
    await page.waitForTimeout(1000);

    const slideCount = await page.evaluate(() => {
      return document.querySelectorAll('svg[data-marpit-svg]').length;
    });

    const imgDir = path.join(__dirname, `${name}-slides`);
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

    for (let i = 0; i < slideCount; i++) {
      // Navigate to slide using keyboard
      if (i > 0) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(100);
      }

      await page.screenshot({
        path: path.join(imgDir, `slide-${String(i).padStart(3, '0')}.png`),
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      });
    }

    execSync(`magick ${imgDir}/slide-*.png -quality 100 -density 150 ${name}.pdf`);
    fs.rmSync(imgDir, { recursive: true });

    console.log(`${name}.pdf (${slideCount} slides)`);
    await context.close();
  }

  await browser.close();
})();
