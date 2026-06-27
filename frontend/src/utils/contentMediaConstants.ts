/** User-facing copy when remote media cannot be loaded (never expose S3/AWS codes). */
export const MEDIA_UNAVAILABLE_MESSAGE =
  'Content is loading. Please check your connection and try again in a moment.'

/** Neutral 1×1 SVG used as final visual fallback for images. */
export const MEDIA_PLACEHOLDER_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" role="img" aria-label="Media placeholder">
  <rect width="640" height="360" fill="#0f172a"/>
  <text x="320" y="188" text-anchor="middle" fill="#94a3b8" font-family="Segoe UI, Arial, sans-serif" font-size="18">Media unavailable</text>
</svg>`,
)}`
