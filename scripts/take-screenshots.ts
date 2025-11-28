import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'

const SCREENSHOTS_DIR = path.join(process.cwd(), 'presentation/screenshots')

async function takeScreenshots() {
  // Ensure directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  const pages = [
    { url: 'http://localhost:3000', name: 'home' },
    { url: 'http://localhost:3000/search', name: 'search' },
    { url: 'http://localhost:3000/trending', name: 'trending' },
    { url: 'http://localhost:3000/lists', name: 'lists' },
  ]

  for (const p of pages) {
    try {
      console.log(`Taking screenshot of ${p.name}...`)
      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 30000 })
      await new Promise(r => setTimeout(r, 1500)) // Wait for animations
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${p.name}.png`),
        fullPage: false
      })
      console.log(`  ✓ ${p.name}.png`)
    } catch (error) {
      console.error(`  ✗ Failed to capture ${p.name}:`, error)
    }
  }

  await browser.close()
  console.log('\nDone! Screenshots saved to presentation/screenshots/')
}

takeScreenshots().catch(console.error)
