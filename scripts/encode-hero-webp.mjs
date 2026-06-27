/**
 * One-shot: encode public/app-background.webp from PNG for faster LCP.
 * Run: node scripts/encode-hero-webp.mjs
 */
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const input = path.join(root, 'public', 'app-background.png')
const output = path.join(root, 'public', 'app-background.webp')

await sharp(input).webp({ quality: 82, effort: 4 }).toFile(output)
console.log('Wrote', output)
