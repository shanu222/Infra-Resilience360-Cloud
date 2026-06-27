import { execSync } from 'node:child_process'
import { cpSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const portalDir = path.join(rootDir, 'modules', 'Disaster Dashboard UX Flow')
const sourceDistDir = path.join(portalDir, 'dist')
const targetDir = path.join(rootDir, 'frontend', 'public', 'disaster-dashboard')
const portalLockFile = path.join(portalDir, 'package-lock.json')

const run = (command, cwd = rootDir) => {
  execSync(command, { cwd, stdio: 'inherit' })
}

// Ensure nested dashboard dependencies exist on clean servers before build.
run(existsSync(portalLockFile) ? 'npm ci' : 'npm install', portalDir)
run('npm run build', portalDir)

if (!existsSync(sourceDistDir)) {
  throw new Error(`Build output not found at ${sourceDistDir}`)
}

if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true })
}

cpSync(sourceDistDir, targetDir, { recursive: true })
console.log(`Disaster Dashboard synced to ${targetDir}`)
