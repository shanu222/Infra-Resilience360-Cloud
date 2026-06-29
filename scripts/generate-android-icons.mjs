/**
 * Generate Android mipmap launcher icons from the official app logo.
 * Run: node scripts/generate-android-icons.mjs
 */
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const source = path.join(root, 'frontend', 'public', 'assets', 'branding', 'app-logo.png')
const resRoot = path.join(root, 'android', 'app', 'src', 'main', 'res')

const densities = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
}

const input = sharp(source)
const meta = await input.metadata()
console.log(`Source ${path.relative(root, source)} (${meta.width}x${meta.height})`)

for (const [folder, size] of Object.entries(densities)) {
  const dir = path.join(resRoot, folder)
  await mkdir(dir, { recursive: true })
  const out = path.join(dir, 'ic_launcher.png')
  const outRound = path.join(dir, 'ic_launcher_round.png')
  const outFg = path.join(dir, 'ic_launcher_foreground.png')
  await input.clone().resize(size, size, { fit: 'cover' }).png({ compressionLevel: 9 }).toFile(out)
  await input.clone().resize(size, size, { fit: 'cover' }).png({ compressionLevel: 9 }).toFile(outRound)
  await input
    .clone()
    .resize(Math.round(size * 0.72), Math.round(size * 0.72), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: Math.round(size * 0.14),
      bottom: Math.round(size * 0.14),
      left: Math.round(size * 0.14),
      right: Math.round(size * 0.14),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(outFg)
  console.log(`Wrote ${folder} @ ${size}px`)
}

const monoDir = path.join(resRoot, 'drawable')
await mkdir(monoDir, { recursive: true })
await input
  .clone()
  .resize(108, 108, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(path.join(monoDir, 'ic_launcher_monochrome.png'))

const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>
</adaptive-icon>
`
for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  await writeFile(path.join(resRoot, 'mipmap-anydpi-v26', name), adaptive, 'utf8')
}

console.log('Android launcher icons updated.')
