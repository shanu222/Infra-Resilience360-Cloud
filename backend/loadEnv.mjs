/**
 * Load only backend-local `.env` before any server modules read `process.env`.
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendEnv = path.resolve(__dirname, '.env')
if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv })
} else {
  console.warn('[env] backend/.env not found. Create backend/.env with PORT=10000 and required keys.')
}
