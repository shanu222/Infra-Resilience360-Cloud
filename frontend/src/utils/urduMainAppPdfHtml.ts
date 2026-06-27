/**
 * UTF-8 Urdu HTML builders for main-app PDFs (retrofit estimate, advisory).
 * Paired with urduHtmlToPdf.downloadUrduHtmlAsPdf — English paths stay on jsPDF vectors.
 */
import { getNotoNastaliqUrduFontUrl } from "./urduPdfSupport"
import { URDU_PDF_LAYOUT_WIDTH_PX } from "./urduPdfLayoutConstants"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const baseStyles = `
  box-sizing: border-box;
  width: ${URDU_PDF_LAYOUT_WIDTH_PX}px;
  padding: 28px 40px 36px;
  background: #ffffff;
  color: #111827;
  font-family: "NotoNastaliqUrdu", "Noto Nastaliq Urdu", serif;
  font-size: 14px;
  line-height: 1.85;
  text-align: right;
  direction: rtl;
  unicode-bidi: embed;
`

/** Retrofit estimate PDF (plain layout, mirrors English jsPDF content order). */
export function buildUrduRetrofitEstimateElement(options: {
  mainTitle: string
  bodyLines: string[]
  hazardHeading: string
  hazardBullets: string[]
  summaryLine: string
  defectsLine: string
}): HTMLElement {
  const fontUrl = getNotoNastaliqUrduFontUrl()
  const wrap = document.createElement("div")
  wrap.setAttribute("lang", "ur")
  wrap.setAttribute("dir", "rtl")
  wrap.style.cssText = baseStyles

  const { mainTitle, bodyLines, hazardHeading, hazardBullets, summaryLine, defectsLine } = options

  wrap.innerHTML = `
<style>
@font-face {
  font-family: 'NotoNastaliqUrdu';
  src: url('${fontUrl}') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}
.ur-app-h1 { font-size: 18px; font-weight: 700; margin: 0 0 14px 0; text-align: right; }
.ur-app-p { margin: 0 0 7px 0; text-align: right; word-wrap: break-word; overflow-wrap: anywhere; }
.ur-app-h2 { font-size: 15px; font-weight: 700; margin: 14px 0 8px 0; text-align: right; }
.ur-app-ul { margin: 0; padding: 0 22px 0 0; list-style-position: outside; text-align: right; }
.ur-app-li { margin: 0 0 6px 0; word-wrap: break-word; overflow-wrap: anywhere; }
</style>
<div class="ur-app-h1">${escapeHtml(mainTitle)}</div>
${bodyLines.map((line) => `<p class="ur-app-p">${escapeHtml(line)}</p>`).join("")}
<div class="ur-app-h2">${escapeHtml(hazardHeading)}</div>
<ul class="ur-app-ul" dir="rtl">
${hazardBullets.map((b) => `<li class="ur-app-li">${escapeHtml(b)}</li>`).join("")}
</ul>
<p class="ur-app-p" style="margin-top:12px">${escapeHtml(summaryLine)}</p>
<p class="ur-app-p">${escapeHtml(defectsLine)}</p>
`

  return wrap
}

/** Advisory Q&A PDF */
export function buildUrduAdvisoryAnswerElement(options: {
  title: string
  provinceLine: string
  generatedLine: string
  questionBlock?: string
  answerBlock: string
}): HTMLElement {
  const fontUrl = getNotoNastaliqUrduFontUrl()
  const wrap = document.createElement("div")
  wrap.setAttribute("lang", "ur")
  wrap.setAttribute("dir", "rtl")
  wrap.style.cssText = baseStyles

  const { title, provinceLine, generatedLine, questionBlock, answerBlock } = options

  wrap.innerHTML = `
<style>
@font-face {
  font-family: 'NotoNastaliqUrdu';
  src: url('${fontUrl}') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}
.ur-adv-h1 { font-size: 16px; font-weight: 700; margin: 0 0 12px 0; text-align: right; }
.ur-adv-p { margin: 0 0 8px 0; text-align: right; word-wrap: break-word; overflow-wrap: anywhere; }
.ur-adv-q { font-weight: 700; margin-top: 12px; }
</style>
<div class="ur-adv-h1">${escapeHtml(title)}</div>
<p class="ur-adv-p">${escapeHtml(provinceLine)}</p>
<p class="ur-adv-p">${escapeHtml(generatedLine)}</p>
${questionBlock ? `<p class="ur-adv-p ur-adv-q">${escapeHtml(questionBlock)}</p>` : ""}
<p class="ur-adv-p">${escapeHtml(answerBlock)}</p>
`

  return wrap
}
