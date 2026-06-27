#!/usr/bin/env bash
# Re-encode a guidance / disaster MP4 for broad browser + mobile playback (H.264 + AAC, faststart).
# Usage: ./scripts/transcode-disaster-mp4.sh input.mp4 output.mp4
# Then upload output.mp4 to S3 (replace the object key used by CMS / metadata).
set -euo pipefail
if [[ "${1:-}" == "" || "${2:-}" == "" ]]; then
  echo "Usage: $0 input.mp4 output.mp4" >&2
  exit 1
fi
exec ffmpeg -y -i "$1" -vcodec libx264 -acodec aac -movflags +faststart "$2"
