import puppeteer from 'puppeteer'
import path from 'path'

async function htmlToPdf() {
  const htmlPath = path.join(process.cwd(), 'presentation/waxfeed-deck.html')
  const pdfPath = path.join(process.cwd(), 'presentation/waxfeed-deck.pdf')

  console.log('Launching browser...')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  // Set viewport to 16:9 aspect ratio (standard presentation)
  await page.setViewport({ width: 1920, height: 1080 })

  console.log('Loading HTML...')
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle2' })

  // Inject CSS to remove any white borders/backgrounds
  await page.addStyleTag({
    content: `
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        background: #0a0a0a !important;
      }
      .bespoke-marp-parent {
        background: #0a0a0a !important;
      }
      @media print {
        body, html {
          background: #0a0a0a !important;
        }
      }
    `
  })

  // Wait for fonts to load
  await new Promise(r => setTimeout(r, 2000))

  console.log('Generating PDF...')
  await page.pdf({
    path: pdfPath,
    width: '1920px',
    height: '1080px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true
  })

  await browser.close()
  console.log(`PDF saved to: ${pdfPath}`)
}

htmlToPdf().catch(console.error)
