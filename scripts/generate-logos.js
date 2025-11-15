#!/usr/bin/env node
"use strict"
const fs = require('fs').promises
const path = require('path')

async function main() {
  const sharp = require('sharp')
  const repoRoot = path.resolve(__dirname, '..')
  const logosDir = path.join(repoRoot, 'public', 'logos')
  const outDir = path.join(logosDir, 'pngs')
  await fs.mkdir(outDir, { recursive: true })

  const entries = await fs.readdir(logosDir)
  const svgs = entries.filter(n => n.endsWith('.svg') && n.startsWith('logo-o-new'))
  if (svgs.length === 0) {
    console.error('No logo SVGs found in', logosDir)
    process.exit(1)
  }

  const sizes = [32, 48, 128, 256, 512]

  for (const svgName of svgs) {
    const svgPath = path.join(logosDir, svgName)
    const svgBuffer = await fs.readFile(svgPath)
    const base = path.basename(svgName, '.svg')
    for (const size of sizes) {
      const outName = `${base}-${size}.png`
      const outPath = path.join(outDir, outName)
      try {
        await sharp(svgBuffer)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png({ compressionLevel: 9 })
          .toFile(outPath)
        console.log('Wrote', outPath)
      } catch (err) {
        console.error('Failed to render', svgName, '->', outName, err)
      }
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
