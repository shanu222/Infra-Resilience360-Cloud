import { Download, Share2, FileCheck, DollarSign, Calendar, AlertTriangle, TrendingUp, Package } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { useMemo } from "react"
import { motion } from "motion/react"
import { jsPDF } from "jspdf"
import { useAppContext } from "../context/AppContext"
import { useRetrofitStrings } from "../../i18n/retrofitStrings"
import { usePortalLanguage } from "../../i18n/portalLanguage"
import { downloadUrduRetrofitReportPdf } from "./urduRetrofitReportPdf"

function formatSeverityLabel(raw: string, r: ReturnType<typeof useRetrofitStrings>): string {
  const s = String(raw || "").trim().toLowerCase()
  if (s === "high") return r.report_dataHigh
  if (s === "moderate") return r.report_dataModerate
  if (s === "low") return r.report_dataLow
  if (s === "very low" || s === "verylow") return r.report_legend_vlow
  if (s === "severe") return r.brush_severe
  return raw || r.report_unknown
}

export function FinalReport() {
  const r = useRetrofitStrings()
  const lang = usePortalLanguage()
  const dateLocale = lang === "ur" ? "ur-PK" : "en-US"
  const { defects, activeEstimate, location, detectionData, manualAnnotation, imagePreview, cityRates, formData } = useAppContext()

  // Recalculate location multiplier from current cityRates
  const locationMultiplier = cityRates?.locationMultiplier ?? 1
  const complexityMultiplier =
    1 +
    (formData.tightAccess ? 0.08 : 0) +
    (formData.occupied ? 0.06 : 0) +
    (formData.scaffolding ? 0.05 : 0)

  const retrofitLevelFactor =
    formData.retrofitLevel === "seismic" ? 1.28 : formData.retrofitLevel === "structural" ? 1.12 : 0.9

  // Recalculate costs based on current cityRates
  const recalculatedRows = useMemo(() => {
    if (defects.length > 0) {
      return defects
    }

    if (activeEstimate) {
      // Recalculate the active estimate total based on current cityRates
      const baseCost = activeEstimate.baseCost || activeEstimate.totalCost / (locationMultiplier * complexityMultiplier * retrofitLevelFactor)
      const contingencyPercent = (cityRates?.contingencyPercent ?? 0) / 100
      const overheadPercent = (cityRates?.overheadPercent ?? 0) / 100

      const adjustedSubtotal = Math.round(baseCost * locationMultiplier * complexityMultiplier * retrofitLevelFactor)
      const contingency = Math.round(adjustedSubtotal * contingencyPercent)
      const overhead = Math.round(adjustedSubtotal * overheadPercent)
      const recalculatedTotal = adjustedSubtotal + contingency + overhead

      return [
        {
          id: "current",
          elementType: activeEstimate.elementType,
          defectType: detectionData?.defectType ?? "general",
          severity: detectionData?.severity ?? "Moderate",
          cost: recalculatedTotal,
        },
      ]
    }

    return []
  }, [defects, activeEstimate, detectionData, cityRates, locationMultiplier, complexityMultiplier, retrofitLevelFactor, formData])

  const rows = recalculatedRows

  const grouped = Object.values(
    rows.reduce<Record<string, { name: string; cost: number }>>((accumulator, row) => {
      const key = row.elementType || r.report_unknown
      accumulator[key] = accumulator[key] ?? { name: key, cost: 0 }
      accumulator[key].cost += row.cost
      return accumulator
    }, {}),
  )

  const severityData = Object.values(
    rows.reduce<Record<string, { name: string; value: number }>>((acc, row) => {
      const key = row.severity
      acc[key] = acc[key] ?? { name: key, value: 0 }
      acc[key].value += 1
      return acc
    }, {}),
  )

  const total = rows.reduce((sum, row) => sum + row.cost, 0)
  const minEstimate = Math.round(total * 0.9)
  const maxEstimate = Math.round(total * 1.12)

  const annotationSeverityData = manualAnnotation
    ? manualAnnotation.zones
        .filter((zone) => zone.percentage > 0)
        .map((zone) => ({
          name: zone.label,
          value: Number(zone.percentage.toFixed(2)),
          areaM2: zone.areaM2,
          color: zone.color,
          strategy: zone.recommendedAction,
          estimatedCost: Math.round(zone.areaM2 * zone.unitCost * zone.severityMultiplier),
        }))
    : []
  
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
  const SEVERITY_COLORS = { Low: '#10B981', Moderate: '#F59E0B', High: '#EF4444' }

  const loadImage = (source: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(r.report_pdfUnableImage))
      image.src = source
    })

  const buildAnnotatedImageForPdf = async () => {
    if (!imagePreview) {
      return null
    }

    if (!manualAnnotation?.annotationImage) {
      return imagePreview
    }

    const base = await loadImage(imagePreview)
    const overlay = await loadImage(manualAnnotation.annotationImage)

    const canvas = document.createElement("canvas")
    canvas.width = base.naturalWidth || base.width
    canvas.height = base.naturalHeight || base.height

    const context = canvas.getContext("2d")
    if (!context) {
      return imagePreview
    }

    context.drawImage(base, 0, 0, canvas.width, canvas.height)
    context.drawImage(overlay, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.92)
  }

  const downloadReport = async () => {
    if (lang === "ur") {
      const annotatedImg = await buildAnnotatedImageForPdf()
      await downloadUrduRetrofitReportPdf({
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
        annotatedImageDataUrl: annotatedImg,
        formatSeverityLabel: (raw) => formatSeverityLabel(raw, r),
      })
      return
    }

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let y = margin

    pdf.setFont("helvetica", "normal")

    const wrapPdfLine = (text: string, maxWidth: number) => {
      pdf.setFont("helvetica", "normal")
      return pdf.splitTextToSize(text, maxWidth)
    }

    const addNewPage = () => {
      pdf.addPage()
      y = margin
    }

    // ===== PAGE 1: HEADER & EXECUTIVE SUMMARY =====
    pdf.setFillColor(37, 99, 235)
    pdf.rect(0, 0, pageWidth, 40, "F")

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(24)
    pdf.setTextColor(255, 255, 255)
    pdf.text(r.report_pdfTitle, margin, 15, { align: "left" })

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    const reportDate = new Date().toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" })
    const metaStr = r.report_pdfGenerated.replace("{date}", reportDate).replace("{location}", location)
    const metaLines = wrapPdfLine(metaStr, contentWidth)
    let metaY = 20
    metaLines.forEach((line) => {
      pdf.text(line, margin, metaY, { align: "left" })
      metaY += 4
    })

    y = 48

    pdf.setTextColor(0, 0, 0)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12)
    pdf.text(r.report_pdfExecSummary, margin, y, { align: "left" })
    y += 7

    pdf.setFillColor(240, 245, 255)
    pdf.rect(margin, y, contentWidth, 40, "F")

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
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
    let boxY = y + 6
    boxLines.forEach((line) => {
      const lines = wrapPdfLine(line, contentWidth - 10)
      lines.forEach((ln) => {
        pdf.text(ln, margin + 5, boxY, { align: "left" })
        boxY += 5
      })
    })

    y += 50

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(12)
    pdf.text(r.report_pdfCostBreakdown, margin, y, { align: "left" })
    y += 7

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.setFillColor(37, 99, 235)
    pdf.setTextColor(255, 255, 255)
    pdf.rect(margin, y - 4, contentWidth * 0.4, 6, "F")
    pdf.rect(margin + contentWidth * 0.4, y - 4, contentWidth * 0.3, 6, "F")
    pdf.rect(margin + contentWidth * 0.7, y - 4, contentWidth * 0.3, 6, "F")

    pdf.text(r.report_pdfThElement, margin + 2, y, { align: "left" })
    pdf.text(r.report_pdfThSeverity, margin + contentWidth * 0.4 + 2, y, { align: "left" })
    pdf.text(r.report_pdfThEstCost, margin + contentWidth * 0.7 + 2, y, { align: "left" })
    y += 7

    pdf.setTextColor(0, 0, 0)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)

    rows.forEach((row, index) => {
      if (y + 6 > pageHeight - margin - 15) addNewPage()

      if (index % 2 === 0) {
        pdf.setFillColor(245, 245, 245)
        pdf.rect(margin, y - 4, contentWidth, 6, "F")
      }

      const el = row.elementType
      const sev = formatSeverityLabel(row.severity, r)
      const amt = `PKR ${row.cost.toLocaleString()}`
      pdf.text(el, margin + 2, y, { align: "left" })
      pdf.text(sev, margin + contentWidth * 0.4 + 2, y, { align: "left" })
      pdf.text(amt, margin + contentWidth * 0.7 + 2, y, { align: "left" })
      y += 6
    })

    y += 3
    pdf.setFillColor(37, 99, 235)
    pdf.setTextColor(255, 255, 255)
    pdf.setFont("helvetica", "bold")
    pdf.rect(margin, y - 4, contentWidth, 6, "F")
    pdf.text(r.report_pdfTotalCost, margin + 2, y, { align: "left" })
    pdf.text(`PKR ${total.toLocaleString()}`, margin + contentWidth * 0.7 + 2, y, { align: "left" })

    y += 15
    pdf.setTextColor(0, 0, 0)

    if (imagePreview || manualAnnotation?.annotationImage) {
      addNewPage()

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(14)
      pdf.text(r.report_pdfDamageViz, margin, y, { align: "left" })
      y += 10

      const imageWidth = (contentWidth - 4) / 2
      const imageHeight = imageWidth * 0.75

      try {
        if (imagePreview) {
          await loadImage(imagePreview)
          pdf.text(r.report_pdfOriginal, margin, y - 2, { align: "left" })
          pdf.addImage(imagePreview, "JPEG", margin, y, imageWidth, imageHeight)
        }

        const annotatedImg = await buildAnnotatedImageForPdf()
        if (annotatedImg) {
          const capX = margin + imageWidth + 4
          pdf.text(r.report_pdfDamageMap, capX, y - 2, { align: "left" })
          pdf.addImage(annotatedImg, "JPEG", capX, y, imageWidth, imageHeight)
        }

        y += imageHeight + 10
      } catch {
        y += 15
      }

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)
      pdf.text(r.report_pdfLegendTitle, margin, y, { align: "left" })
      y += 7

      pdf.setFontSize(8)
      pdf.setFillColor(37, 99, 235)
      pdf.setTextColor(255, 255, 255)

      const colWidths = [contentWidth * 0.15, contentWidth * 0.2, contentWidth * 0.35, contentWidth * 0.3]

      pdf.rect(margin, y - 3, colWidths[0], 5, "F")
      pdf.rect(margin + colWidths[0], y - 3, colWidths[1], 5, "F")
      pdf.rect(margin + colWidths[0] + colWidths[1], y - 3, colWidths[2], 5, "F")
      pdf.rect(margin + colWidths[0] + colWidths[1] + colWidths[2], y - 3, colWidths[3], 5, "F")

      pdf.text(r.report_pdfThColor, margin + 2, y, { align: "left" })
      pdf.text(r.report_pdfThSeverity, margin + colWidths[0] + 2, y, { align: "left" })
      pdf.text(r.report_pdfThDesc, margin + colWidths[0] + colWidths[1] + 2, y, { align: "left" })
      pdf.text(r.report_pdfThRetrofitAction, margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, y, {
        align: "left",
      })
      y += 6

      const legendData = [
        { color: "#EF4444", severity: r.report_legend_sev, desc: r.report_legend_sevDesc, action: r.report_legend_sevAction },
        { color: "#C4A484", severity: r.report_legend_mod, desc: r.report_legend_modDesc, action: r.report_legend_modAction },
        { color: "#FACC15", severity: r.report_legend_low, desc: r.report_legend_lowDesc, action: r.report_legend_lowAction },
        { color: "#3B82F6", severity: r.report_legend_vlow, desc: r.report_legend_vlowDesc, action: r.report_legend_vlowAction },
      ]

      pdf.setTextColor(0, 0, 0)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)

      legendData.forEach((item, index) => {
        if (y + 12 > pageHeight - margin - 5) addNewPage()

        if (index % 2 === 0) {
          pdf.setFillColor(248, 248, 248)
          pdf.rect(margin, y - 4, contentWidth, 12, "F")
        }

        pdf.setFillColor(...hexToRgb(item.color))
        pdf.rect(margin + 2, y - 2, 6, 5, "F")

        pdf.setTextColor(0, 0, 0)
        pdf.text(item.severity, margin + colWidths[0] + 2, y + 1)
        pdf.text(wrapText(item.desc, colWidths[2] - 3, pdf), margin + colWidths[0] + colWidths[1] + 2, y + 1)
        pdf.text(wrapText(item.action, colWidths[3] - 3, pdf), margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 1)
        y += 12
      })

      y += 5

      if (manualAnnotation) {
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(10)
        pdf.text(r.report_pdfAnnotSummary, margin, y, { align: "left" })
        y += 6

        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(9)
        pdf.setFillColor(255, 248, 240)
        pdf.rect(margin, y - 3, contentWidth, 20, "F")

        const summaryLines = [
          r.report_pdfBulletDamage.replace("{p}", manualAnnotation.damagePercent.toFixed(1)),
          r.report_pdfBulletHigh.replace("{p}", manualAnnotation.severePercent.toFixed(1)),
          r.report_pdfBulletRisk.replace("{s}", String(manualAnnotation.weightedRiskScore)),
          `• ${r.report_pdfReplaceRecommended} ${manualAnnotation.replacementRecommended ? r.report_pdfReplaceYes : r.report_pdfReplaceNo}`,
          `• ${r.report_pdfInvestigationRequired} ${manualAnnotation.investigationRequired ? r.report_pdfInvYes : r.report_pdfInvNo}`,
        ]

        summaryLines.forEach((line) => {
          const lines = wrapPdfLine(line, contentWidth - 6)
          lines.forEach((ln) => {
            pdf.text(ln, margin + 3, y, { align: "left" })
            y += 4
          })
        })
      }
    }

    const totalPages = pdf.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
      pdf.text(
        r.report_pdfPageOf.replace("{i}", String(i)).replace("{n}", String(totalPages)),
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" },
      )
      pdf.text(r.report_pdfFooter, margin, pageHeight - 8, { align: "left" })
    }

    pdf.save(`retrofit-report-${Date.now()}.pdf`)
  }


  // Helper functions for PDF
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0]
  }

  const wrapText = (text: string, maxWidth: number, pdfInstance: any) => {
    const wrapped = pdfInstance.splitTextToSize(text, maxWidth)
    return wrapped.length > 1 ? wrapped[0] + "..." : wrapped[0]
  }

  const shareReport = async () => {
    const shareText = r.report_shareText
      .replace("{location}", location)
      .replace("{total}", total.toLocaleString())
      .replace("{min}", minEstimate.toLocaleString())
      .replace("{max}", maxEstimate.toLocaleString())

    if (navigator.share) {
      await navigator.share({
        title: r.report_shareTitle,
        text: shareText,
      })
      return
    }

    await navigator.clipboard.writeText(shareText)
    window.alert(r.report_clipboardOk)
  }

  const requestReview = () => {
    const subject = encodeURIComponent(r.report_mailSubject)
    const body = encodeURIComponent(
      r.report_mailBody
        .replace("{location}", location)
        .replace("{total}", total.toLocaleString())
        .replace("{min}", minEstimate.toLocaleString())
        .replace("{max}", maxEstimate.toLocaleString())
        .replace("{defect}", detectionData?.defectType ?? "N/A"),
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <div 
      className="min-h-0 bg-transparent relative"
      style={{
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px]" style={{ zIndex: 0 }} />
      
      {/* Content wrapper */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] border-b border-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-white text-[28px] sm:text-[32px] font-bold tracking-tight mb-2">{r.report_pageTitle}</h1>
          <p className="text-blue-100 text-[15px]">
            {r.report_generatedProf.replace(
              "{date}",
              new Date().toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" }),
            )}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Executive Summary */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-50 rounded-xl">
              <DollarSign className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h2 className="text-[22px] font-bold text-[#0F172A]">{r.report_execSummary}</h2>
              <p className="text-sm text-slate-600">{r.report_execSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-5 border-2 border-slate-200">
              <p className="text-sm font-medium text-slate-600 mb-1">{r.report_minEst}</p>
              <p className="text-2xl font-bold text-[#0F172A]">PKR {minEstimate.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{r.report_conservative}</p>
            </div>
            <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
              <p className="text-sm font-medium text-blue-100 mb-1">{r.report_mostLikely}</p>
              <p className="text-3xl font-bold text-white">PKR {total.toLocaleString()}</p>
              <p className="text-xs text-blue-100 mt-1">{r.report_recommendedBudget}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border-2 border-slate-200">
              <p className="text-sm font-medium text-slate-600 mb-1">{r.report_maxEst}</p>
              <p className="text-2xl font-bold text-[#0F172A]">PKR {maxEstimate.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{r.report_contingencyIncluded}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">{r.report_location}</p>
                <p className="font-semibold text-[#0F172A]">{location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">{r.report_defectsAssessed}</p>
                <p className="font-semibold text-[#0F172A]">{rows.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">{r.report_estDuration}</p>
                <p className="font-semibold text-[#0F172A]">
                  {activeEstimate?.estimatedDurationWeeks ?? "N/A"} {r.report_weeks}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">{r.report_confidence}</p>
                <p className="font-semibold text-[#0F172A]">{activeEstimate?.confidence ?? 'N/A'}%</p>
              </div>
            </div>
          </div>
        </motion.div>

        {manualAnnotation && (
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-6 sm:p-8 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-[20px] font-bold text-[#0F172A] mb-1">{r.report_annotatedTitle}</h3>
              <p className="text-sm text-slate-600">{r.report_annotatedSub}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6 sm:p-8 border-b border-slate-200 bg-slate-50">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-600 mb-1">{r.report_weightedRisk}</p>
                <p className="text-2xl font-bold text-[#0F172A]">{manualAnnotation.weightedRiskScore}/100</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-600 mb-1">{r.report_damageCoverage}</p>
                <p className="text-2xl font-bold text-[#0F172A]">{manualAnnotation.damagePercent.toFixed(1)}%</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-600 mb-1">{r.report_highSevCoverage}</p>
                <p className="text-2xl font-bold text-[#0F172A]">{manualAnnotation.severePercent.toFixed(1)}%</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_severity}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_areaPct}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_areaM2}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_estCost}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_recAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {annotationSeverityData.map((zone) => (
                    <tr key={zone.name}>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }}></span>
                          {zone.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-slate-700">{zone.value.toFixed(2)}%</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-700">{zone.areaM2.toFixed(3)}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-[#0F172A]">PKR {zone.estimatedCost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{zone.strategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(manualAnnotation.replacementRecommended || manualAnnotation.investigationRequired) && (
              <div className="px-6 sm:px-8 py-4 bg-amber-50 border-t border-amber-200 text-sm text-amber-900">
                {manualAnnotation.replacementRecommended && r.report_warnReplace}
                {manualAnnotation.investigationRequired && r.report_warnInvestigate}
              </div>
            )}
          </motion.div>
        )}

        {/* Defect Breakdown Table */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <h3 className="text-[20px] font-bold text-[#0F172A] mb-1">{r.report_defectBreakdownTitle}</h3>
            <p className="text-sm text-slate-600">{r.report_defectBreakdownSub}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_num}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_elementType}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_defectType}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_severityCol}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_estCost}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#0F172A]">{row.elementType}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.defectType}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        row.severity === 'High' ? 'bg-red-100 text-red-700' :
                        row.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {formatSeverityLabel(row.severity, r)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-[#0F172A]">PKR {row.cost.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={4} className="px-6 py-4 text-sm text-[#0F172A]">{r.report_totalEstCost}</td>
                  <td className="px-6 py-4 text-sm text-right text-[#2563EB]">PKR {total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Distribution Pie Chart */}
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-[18px] font-bold text-[#0F172A] mb-6">{r.report_costByElement}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={grouped}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${String(name)} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {grouped.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `PKR ${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Severity Distribution */}
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="text-[18px] font-bold text-[#0F172A] mb-6">{r.report_defectsBySeverity}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${formatSeverityLabel(String(name), r)}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Bar Chart Section */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-[18px] font-bold text-[#0F172A] mb-6">{r.report_costCompareElement}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={grouped}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={13} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
              <YAxis stroke="#64748B" fontSize={13} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
              <Tooltip
                formatter={(value: number) => [`PKR ${value.toLocaleString()}`, r.report_tooltipCost]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
              />
              <Bar dataKey="cost" radius={[8, 8, 0, 0]} fill="#2563EB" maxBarSize={70} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Cost Line Items Table (if available) */}
        {activeEstimate?.lineItems && activeEstimate.lineItems.length > 0 && (
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="p-6 sm:p-8 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-[20px] font-bold text-[#0F172A] mb-1">{r.report_lineItemsTitle}</h3>
              <p className="text-sm text-slate-600">{r.report_lineItemsSub}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_itemDesc}</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_qty}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_unitCost}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">{r.report_th_total}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeEstimate.lineItems.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[#0F172A]">{item.item}</td>
                      <td className="px-6 py-4 text-sm text-center text-slate-700">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-700">{item.unitCost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-right text-[#0F172A]">{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Project Assumptions */}
        {activeEstimate?.assumptions && activeEstimate.assumptions.length > 0 && (
          <motion.div
            className="bg-amber-50 rounded-xl shadow-sm border-2 border-amber-200 p-6 sm:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-[18px] font-bold text-amber-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {r.report_assumptionsTitle}
            </h3>
            <ul className="space-y-2">
              {activeEstimate.assumptions.map((assumption, index) => (
                <li key={index} className="text-sm text-amber-800 flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-4" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.45 }}
        >
          <button onClick={() => { void downloadReport() }} className="px-6 py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-semibold">
            <Download className="w-5 h-5" />
            {r.report_downloadPdf}
          </button>
          <button onClick={() => { void shareReport() }} className="px-6 py-4 bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-700 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md font-semibold">
            <Share2 className="w-5 h-5" />
            {r.report_shareSummary}
          </button>
          <button onClick={requestReview} className="px-6 py-4 bg-white hover:bg-slate-50 border-2 border-[#2563EB] text-[#2563EB] rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md font-semibold">
            <FileCheck className="w-5 h-5" />
            {r.report_engineerReview}
          </button>
        </motion.div>
      </div>
      </div>
    </div>
  )
}
