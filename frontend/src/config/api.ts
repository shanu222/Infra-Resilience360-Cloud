/**
 * Backend API origin used across the web shell, embedded portals, axios and sockets.
 * Resolved by the single source of truth in `./apiBase`.
 */
import { API_BASE_URL } from './apiBase'

export const RESOLVED_API_ORIGIN = API_BASE_URL

export default RESOLVED_API_ORIGIN
