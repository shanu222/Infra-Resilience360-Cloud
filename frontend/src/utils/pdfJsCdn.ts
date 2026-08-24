/**
 * PDF.js loader.
 *
 * The bundled `pdfjs-dist` copy is preferred because loading the library from a
 * CDN put a full network round trip in front of the first page render — on a
 * phone that is the bulk of the wait before a model board appears, and it fails
 * outright when the device is offline.
 *
 * The CDN remains as a fallback: `pdfjs-dist` v4 needs a fairly recent engine
 * (`Promise.withResolvers`), and the app still supports old Android WebViews
 * where the v3 build is the only one that will run.
 */

const PDFJS_CDN_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174'

type PdfJsModule = {
  getDocument: (options: unknown) => { promise: Promise<unknown> }
  GlobalWorkerOptions: { workerSrc: string }
}

let cached: Promise<PdfJsModule> | null = null

async function loadBundled(): Promise<PdfJsModule> {
  const [pdfjs, workerUrl] = await Promise.all([
    import('pdfjs-dist'),
    // `?url` emits the worker as its own asset and hands back a local path, so
    // the worker never has to be fetched cross-origin.
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  const mod = pdfjs as unknown as PdfJsModule
  mod.GlobalWorkerOptions.workerSrc = (workerUrl as { default: string }).default
  return mod
}

function loadFromCdn(): Promise<PdfJsModule> {
  return new Promise<PdfJsModule>((resolve, reject) => {
    const win = window as unknown as Record<string, PdfJsModule | undefined>
    if (win['pdfjsLib']) {
      resolve(win['pdfjsLib'] as PdfJsModule)
      return
    }
    const script = document.createElement('script')
    script.src = `${PDFJS_CDN_BASE}/pdf.min.js`
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      const lib = win['pdfjsLib']
      if (!lib) {
        reject(new Error('pdfjs-cdn-load-failed'))
        return
      }
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN_BASE}/pdf.worker.min.js`
      resolve(lib)
    }
    script.onerror = () => reject(new Error('pdfjs-cdn-load-failed'))
    document.head.appendChild(script)
  })
}

/** Resolves a ready-to-use PDF.js, preferring the bundled build. */
export function loadPdfJs(): Promise<PdfJsModule> {
  if (cached) return cached
  cached = loadBundled().catch(() => loadFromCdn())
  // A failed load must not be cached forever; the next view should retry.
  cached.catch(() => {
    cached = null
  })
  return cached
}

/** @deprecated Kept for existing call sites; prefer {@link loadPdfJs}. */
export const loadPdfJsFromCdn = loadPdfJs
