// scripts/mobile-check.js
// Run this script locally to capture screenshots of the generator page in several mobile viewports.
// Usage:
// 1. Install Playwright (first time):
//    pnpm add -D playwright
// 2. Install browsers:
//    npx playwright install
// 3. Run the script:
//    node ./scripts/mobile-check.js

const fs = require('fs')
const path = require('path')

(async () => {
  try {
    const { chromium, devices } = require('playwright')

    const url = process.env.URL || 'http://localhost:3000/dashboard/generator'
    const outDir = path.join(__dirname, 'screenshots')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

    const browser = await chromium.launch()

    const viewports = [
      { name: 'iphone-12', device: devices['iPhone 12'] },
      { name: 'pixel-5', device: devices['Pixel 5'] },
      { name: 'mobile-small', viewport: { width: 360, height: 800, deviceScaleFactor: 2 } },
      { name: 'tablet', viewport: { width: 768, height: 1024, deviceScaleFactor: 2 } },
    ]

    for (const v of viewports) {
      const context = v.device
        ? await browser.newContext({ ...v.device })
        : await browser.newContext({ viewport: v.viewport })

      const page = await context.newPage()
      console.log(`Loading ${url} with ${v.name}...`)
      await page.goto(url, { waitUntil: 'networkidle' })

      // wait a little to allow client JS to render dynamic content
      await page.waitForTimeout(500)

      const file = path.join(outDir, `generator-${v.name}.png`)
      await page.screenshot({ path: file, fullPage: true })
      console.log(`Saved: ${file}`)

      await context.close()
    }

    await browser.close()
    console.log('Mobile layout check complete. Screenshots in scripts/screenshots/')
  } catch (err) {
    console.error('Error running mobile-check script:', err)
    console.error('Make sure you installed Playwright and the browsers: pnpm add -D playwright && npx playwright install')
    process.exit(1)
  }
})()
