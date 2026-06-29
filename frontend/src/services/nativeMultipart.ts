/**
 * CapacitorHttp-patched fetch mishandles FormData on Android (missing multipart boundary).
 * Serialize FormData to an explicit multipart body before native HTTP upload.
 */
function escapeQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export async function formDataToMultipartBlob(
  formData: FormData,
): Promise<{ body: Blob; contentType: string }> {
  const boundary = `----R360${Date.now().toString(16)}${Math.random().toString(36).slice(2, 12)}`
  const parts: BlobPart[] = []

  for (const [name, value] of formData.entries()) {
    parts.push(`--${boundary}\r\n`)
    if (value instanceof Blob) {
      const file = value as File
      const filename = escapeQuoted(file.name || (name === 'image' ? 'upload.jpg' : 'file.bin'))
      const mime = file.type || 'application/octet-stream'
      parts.push(
        `Content-Disposition: form-data; name="${escapeQuoted(name)}"; filename="${filename}"\r\n`,
      )
      parts.push(`Content-Type: ${mime}\r\n\r\n`)
      parts.push(await value.arrayBuffer())
      parts.push('\r\n')
    } else {
      parts.push(`Content-Disposition: form-data; name="${escapeQuoted(name)}"\r\n\r\n`)
      parts.push(String(value))
      parts.push('\r\n')
    }
  }

  parts.push(`--${boundary}--\r\n`)

  return {
    body: new Blob(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  }
}
