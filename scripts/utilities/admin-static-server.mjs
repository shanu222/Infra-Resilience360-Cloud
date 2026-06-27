/**
 * Static-only dev helper (`npm run start:admin`). Production must use `npm start`
 * so Express serves `/api/*` + `dist/` together — see `backend/index.mjs`.
 */
import express from 'express'
import path from 'node:path'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.resolve(__dirname, '..', '..')
const distPath = path.join(repoRoot, 'dist')

console.log('=== ADMIN SERVER START ===')
console.log('Working dir:', process.cwd())
console.log('Resolved distPath:', distPath)

if (!fs.existsSync(distPath)) {
  console.error('dist folder NOT FOUND at:', distPath)
} else {
  console.log('dist folder found')
  try {
    console.log('Files in dist:', fs.readdirSync(distPath))
  } catch (e) {
    console.error('Could not list dist:', e)
  }
}

app.get('/health', (req, res) => {
  res.status(200).send('ok')
})

// index: false so GET / does not auto-serve index.html; fallback can prefer admin.html
app.use(
  express.static(distPath, {
    index: false,
  }),
)

// Express 5: path "*" is invalid; use named wildcard (see path-to-regexp v8)
app.get('/{*path}', (req, res) => {
  try {
    const adminPath = path.join(distPath, 'admin.html')
    const indexPath = path.join(distPath, 'index.html')

    if (fs.existsSync(adminPath)) {
      console.log('Serving admin.html for', req.path)
      return res.sendFile(path.resolve(adminPath))
    }

    if (fs.existsSync(indexPath)) {
      console.log('Serving index.html for', req.path)
      return res.sendFile(path.resolve(indexPath))
    }

    console.error('No HTML files found in dist')
    return res.status(500).send('Build files missing')
  } catch (err) {
    console.error('Error serving fallback:', err)
    res.status(500).send('Server error')
  }
})

const PORT = Number(process.env.PORT) || 10000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Admin server running on port ${PORT}`)
  console.log('PORT env =', process.env.PORT)
})
