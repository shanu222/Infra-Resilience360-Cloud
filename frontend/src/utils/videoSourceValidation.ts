/**
 * AWS SigV4 query-style presigned URLs expire — never treat them as stable playback sources.
 */
export function isAwsPresignedUrl(url: string): boolean {
  const u = String(url ?? '')
  return /[?&]X-Amz-Algorithm=/i.test(u) || /[?&]X-Amz-Signature=/i.test(u) || /[?&]x-amz-signature=/i.test(u)
}

/**
 * Preferred playback: non-expiring HTTPS object URLs (S3 / CloudFront).
 */
export function isValidS3VideoSource(url: string): boolean {
  const u = String(url ?? '').trim()
  if (!u) return false
  if (isAwsPresignedUrl(u)) return false
  try {
    const pathOnly = u.split(/[?#]/)[0]
    if (/\.(mp4|webm|mov|m4v)$/i.test(pathOnly)) return true
  } catch {
    /* ignore */
  }
  if (/^https?:\/\//i.test(u) && (/cloudfront\.net/i.test(u) || /\.s3[.-]/i.test(u))) return true
  if (u.includes('amazonaws.com')) return true
  return false
}

export function describeInvalidVideoSource(url: string): string {
  const u = String(url ?? '').trim()
  if (!u) return 'empty URL'
  if (isAwsPresignedUrl(u)) return 'expiring presigned S3 URL — store a stable HTTPS object URL in Mongo'
  const pathOnly = u.split(/[?#]/)[0]
  if (!/\.(mp4|webm|mov|m4v)$/i.test(pathOnly) && !/amazonaws\.com/i.test(u)) {
    return 'URL does not look like a video resource (expected .mp4/.webm/.mov or S3 HTTPS URL)'
  }
  return 'URL failed video source validation'
}
