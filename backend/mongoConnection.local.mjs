/**
 * Local-first DB stub — no external database connection; content reads from data/ JSON.
 */
let bootLogged = false

export function getMongoConnectionState() {
  return { readyState: 0, connected: false, localFirst: true }
}

export function isMongoConnected() {
  return false
}

export async function waitForMongoReady(_timeoutMs = 0) {
  return false
}

export function initMongoConnection(_uri) {
  if (!bootLogged) {
    bootLogged = true
    console.info('[db] Local-first mode — external DB disabled; serving content from data/')
  }
}
