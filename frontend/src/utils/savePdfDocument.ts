/**
 * Saves a jsPDF (or raw base64 PDF) on web via download, and on Android Capacitor
 * via the native PdfExport plugin (Downloads + share sheet).
 *
 * Android WebView ignores {@code <a download>} / {@code pdf.save()}, which is why
 * Retrofit Calculator "Download PDF Report" appeared to do nothing.
 *
 * When this code runs inside the native retrofit iframe (`?native=1`), Capacitor
 * plugins are unavailable — the PDF is posted to the parent WebView instead.
 */
import type { jsPDF } from 'jspdf'
import { loadCapacitorCore } from '../capacitor/plugins'
import { isCapacitorNativeRuntime } from './capacitorRuntime'

type PdfExportApi = {
  savePdf: (opts: { filename: string; base64: string }) => Promise<{ ok?: boolean; uri?: string }>
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

async function saveViaParentBridge(filename: string, base64: string): Promise<void> {
  const requestId = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage)
      reject(new Error('PDF download timed out. Please try again.'))
    }, 45_000)

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
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
      window.parent.postMessage(
        {
          type: 'r360-pdf-download-request',
          requestId,
          filename,
          base64,
          mimeType: 'application/pdf',
        },
        window.location.origin,
      )
    } catch (error) {
      window.clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      reject(error instanceof Error ? error : new Error('Could not start PDF download.'))
    }
  })
}

export async function savePdfBase64(filename: string, base64: string): Promise<void> {
  const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`

  if (isNativeIframePortal()) {
    await saveViaParentBridge(safeName, base64)
    return
  }

  if (isCapacitorNativeRuntime()) {
    const plugin = await loadPdfExportPlugin()
    if (plugin) {
      await plugin.savePdf({ filename: safeName, base64 })
      return
    }
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
  const dataUri = pdf.output('datauristring') as string
  const comma = dataUri.indexOf(',')
  const base64 = comma >= 0 ? dataUri.slice(comma + 1) : dataUri
  await savePdfBase64(safeName, base64)
}
