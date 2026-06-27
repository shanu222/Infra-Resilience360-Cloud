import net from 'node:net'

const REQUIRED_PORTS = [
  { label: 'Frontend (Vite)', port: 5173 },
  { label: 'Backend (API)', port: 10000 },
]

function assertPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', (error) => {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use.`))
        return
      }
      reject(error)
    })
    server.once('listening', () => {
      server.close(() => resolve())
    })
    server.listen(port, '127.0.0.1')
  })
}

async function main() {
  for (const item of REQUIRED_PORTS) {
    try {
      await assertPortAvailable(item.port)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      console.error(`[dev:full] ${item.label} expected on port ${item.port}, but it is unavailable: ${detail}`)
      console.error('[dev:full] Stop the conflicting process, then run `npm run dev:full` again.')
      process.exit(1)
    }
  }

  console.log('[dev:full] Port checks passed. Starting frontend:5173 and backend:10000.')
}

main().catch((error) => {
  console.error('[dev:full] Port check failed unexpectedly:', error instanceof Error ? error.message : error)
  process.exit(1)
})
