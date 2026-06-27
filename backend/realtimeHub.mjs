/** Web-only realtime stub — Socket.io CMS sync removed with mobile/CMS runtime. */

let io = null

export function initRealtimeHub(_httpServer) {
  io = null
  return null
}

export function emitUiUpdated(_meta = {}) {
  /* no-op */
}
