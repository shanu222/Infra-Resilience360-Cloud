# Storage Policy

`storage/content` is the single authoritative runtime media repository.

Allowed runtime content:
- images
- videos
- pdfs
- audio
- metadata.json

Not allowed in `storage/content`:
- logos
- icons
- fonts
- UI SVG/theme assets
- favicons
- CSS/JS/source code
- JSON configuration (except per-module metadata)

All runtime media must be served via backend `/storage/content/...`.
