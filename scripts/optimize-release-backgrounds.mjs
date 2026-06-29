/**
 * Encode oversized portal/shell background PNGs as WebP for smaller APK assets.
 * Run: node scripts/optimize-release-backgrounds.mjs
 */
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { stat } from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

/** @type {{ input: string; output?: string; quality?: number }[]} */
const targets = [
  {
    input: 'frontend/src/assets/backgrounds/smart_construction_bg.png',
    output: 'frontend/src/assets/backgrounds/smart_construction_bg.webp',
    quality: 85,
  },
  {
    input: 'frontend/public/retrofit-calculator/background.png',
    output: 'frontend/public/retrofit-calculator/background.webp',
    quality: 85,
  },
  {
    input: 'frontend/public/pgbc/background image.png',
    output: 'frontend/public/pgbc/background image.webp',
    quality: 85,
  },
]

for (const target of targets) {
  const inputPath = path.join(root, target.input)
  const outputPath = path.join(root, target.output ?? target.input.replace(/\.png$/i, '.webp'))
  const quality = target.quality ?? 85
  await sharp(inputPath).webp({ quality, effort: 4 }).toFile(outputPath)
  const inBytes = (await stat(inputPath)).size
  const outBytes = (await stat(outputPath)).size
  console.log(
    `Wrote ${path.relative(root, outputPath)} (${Math.round(outBytes / 1024)} KB, was ${Math.round(inBytes / 1024)} KB PNG)`,
  )
}
