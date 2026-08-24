/**
 * Shared Urdu report pipeline: UTF-8 DOM → browser shaping (Noto Nastaliq Urdu) → html2canvas → jsPDF slices.
 * English reports keep using vector jsPDF (Helvetica) elsewhere.
 */
import { jsPDF } from 'jspdf'
import html2canvas from "html2canvas"
import { ensureUrduWebFontLoaded } from "./urduPdfSupport"
import { URDU_PDF_LAYOUT_WIDTH_PX } from './urduPdfLayoutConstants'

export { URDU_PDF_LAYOUT_WIDTH_PX } from './urduPdfLayoutConstants'

export function createUrduPdfHost(): HTMLDivElement {
  const host = document.createElement("div")
  host.className = "ur-pdf-capture-host"
  host.setAttribute("lang", "ur")
  host.setAttribute("dir", "rtl")
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${URDU_PDF_LAYOUT_WIDTH_PX}px`,
    "opacity:0.02",
    "z-index:2147483646",
    "pointer-events:none",
    "overflow:visible",
    "background:#ffffff",
  ].join(";")
  return host
}

export function appendUrduPdfRoot(host: HTMLElement, root: HTMLElement): void {
  root.setAttribute("lang", "ur")
  root.setAttribute("dir", "rtl")
  host.appendChild(root)
  document.body.appendChild(host)
}

export function removeUrduPdfHost(host: HTMLElement): void {
  host.remove()
}

function addCanvasSlicesToPdf(pdf: jsPDF, sourceCanvas: HTMLCanvasElement): void {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const pdfWidth = pageWidth - 2 * margin
  const pageInnerHeight = pageHeight - 2 * margin

  const scaledHeight = (sourceCanvas.height * pdfWidth) / sourceCanvas.width
  let remainingHeight = scaledHeight
  let sourceY = 0

  while (remainingHeight > 0.5) {
    const sliceHeight = Math.min(remainingHeight, pageInnerHeight)
    const sourceSliceHeight = (sliceHeight / scaledHeight) * sourceCanvas.height

    const sliceCanvas = document.createElement("canvas")
    sliceCanvas.width = sourceCanvas.width
    sliceCanvas.height = Math.max(1, Math.ceil(sourceSliceHeight))
    const ctx = sliceCanvas.getContext("2d")
    if (!ctx) break
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
    ctx.drawImage(
      sourceCanvas,
      0,
      sourceY,
      sourceCanvas.width,
      sourceSliceHeight,
      0,
      0,
      sourceCanvas.width,
      sourceSliceHeight,
    )

    const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92)
    pdf.addImage(imgData, "JPEG", margin, margin, pdfWidth, sliceHeight)

    remainingHeight -= sliceHeight
    sourceY += sourceSliceHeight
    if (remainingHeight > 0.5) {
      pdf.addPage()
    }
  }
}

export type UrduHtmlToPdfOptions = {
  /** Root element with Urdu content (logical UTF-8 strings, RTL CSS) */
  element: HTMLElement
  filename: string
  /** html2canvas scale; 2 is sharp on retina */
  scale?: number
  /** Called after pages are added; use for footers, etc. */
  afterRaster?: (pdf: jsPDF) => Promise<void>
}

/**
 * Renders a UTF-8 RTL Urdu DOM node to a multi-page PDF using native complex text layout.
 */
export async function downloadUrduHtmlAsPdf(options: UrduHtmlToPdfOptions): Promise<void> {
  const { element, filename, scale = 2, afterRaster } = options

  await ensureUrduWebFontLoaded()
  await document.fonts.ready
  await document.fonts.load(`18px "NotoNastaliqUrdu"`)

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: (clonedDoc) => {
      if (!clonedDoc.head.querySelector("meta[charset]")) {
        const meta = clonedDoc.createElement("meta")
        meta.setAttribute("charset", "UTF-8")
        clonedDoc.head.insertBefore(meta, clonedDoc.head.firstChild)
      }
      clonedDoc.documentElement.setAttribute("lang", "ur")
      clonedDoc.documentElement.setAttribute("dir", "rtl")
    },
  })

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  addCanvasSlicesToPdf(pdf, canvas)
  if (afterRaster) {
    await afterRaster(pdf)
  }
  // Capacitor WebView ignores pdf.save(); route through native export / blob helper.
  const { saveJsPdfDocument } = await import('./savePdfDocument')
  await saveJsPdfDocument(pdf, filename)
}
