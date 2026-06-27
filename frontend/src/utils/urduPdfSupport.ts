/**
 * UTF-8 Urdu PDF support for jsPDF: embedded Noto Nastaliq Urdu + Arabic-script shaping.
 * Used by the main app and the Retrofit Calculator portal (via Vite alias).
 */
import type { jsPDF } from 'jspdf'
// CJS package — default interop in Vite
import arabicPersianReshaper from 'arabic-persian-reshaper'

const FONT_VFS = 'NotoNastaliqUrdu-Regular.ttf'
const FONT_FAMILY = 'NotoNastaliqUrdu'

type ArabicShaperModule = {
  ArabicShaper: { convertArabic: (s: string) => string }
}

function getArabicShaper(): ArabicShaperModule['ArabicShaper'] {
  const m = arabicPersianReshaper as unknown as ArabicShaperModule
  return m.ArabicShaper
}

/** Mark PDF instance after custom font is registered */
const FONT_FLAG = '__r360UrduFontReady' as const

export function getNotoNastaliqUrduFontUrl(): string {
  const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return `${normalized}fonts/${FONT_VFS}`
}

/**
 * Loads Noto Nastaliq Urdu (TTF) into jsPDF virtual file system and registers the font.
 * Call once before drawing Urdu text. Uses UTF-8 binary from fetch (ArrayBuffer).
 */
export async function ensureUrduPdfFont(pdf: jsPDF): Promise<void> {
  if ((pdf as unknown as Record<string, boolean>)[FONT_FLAG]) {
    pdf.setFont(FONT_FAMILY, 'normal')
    return
  }
  const url = getNotoNastaliqUrduFontUrl()
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Urdu font failed to load (${response.status}): ${url}`)
  }
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  pdf.addFileToVFS(FONT_VFS, binary)
  pdf.addFont(FONT_VFS, FONT_FAMILY, 'normal', 'normal')
  ;(pdf as unknown as Record<string, boolean>)[FONT_FLAG] = true
  pdf.setFont(FONT_FAMILY, 'normal')
}

let urduWebFontLoaded = false

/**
 * Loads Noto Nastaliq Urdu into the document so canvas/html2canvas can shape Urdu correctly.
 * Uses logical Unicode (no arabic-persian-reshaper); the browser applies OpenType/GSUB shaping.
 */
export async function ensureUrduWebFontLoaded(): Promise<void> {
  if (typeof document === 'undefined' || urduWebFontLoaded) return
  const relative = getNotoNastaliqUrduFontUrl()
  const url =
    typeof window !== 'undefined' ? new URL(relative, window.location.href).href : relative

  try {
    if (document.fonts.check(`16px "${FONT_FAMILY}"`)) {
      urduWebFontLoaded = true
      return
    }
  } catch {
    /* continue */
  }

  const face = new FontFace(FONT_FAMILY, `url(${url}) format("truetype")`)
  await face.load()
  document.fonts.add(face)
  await document.fonts.ready
  urduWebFontLoaded = true
}

/**
 * Logical-order Urdu/Arabic (plus mixed Latin/digits) → presentation forms for the embedded font.
 * RTL placement is done with jsPDF `align: 'right'` and right-edge coordinates, not by reordering
 * the string before shaping (bidi-before-shape breaks ArabicShaper).
 */
export function shapeUrduPdfText(logical: string): string {
  if (!logical) return logical
  try {
    return getArabicShaper().convertArabic(logical)
  } catch {
    return logical
  }
}

export function pdfTx(isUrdu: boolean, text: string): string {
  return isUrdu ? shapeUrduPdfText(text) : text
}

export function setPdfBodyFont(pdf: jsPDF, isUrdu: boolean): void {
  if (isUrdu) {
    pdf.setFont(FONT_FAMILY, 'normal')
  } else {
    pdf.setFont('helvetica', 'normal')
  }
}

export function setPdfBoldFont(pdf: jsPDF, isUrdu: boolean): void {
  if (isUrdu) {
    // Embedded family is regular only; use size/weight via color or spacing — keep same font
    pdf.setFont(FONT_FAMILY, 'normal')
  } else {
    pdf.setFont('helvetica', 'bold')
  }
}
