/**
 * CapacitorHttp-patched fetch mishandles FormData on Android (missing multipart boundary).
 * Serialize FormData to an explicit multipart body before native HTTP upload.
 */
function escapeQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged
}

function encodeText(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

export async function formDataToMultipartBlob(
  formData: FormData,
): Promise<{ body: Uint8Array; contentType: string }> {
  const boundary = `----R360${Date.now().toString(16)}${Math.random().toString(36).slice(2, 12)}`
  const chunks: Uint8Array[] = []

  for (const [name, value] of formData.entries()) {
    chunks.push(encodeText(`--${boundary}\r\n`))
    if (value instanceof Blob) {
      const file = value as File
      const filename = escapeQuoted(file.name || (name === 'image' ? 'upload.jpg' : 'file.bin'))
      const mime = file.type || 'application/octet-stream'
      chunks.push(
        encodeText(
          `Content-Disposition: form-data; name="${escapeQuoted(name)}"; filename="${filename}"\r\n`,
        ),
      )
      chunks.push(encodeText(`Content-Type: ${mime}\r\n\r\n`))
      chunks.push(new Uint8Array(await value.arrayBuffer()))
      chunks.push(encodeText('\r\n'))
    } else {
      chunks.push(encodeText(`Content-Disposition: form-data; name="${escapeQuoted(name)}"\r\n\r\n`))
      chunks.push(encodeText(String(value)))
      chunks.push(encodeText('\r\n'))
    }
  }

  chunks.push(encodeText(`--${boundary}--\r\n`))

  return {
    body: concatBytes(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`,
  }
}
