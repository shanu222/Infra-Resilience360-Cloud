/**
 * Urdu-only retrofit PDF: UTF-8 HTML + Noto Nastaliq Urdu + native shaping → html2canvas → jsPDF.
 * English path uses vector jsPDF in FinalReport.tsx.
 */
import type { RetrofitStrings } from "../../i18n/retrofitStrings"
import type { CostEstimate, ManualAnnotationSummary } from "../context/AppContext"
import {
  appendUrduPdfRoot,
  createUrduPdfHost,
  downloadUrduHtmlAsPdf,
  removeUrduPdfHost,
  URDU_PDF_LAYOUT_WIDTH_PX,
} from "@resilience/urdu-html-to-pdf"
import { ensureUrduPdfFont, getNotoNastaliqUrduFontUrl, pdfTx } from "@resilience/urdu-pdf-support"
import { jsPDF } from "jspdf"

export type UrduRetrofitReportPdfInput = {
  r: RetrofitStrings
  location: string
  dateLocale: string
  rows: Array<{ elementType: string; severity: string; cost: number }>
  total: number
  minEstimate: number
  maxEstimate: number
  activeEstimate: CostEstimate | null
  manualAnnotation: ManualAnnotationSummary | null
  imagePreview: string | null
  annotatedImageDataUrl: string | null
  formatSeverityLabel: (raw: string) => string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildReportHtml(input: UrduRetrofitReportPdfInput): HTMLElement {
  const {
    r,
    location,
    dateLocale,
    rows,
    total,
    minEstimate,
    maxEstimate,
    activeEstimate,
    manualAnnotation,
    imagePreview,
    annotatedImageDataUrl,
    formatSeverityLabel,
  } = input

  const reportDate = new Date().toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const metaStr = r.report_pdfGenerated.replace("{date}", reportDate).replace("{location}", location)

  const boxLines: string[] = [
    r.report_pdfMostLikely.replace("{amount}", total.toLocaleString()),
    r.report_pdfCostRange
      .replace("{min}", minEstimate.toLocaleString())
      .replace("{max}", maxEstimate.toLocaleString()),
    r.report_pdfDefectsConf
      .replace("{n}", String(rows.length))
      .replace("{c}", String(activeEstimate?.confidence ?? "N/A")),
    r.report_pdfDuration.replace("{w}", String(activeEstimate?.estimatedDurationWeeks ?? "N/A")),
  ]
  if (manualAnnotation) {
    boxLines.push(
      r.report_pdfDamageRisk
        .replace("{d}", manualAnnotation.damagePercent.toFixed(1))
        .replace("{r}", String(manualAnnotation.weightedRiskScore)),
    )
  }

  const legendData = [
    { color: "#EF4444", severity: r.report_legend_sev, desc: r.report_legend_sevDesc, action: r.report_legend_sevAction },
    { color: "#C4A484", severity: r.report_legend_mod, desc: r.report_legend_modDesc, action: r.report_legend_modAction },
    { color: "#FACC15", severity: r.report_legend_low, desc: r.report_legend_lowDesc, action: r.report_legend_lowAction },
    { color: "#3B82F6", severity: r.report_legend_vlow, desc: r.report_legend_vlowDesc, action: r.report_legend_vlowAction },
  ]

  const fontUrl = getNotoNastaliqUrduFontUrl()
  const wrap = document.createElement("div")
  wrap.setAttribute("lang", "ur")
  wrap.setAttribute("dir", "rtl")
  wrap.style.cssText = [
    "box-sizing:border-box",
    `width:${URDU_PDF_LAYOUT_WIDTH_PX}px`,
    "padding:32px 48px 40px",
    "background:#ffffff",
    "color:#111827",
    `font-family:\"NotoNastaliqUrdu\",\"Noto Nastaliq Urdu\",serif`,
    "font-size:15px",
    "line-height:1.9",
    "text-align:right",
    "direction:rtl",
    "unicode-bidi:embed",
  ].join(";")

  wrap.innerHTML = `
<style>
@font-face {
  font-family: 'NotoNastaliqUrdu';
  src: url('${fontUrl}') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}
.ur-pdf-root * { font-family: inherit; }
.ur-pdf-h1 { font-size: 26px; font-weight: 700; margin: 0 0 10px 0; text-align: right; }
.ur-pdf-meta { font-size: 13px; opacity: 0.95; line-height: 1.75; text-align: right; word-wrap: break-word; overflow-wrap: anywhere; }
.ur-pdf-h2 { font-size: 17px; font-weight: 700; margin: 22px 0 10px 0; color: #111827; text-align: right; }
.ur-pdf-box { background: #f0f5ff; padding: 16px 18px; border-radius: 6px; margin-bottom: 8px; }
.ur-pdf-box p { margin: 0 0 10px 0; text-align: right; word-wrap: break-word; overflow-wrap: anywhere; }
.ur-pdf-box p:last-child { margin-bottom: 0; }
.ur-table-wrap {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 13px;
  table-layout: fixed;
  direction: rtl;
}
.ur-th, .ur-td {
  text-align: right;
  vertical-align: top;
  padding: 10px 8px;
  border-bottom: 1px solid #e5e7eb;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  hyphens: manual;
}
.ur-th { background: #2563eb; color: #fff; font-weight: 700; border-bottom: none; }
.ur-tr-alt { background: #f9fafb; }
.ur-total-row .ur-td { background: #2563eb; color: #fff; font-weight: 700; border-bottom: none; }
.ur-td-num { white-space: nowrap; text-align: left; direction: ltr; unicode-bidi: isolate; }
.ur-img-cap { font-size: 13px; font-weight: 600; margin-bottom: 8px; text-align: right; }
/* Mirror English layout: original on left in LTR → row-reverse puts original on right in RTL doc */
.ur-img-row { display: flex; flex-direction: row-reverse; gap: 14px; justify-content: space-between; margin-top: 14px; align-items: flex-start; }
.ur-img-col { flex: 1; min-width: 0; }
.ur-img-col img { width: 100%; height: auto; border-radius: 4px; display: block; }
.ur-legend .ur-th, .ur-legend .ur-td { font-size: 12px; padding: 9px 7px; }
.ur-legend .ur-sw { text-align: center; }
.ur-annot { background: #fff8f0; padding: 14px 16px; border-radius: 6px; margin-top: 12px; }
.ur-annot p { margin: 0 0 8px 0; font-size: 13px; text-align: right; word-wrap: break-word; overflow-wrap: anywhere; }
</style>
<div class="ur-pdf-root">
<div style="background:#2563eb;color:#fff;padding:22px 24px;margin:-32px -48px 26px -48px;">
  <div class="ur-pdf-h1">${escapeHtml(r.report_pdfTitle)}</div>
  <div class="ur-pdf-meta">${escapeHtml(metaStr)}</div>
</div>

<div class="ur-pdf-h2">${escapeHtml(r.report_pdfExecSummary)}</div>
<div class="ur-pdf-box">
  ${boxLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
</div>

<div class="ur-pdf-h2">${escapeHtml(r.report_pdfCostBreakdown)}</div>
<table class="ur-table-wrap" dir="rtl">
  <thead>
    <tr>
      <th class="ur-th" style="width:38%">${escapeHtml(r.report_pdfThElement)}</th>
      <th class="ur-th" style="width:30%">${escapeHtml(r.report_pdfThSeverity)}</th>
      <th class="ur-th" style="width:32%">${escapeHtml(r.report_pdfThEstCost)}</th>
    </tr>
  </thead>
  <tbody>
    ${rows
      .map((row, index) => {
        const el = escapeHtml(row.elementType)
        const sev = escapeHtml(formatSeverityLabel(row.severity))
        const amt = `PKR ${row.cost.toLocaleString()}`
        const alt = index % 2 === 0 ? " ur-tr-alt" : ""
        return `<tr class="${alt}"><td class="ur-td">${el}</td><td class="ur-td">${sev}</td><td class="ur-td ur-td-num">${escapeHtml(amt)}</td></tr>`
      })
      .join("")}
    <tr class="ur-total-row">
      <td class="ur-td" colspan="2">${escapeHtml(r.report_pdfTotalCost)}</td>
      <td class="ur-td ur-td-num">PKR ${escapeHtml(total.toLocaleString())}</td>
    </tr>
  </tbody>
</table>
${
  imagePreview || annotatedImageDataUrl
    ? `
<div style="margin-top:28px">
  <div class="ur-pdf-h2" style="font-size:19px">${escapeHtml(r.report_pdfDamageViz)}</div>
  <div class="ur-img-row">
    ${
      imagePreview
        ? `<div class="ur-img-col"><div class="ur-img-cap">${escapeHtml(r.report_pdfOriginal)}</div><img crossorigin="anonymous" alt="" src="${escapeHtml(imagePreview)}" /></div>`
        : ""
    }
    ${
      annotatedImageDataUrl
        ? `<div class="ur-img-col"><div class="ur-img-cap">${escapeHtml(r.report_pdfDamageMap)}</div><img crossorigin="anonymous" alt="" src="${escapeHtml(annotatedImageDataUrl)}" /></div>`
        : ""
    }
  </div>

  <div class="ur-pdf-h2" style="margin-top:22px">${escapeHtml(r.report_pdfLegendTitle)}</div>
  <table class="ur-table-wrap ur-legend" dir="rtl" style="margin-top:8px">
    <thead>
      <tr>
        <th class="ur-th ur-sw" style="width:14%">${escapeHtml(r.report_pdfThColor)}</th>
        <th class="ur-th" style="width:18%">${escapeHtml(r.report_pdfThSeverity)}</th>
        <th class="ur-th" style="width:36%">${escapeHtml(r.report_pdfThDesc)}</th>
        <th class="ur-th" style="width:32%">${escapeHtml(r.report_pdfThRetrofitAction)}</th>
      </tr>
    </thead>
    <tbody>
      ${legendData
        .map(
          (item, index) => `
      <tr class="${index % 2 === 0 ? "ur-tr-alt" : ""}">
        <td class="ur-td ur-sw"><span style="display:inline-block;width:20px;height:14px;border-radius:2px;background:${item.color}"></span></td>
        <td class="ur-td">${escapeHtml(item.severity)}</td>
        <td class="ur-td">${escapeHtml(item.desc)}</td>
        <td class="ur-td">${escapeHtml(item.action)}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  ${
    manualAnnotation
      ? `
  <div class="ur-pdf-h2">${escapeHtml(r.report_pdfAnnotSummary)}</div>
  <div class="ur-annot">
    <p>${escapeHtml(r.report_pdfBulletDamage.replace("{p}", manualAnnotation.damagePercent.toFixed(1)))}</p>
    <p>${escapeHtml(r.report_pdfBulletHigh.replace("{p}", manualAnnotation.severePercent.toFixed(1)))}</p>
    <p>${escapeHtml(r.report_pdfBulletRisk.replace("{s}", String(manualAnnotation.weightedRiskScore)))}</p>
    <p>${escapeHtml(`• ${r.report_pdfReplaceRecommended} ${manualAnnotation.replacementRecommended ? r.report_pdfReplaceYes : r.report_pdfReplaceNo}`)}</p>
    <p>${escapeHtml(`• ${r.report_pdfInvestigationRequired} ${manualAnnotation.investigationRequired ? r.report_pdfInvYes : r.report_pdfInvNo}`)}</p>
  </div>`
      : ""
  }
</div>`
    : ""
}
</div>
`

  return wrap
}

async function drawFooters(pdf: jsPDF, r: RetrofitStrings): Promise<void> {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const totalPages = pdf.internal.pages.length - 1

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    await ensureUrduPdfFont(pdf)
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
    pdf.text(
      pdfTx(true, r.report_pdfPageOf.replace("{i}", String(i)).replace("{n}", String(totalPages))),
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" },
    )
    pdf.text(pdfTx(true, r.report_pdfFooter), pageWidth - margin, pageHeight - 8, { align: "right" })
  }
}

export async function downloadUrduRetrofitReportPdf(input: UrduRetrofitReportPdfInput): Promise<void> {
  const host = createUrduPdfHost()
  const el = buildReportHtml(input)
  appendUrduPdfRoot(host, el)

  try {
    await downloadUrduHtmlAsPdf({
      element: el,
      filename: `retrofit-report-${Date.now()}.pdf`,
      scale: 2,
      afterRaster: async (pdf) => {
        await drawFooters(pdf, input.r)
      },
    })
  } finally {
    removeUrduPdfHost(host)
  }
}
