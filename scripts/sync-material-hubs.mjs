import { execSync } from 'node:child_process'
import { cpSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const portalDir = path.join(rootDir, 'modules', 'Material Hub Digital Portal')
const sourceDistDir = path.join(portalDir, 'dist')
const targetDir = path.join(rootDir, 'frontend', 'public', 'material-hubs')

const run = (command, cwd = rootDir) => {
  execSync(command, { cwd, stdio: 'inherit' })
}

run('npm run build', portalDir)

if (!existsSync(sourceDistDir)) {
  throw new Error(`Build output not found at ${sourceDistDir}`)
}

if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true })
}

cpSync(sourceDistDir, targetDir, { recursive: true })
console.log(`Material Hubs synced to ${targetDir}`)
