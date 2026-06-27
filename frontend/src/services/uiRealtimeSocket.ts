export type UiUpdatedPayload = {
  page?: string
  section?: string
  source?: string
  timestamp?: string
}

/** Static platform — no Socket.io; callers use polling or bundled JSON only. */
export function subscribeUiUpdated(_handler: (payload: UiUpdatedPayload) => void): () => void {
  return () => {}
}
