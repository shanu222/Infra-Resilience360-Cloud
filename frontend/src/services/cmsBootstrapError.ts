/** Thrown when required CMS mapping / Mongo payload is missing or invalid (no static fallback). */
export class CmsBootstrapError extends Error {
  readonly part: string

  constructor(part: string, detail?: string) {
    super(detail ? `CMS bootstrap failed (${part}): ${detail}` : `CMS bootstrap failed: ${part}`)
    this.name = 'CmsBootstrapError'
    this.part = part
  }
}
