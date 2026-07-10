const PDFJS_CDN_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174'

/** Lazy-load PDF.js from CDN (no npm bundle — keeps web build lean). */
export function loadPdfJsFromCdn(): Promise<any> {
  const win = window as Record<string, any>
  if (win['pdfjsLib']) return Promise.resolve(win['pdfjsLib'])
  return new Promise<any>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${PDFJS_CDN_BASE}/pdf.min.js`
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      win['pdfjsLib'].GlobalWorkerOptions.workerSrc = `${PDFJS_CDN_BASE}/pdf.worker.min.js`
      resolve(win['pdfjsLib'])
    }
    script.onerror = () => reject(new Error('pdfjs-cdn-load-failed'))
    document.head.appendChild(script)
  })
}
