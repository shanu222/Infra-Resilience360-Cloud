/**
 * Saves a jsPDF (or raw base64 PDF) on web via download, and on Android Capacitor
 * via the native PdfExport plugin (Downloads + share sheet).
 *
 * Large PDFs cannot reliably cross iframe→parent via postMessage on Android
 * WebView (silent drop → "timed out"). Prefer a same-origin parent function.
 */
import type { jsPDF } from 'jspdf'
import { loadCapacitorCore } from '../capacitor/plugins'
import { isCapacitorNativeRuntime } from './capacitorRuntime'

type PdfExportApi = {
  savePdf: (opts: { filename: string; base64: string }) => Promise<{ ok?: boolean; uri?: string }>
}

type ParentPdfSaver = (filename: string, base64: string) => Promise<void>

declare global {
  interface Window {
    __R360_SAVE_PDF__?: ParentPdfSaver
  }
}

type PdfDownloadResult = {
  type: 'r360-pdf-download-result'
  requestId: string
  ok: boolean
  error?: string
}

function isNativeIframePortal(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get('native') === '1') {
      return window.parent !== window
    }
  } catch {
    /* ignore */
  }
  return false
}

async function loadPdfExportPlugin(): Promise<PdfExportApi | null> {
  try {
    const core = (await loadCapacitorCore()) as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean
        isPluginAvailable?: (name: string) => boolean
      }
      registerPlugin?: <T>(name: string) => T
    }
    if (!core?.Capacitor?.isNativePlatform?.()) return null
    if (core.Capacitor.isPluginAvailable?.('PdfExport') === false) return null
    if (typeof core.registerPlugin !== 'function') return null
    return core.registerPlugin<PdfExportApi>('PdfExport')
  } catch {
    return null
  }
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

/** Same-origin parent hook — avoids postMessage size limits. */
async function saveViaParentFunction(filename: string, base64: string): Promise<boolean> {
  try {
    const parent = window.parent
    const saver = parent?.__R360_SAVE_PDF__
    if (typeof saver !== 'function') return false
    await saver(filename, base64)
    return true
  } catch {
    return false
  }
}

async function saveViaParentBridge(filename: string, base64: string): Promise<void> {
  if (await saveViaParentFunction(filename, base64)) return

  // Fallback: chunked postMessage (full PDF in one message often times out on Android).
  const requestId = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const chunkSize = 200_000
  const totalChunks = Math.max(1, Math.ceil(base64.length / chunkSize))

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage)
      reject(new Error('PDF download timed out. Please try again.'))
    }, 90_000)

    const onMessage = (event: MessageEvent) => {
      const data = event.data as PdfDownloadResult | undefined
      if (!data || data.type !== 'r360-pdf-download-result' || data.requestId !== requestId) return
      window.clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      if (!data.ok) {
        reject(new Error(data.error || 'Could not save the PDF report.'))
        return
      }
      resolve()
    }

    window.addEventListener('message', onMessage)
    try {
      for (let i = 0; i < totalChunks; i += 1) {
        const chunk = base64.slice(i * chunkSize, (i + 1) * chunkSize)
        window.parent.postMessage(
          {
            type: 'r360-pdf-download-chunk',
            requestId,
            filename,
            chunkIndex: i,
            totalChunks,
            chunk,
            mimeType: 'application/pdf',
          },
          '*',
        )
      }
    } catch (error) {
      window.clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      reject(error instanceof Error ? error : new Error('Could not start PDF download.'))
    }
  })
}

/** Called only from the parent WebView (never from the iframe). */
export async function savePdfBase64Native(filename: string, base64: string): Promise<void> {
  const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`
  const plugin = await loadPdfExportPlugin()
  if (!plugin) {
    throw new Error('PDF export is unavailable on this device.')
  }
  await plugin.savePdf({ filename: safeName, base64 })
}

export async function savePdfBase64(filename: string, base64: string): Promise<void> {
  const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`

  if (isNativeIframePortal()) {
    await saveViaParentBridge(safeName, base64)
    return
  }

  if (isCapacitorNativeRuntime()) {
    await savePdfBase64Native(safeName, base64)
    return
  }

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  triggerBrowserDownload(new Blob([bytes], { type: 'application/pdf' }), safeName)
}

export async function saveJsPdfDocument(pdf: jsPDF, filename: string): Promise<void> {
  const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`
  // Prefer compact base64 without a giant data-URI wrapper string.
  const base64 = pdf.output('datauristring').split(',')[1] || pdf.output('datauristring')
  await savePdfBase64(safeName, base64)
}
