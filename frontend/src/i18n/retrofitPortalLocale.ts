/**
 * Retrofit Calculator portal strings (English + Urdu).
 * Shared with the main app `appLocale` and the embedded Retrofit Calculator Vite app.
 */
export type RetrofitPortalStrings = {
  brand: string;
  navDashboard: string;
  navDetection: string;
  navCost: string;
  navReport: string;
  systemStatus: string;
  aiModel: string;
  online: string;
  database: string;
  connected: string;
  disconnected: string;
  costHint: string;
  loc_configTitle: string;
  loc_configSubtitle: string;
  loc_selectTitle: string;
  loc_detecting: string;
  loc_useCurrent: string;
  loc_gpsHint: string;
  loc_manual: string;
  loc_selectList: string;
  loc_failTitle: string;
  loc_selectCity: string;
  loc_searchPh: string;
  loc_noCities: string;
  loc_cancel: string;
  loc_configureRates: string;
  loc_autoDetected: string;
  loc_autoDetectedBody: string;
  loc_changeLocation: string;
  loc_confirmRates: string;
  rate_surfacePrep: string;
  rate_epoxy: string;
  rate_rcJacket: string;
  rate_skilledLabor: string;
  dash_aiTitle: string;
  dash_aiSubtitle: string;
  dash_uploadTitle: string;
  dash_uploadSub: string;
  dash_dragHint: string;
  dash_readyAnalyze: string;
  dash_changeImage: string;
  dash_selectImage: string;
  dash_projectLoc: string;
  dash_changeLocRates: string;
  dash_locMeta: string;
  dash_analyzing: string;
  dash_startAi: string;
  dash_errImage: string;
  dash_errUpload: string;
  dash_errAnalysis: string;
  route_errTitle: string;
  route_errBody: string;
  route_retryUpload: string;
  route_chooseAnother: string;
  route_removeImage: string;
  ai_statusReadyTitle: string;
  ai_statusReadyBody: string;
  ai_statusAnalyzingBody: string;
  ai_statusTemporaryTitle: string;
  ai_statusTemporaryBody: string;
  ai_statusConnectionTitle: string;
  ai_statusConnectionBody: string;
  ai_statusDemandTitle: string;
  ai_statusDemandBody: string;
  ai_statusInputTitle: string;
  ai_statusRetry: string;
  ai_statusDismiss: string;
  dash_sysPerf: string;
  dash_analyzerStatus: string;
  dash_running: string;
  dash_ready: string;
  dash_currentFile: string;
  dash_notSelected: string;
  dash_quickFacts: string;
  dash_qf1: string;
  dash_qf2: string;
  dash_qf3: string;
  dash_bestPractices: string;
  dash_bestPracticesBody: string;
  ai_pageTitle: string;
  ai_pageSubtitle: string;
  ai_detectionComplete: string;
  ai_damageMarked: string;
  ai_brushSize: string;
  ai_brushOpacity: string;
  ai_clearPaint: string;
  ai_resetAiDims: string;
  ai_activeBrush: string;
  ai_paintNote: string;
  ai_severity: string;
  ai_areaPct: string;
  ai_areaM2: string;
  ai_summaryTitle: string;
  ai_elementType: string;
  ai_defectType: string;
  ai_severityLevel: string;
  ai_confidence: string;
  ai_structuralElement: string;
  ai_notDetected: string;
  ai_moderate: string;
  ai_confirmTitle: string;
  ai_step1Dims: string;
  ai_step2Damage: string;
  ai_step3Material: string;
  ai_step4Floor: string;
  ai_step5Site: string;
  ai_step6Retrofit: string;
  ai_widthCm: string;
  ai_depthCm: string;
  ai_heightCm: string;
  ai_minor: string;
  ai_severe: string;
  ai_materialType: string;
  ai_mat_rc: string;
  ai_mat_brick: string;
  ai_mat_steel: string;
  ai_mat_block: string;
  ai_mat_adobe: string;
  ai_floorLevel: string;
  ai_fl_ground: string;
  ai_fl_plus: string;
  ai_siteAccess: string;
  ai_tightAccess: string;
  ai_occupied: string;
  ai_scaffolding: string;
  ai_retrofitLevel: string;
  ai_retro_cosmetic: string;
  ai_retro_cosmetic_d: string;
  ai_retro_struct: string;
  ai_retro_struct_d: string;
  ai_retro_seismic: string;
  ai_retro_seismic_d: string;
  ai_calcCost: string;
  ai_altDefect: string;
  brush_severe: string;
  brush_moderate: string;
  brush_low: string;
  brush_verylow: string;
  insight_severe: string;
  insight_large: string;
  insight_localized: string;
  insight_none: string;
  cost_title: string;
  cost_subtitle: string;
  cost_confidenceBadge: string;
  cost_estimateTitle: string;
  cost_estimateSub: string;
  cost_calculating: string;
  cost_colItem: string;
  cost_colQty: string;
  cost_colUnit: string;
  cost_colTotal: string;
  cost_baseSubtotal: string;
  cost_severityLayer: string;
  cost_areaPct: string;
  cost_areaM2: string;
  cost_strategy: string;
  cost_summaryTitle: string;
  cost_baseRepair: string;
  cost_locFactor: string;
  cost_complexity: string;
  cost_retrofitFactor: string;
  cost_adjSubtotal: string;
  cost_contingency: string;
  cost_overhead: string;
  cost_totalEst: string;
  cost_mlFallback: string;
  cost_mlFallbackEnd: string;
  cost_methodology: string;
  cost_howTitle: string;
  cost_how1: string;
  cost_how1b: string;
  cost_how2: string;
  cost_how2b: string;
  cost_how3: string;
  cost_how3b: string;
  cost_how4: string;
  cost_how4b: string;
  cost_how5: string;
  cost_how5b: string;
  cost_accuracyTitle: string;
  cost_accuracyBody: string;
  cost_addDefect: string;
  cost_genReport: string;
  cost_item_surface: string;
  cost_item_epoxy: string;
  cost_item_rc: string;
  cost_item_labor: string;
  cost_item_investigation: string;
  cost_item_replacement: string;
  cost_qty_lump: string;
  panel_dbTitle: string;
  panel_noParams: string;
  panel_noParamsBody: string;
  panel_close: string;
  panel_group_method: string;
  panel_group_method_d: string;
  panel_group_labor: string;
  panel_group_labor_d: string;
  panel_group_severity: string;
  panel_group_severity_d: string;
  panel_group_multi: string;
  panel_group_multi_d: string;
  panel_group_overhead: string;
  panel_group_overhead_d: string;
  panel_group_extra: string;
  panel_group_extra_d: string;
  panel_save: string;
  panel_reset: string;
  panel_unsaved: string;
  panel_titleCostDb: string;
  panel_supportedCities: string;
  panel_noteRecalc: string;
  panel_saveClose: string;
  rate_severeSurf: string;
  rate_modSurf: string;
  rate_lowSurf: string;
  rate_vlowSurf: string;
  rate_locMult: string;
  rate_contingencyPct: string;
  rate_overheadPct: string;
  rate_investigation: string;
  rate_replacement: string;
  loc_errorGeneric: string;
  report_pageTitle: string;
  report_generatedProf: string;
  report_execSummary: string;
  report_execSub: string;
  report_minEst: string;
  report_conservative: string;
  report_mostLikely: string;
  report_recommendedBudget: string;
  report_maxEst: string;
  report_contingencyIncluded: string;
  report_location: string;
  report_defectsAssessed: string;
  report_estDuration: string;
  report_weeks: string;
  report_confidence: string;
  report_annotatedTitle: string;
  report_annotatedSub: string;
  report_weightedRisk: string;
  report_damageCoverage: string;
  report_highSevCoverage: string;
  report_th_severity: string;
  report_th_areaPct: string;
  report_th_areaM2: string;
  report_th_estCost: string;
  report_th_recAction: string;
  report_warnReplace: string;
  report_warnInvestigate: string;
  report_defectBreakdownTitle: string;
  report_defectBreakdownSub: string;
  report_th_num: string;
  report_th_elementType: string;
  report_th_defectType: string;
  report_th_severityCol: string;
  report_totalEstCost: string;
  report_costByElement: string;
  report_defectsBySeverity: string;
  report_costCompareElement: string;
  report_tooltipCost: string;
  report_lineItemsTitle: string;
  report_lineItemsSub: string;
  report_th_itemDesc: string;
  report_th_qty: string;
  report_th_unitCost: string;
  report_th_total: string;
  report_assumptionsTitle: string;
  report_downloadPdf: string;
  report_shareSummary: string;
  report_engineerReview: string;
  report_shareTitle: string;
  report_clipboardOk: string;
  report_mailSubject: string;
  report_mailBody: string;
  report_pdfTitle: string;
  report_pdfGenerated: string;
  report_pdfExecSummary: string;
  report_pdfMostLikely: string;
  report_pdfCostRange: string;
  report_pdfDefectsConf: string;
  report_pdfDuration: string;
  report_pdfDamageRisk: string;
  report_pdfCostBreakdown: string;
  report_pdfThElement: string;
  report_pdfThSeverity: string;
  report_pdfThEstCost: string;
  report_pdfTotalCost: string;
  report_pdfDamageViz: string;
  report_pdfOriginal: string;
  report_pdfDamageMap: string;
  report_pdfLegendTitle: string;
  report_pdfThColor: string;
  report_pdfThDesc: string;
  report_pdfThRetrofitAction: string;
  report_pdfAnnotSummary: string;
  report_pdfBulletDamage: string;
  report_pdfBulletHigh: string;
  report_pdfBulletRisk: string;
  report_pdfReplaceYes: string;
  report_pdfReplaceNo: string;
  report_pdfInvYes: string;
  report_pdfInvNo: string;
  report_pdfPageOf: string;
  report_pdfFooter: string;
  report_pdfUnableImage: string;
  report_legend_sev: string;
  report_legend_sevDesc: string;
  report_legend_sevAction: string;
  report_legend_mod: string;
  report_legend_modDesc: string;
  report_legend_modAction: string;
  report_legend_low: string;
  report_legend_lowDesc: string;
  report_legend_lowAction: string;
  report_legend_vlow: string;
  report_legend_vlowDesc: string;
  report_legend_vlowAction: string;
  report_dataHigh: string;
  report_dataModerate: string;
  report_dataLow: string;
  report_unknown: string;
  report_unknownLocation: string;
  report_shareText: string;
  report_pdfReplaceRecommended: string;
  report_pdfInvestigationRequired: string;
};

export const retrofitPortalByLang: Record<'en' | 'ur', RetrofitPortalStrings> = {
  en: {
    brand: "Retrofit Pro",
    navDashboard: "Dashboard",
    navDetection: "Detection Result",
    navCost: "Cost Breakdown",
    navReport: "Final Report",
    systemStatus: "System Status",
    aiModel: "AI Model",
    online: "Online",
    database: "Database",
    connected: "Connected",
    disconnected: "Disconnected",
    costHint: "Click to view cost parameters →",
    loc_configTitle: "Retrofit Cost Configuration",
    loc_configSubtitle: "Set your location and confirm retrofit rates before assessment",
    loc_selectTitle: "Select Your Location",
    loc_detecting: "Detecting Location...",
    loc_useCurrent: "Use My Current Location",
    loc_gpsHint: "Auto-detect using GPS/IP",
    loc_manual: "Enter Location Manually",
    loc_selectList: "Select from list",
    loc_failTitle: "Location Detection Failed",
    loc_selectCity: "Select City",
    loc_searchPh: "Search cities...",
    loc_noCities: "No cities found",
    loc_cancel: "Cancel",
    loc_configureRates: "Configure Retrofit Rates",
    loc_autoDetected: "Location Auto-Detected",
    loc_autoDetectedBody: "Rates have been automatically loaded for your city. You can edit them below.",
    loc_changeLocation: "Change Location",
    loc_confirmRates: "Confirm Rates & Continue",
    rate_surfacePrep: "Surface Preparation Rate",
    rate_epoxy: "Epoxy Injection Rate",
    rate_rcJacket: "RC Jacketing Rate",
    rate_skilledLabor: "Skilled Labor Rate",
    dash_aiTitle: "AI-Powered Retrofit Assessment",
    dash_aiSubtitle: "Upload structural defect images for instant cost estimation and analysis",
    dash_uploadTitle: "Upload Structural Defect Image",
    dash_uploadSub: "Supports: Columns, Beams, Slabs, Walls",
    dash_dragHint: "Drag and drop or click to browse",
    dash_readyAnalyze: "✓ Ready to analyze",
    dash_changeImage: "Change Image",
    dash_selectImage: "Select Image",
    dash_projectLoc: "Project Location:",
    dash_changeLocRates: "Change Location & Rates",
    dash_locMeta: "Location:",
    dash_analyzing: "Analyzing with AI...",
    dash_startAi: "Start AI Analysis",
    dash_errImage: "Please upload a valid image file.",
    dash_errUpload: "Upload an image to start AI analysis.",
    dash_errAnalysis: "AI analysis is temporarily unavailable. Please try again shortly.",
    ai_statusReadyTitle: "Ready for analysis",
    ai_statusReadyBody: "Your image is loaded. Start AI analysis when you are ready.",
    ai_statusAnalyzingBody: "Processing structural features from your image.",
    ai_statusTemporaryTitle: "Temporary service interruption",
    ai_statusTemporaryBody: "Image analysis is temporarily unavailable. Please try again later.",
    ai_statusConnectionTitle: "Connection problem",
    ai_statusConnectionBody: "Unable to reach the analysis service. Check your connection and try again.",
    ai_statusDemandTitle: "Analysis temporarily unavailable",
    ai_statusDemandBody: "AI analysis is temporarily unavailable. Please try again shortly.",
    ai_statusInputTitle: "Invalid image",
    ai_statusRetry: "Retry",
    ai_statusDismiss: "Dismiss",
    route_errTitle: "Retrofit workflow interrupted",
    route_errBody: "Something went wrong while processing your image. You can retry without refreshing the page.",
    route_retryUpload: "Retry upload",
    route_chooseAnother: "Choose another image",
    route_removeImage: "Remove image",
    dash_sysPerf: "System Performance",
    dash_analyzerStatus: "Analyzer Status",
    dash_running: "Running",
    dash_ready: "Ready",
    dash_currentFile: "Current File",
    dash_notSelected: "Not selected",
    dash_quickFacts: "Quick Facts",
    dash_qf1: "Analysis uses your uploaded image and live backend inference",
    dash_qf2: "Location-sensitive costing is applied in next steps",
    dash_qf3: "Final report can be downloaded and shared",
    dash_bestPractices: "Best Practices",
    dash_bestPracticesBody:
      "Capture clear images with good lighting and include reference objects for scale",
    ai_pageTitle: "AI Detection Results",
    ai_pageSubtitle: "Verify and confirm structural details before cost calculation",
    ai_detectionComplete: "Detection Complete",
    ai_damageMarked: "Damage marked:",
    ai_brushSize: "Brush size",
    ai_brushOpacity: "Brush opacity",
    ai_clearPaint: "Clear Paint",
    ai_resetAiDims: "Reset AI Dimensions",
    ai_activeBrush: "Active:",
    ai_paintNote:
      'Note: Unmarked areas are automatically considered as "No Damage" — only paint over damaged zones to calculate retrofit costs accurately.',
    ai_severity: "Severity",
    ai_areaPct: "Area %",
    ai_areaM2: "Area m²",
    ai_summaryTitle: "AI Detection Summary",
    ai_elementType: "Element Type",
    ai_defectType: "Defect Type",
    ai_severityLevel: "Severity Level",
    ai_confidence: "Confidence Score",
    ai_structuralElement: "Structural Element",
    ai_notDetected: "Not detected",
    ai_moderate: "Moderate",
    ai_confirmTitle: "Structural Details Confirmation",
    ai_step1Dims: "Element Dimensions",
    ai_step2Damage: "Damage Extent",
    ai_step3Material: "Material Type",
    ai_step4Floor: "Floor Level",
    ai_step5Site: "Site Conditions & Access",
    ai_step6Retrofit: "Desired Retrofit Level",
    ai_widthCm: "Width (cm)",
    ai_depthCm: "Depth (cm)",
    ai_heightCm: "Height (cm)",
    ai_minor: "Minor (0%)",
    ai_severe: "Severe (100%)",
    ai_materialType: "Material Type",
    ai_mat_rc: "Reinforced Concrete",
    ai_mat_brick: "Brick Masonry",
    ai_mat_steel: "Steel",
    ai_mat_block: "Block",
    ai_mat_adobe: "Adobe",
    ai_floorLevel: "Floor Level",
    ai_fl_ground: "Ground",
    ai_fl_plus: "4+",
    ai_siteAccess: "Site Conditions & Access",
    ai_tightAccess: "Limited site access",
    ai_occupied: "Building currently occupied",
    ai_scaffolding: "Scaffolding required",
    ai_retrofitLevel: "Desired Retrofit Level",
    ai_retro_cosmetic: "Cosmetic Repair",
    ai_retro_cosmetic_d: "Surface-level fixes only",
    ai_retro_struct: "Structural Strengthening",
    ai_retro_struct_d: "Recommended for moderate defects",
    ai_retro_seismic: "Full Seismic Upgrade",
    ai_retro_seismic_d: "Comprehensive earthquake resistance",
    ai_calcCost: "Calculate Cost Breakdown",
    ai_altDefect: "Detected defect",
    brush_severe: "Severe damage",
    brush_moderate: "Moderate damage",
    brush_low: "Low damage",
    brush_verylow: "Very low damage",
    insight_severe:
      "Severe zone exceeds 40% of element area; full element replacement should be evaluated.",
    insight_large: "Large damaged area detected; include detailed structural investigation in scope.",
    insight_localized: "Damage spread is localized; targeted retrofit strategy is feasible.",
    insight_none: "No painted damage zones detected yet.",
    cost_title: "Detailed Cost Breakdown",
    cost_subtitle: "Element-level cost analysis with regional multipliers",
    cost_confidenceBadge: "92% Confidence",
    cost_estimateTitle: "Retrofit Estimate",
    cost_estimateSub: "Location-sensitive structural retrofit costing",
    cost_calculating: "Calculating detailed costs...",
    cost_colItem: "Item Description",
    cost_colQty: "Quantity",
    cost_colUnit: "Unit Cost",
    cost_colTotal: "Total",
    cost_baseSubtotal: "Base Cost Subtotal",
    cost_severityLayer: "Severity Layer",
    cost_areaPct: "Area %",
    cost_areaM2: "Area m²",
    cost_strategy: "Retrofit Strategy",
    cost_summaryTitle: "Cost Calculation Summary",
    cost_baseRepair: "Base Repair Cost (Sum of Damage Zones)",
    cost_locFactor: "Location Factor",
    cost_complexity: "Complexity Factor",
    cost_retrofitFactor: "Retrofit Level Factor",
    cost_adjSubtotal: "Adjusted Subtotal",
    cost_contingency: "Contingency (10% of subtotal)",
    cost_overhead: "Contractor Overhead (15% of subtotal)",
    cost_totalEst: "Total Estimated Cost",
    cost_mlFallback: "ML estimate unavailable:",
    cost_mlFallbackEnd: "Using engineering fallback formula.",
    cost_methodology: "Calculation Methodology",
    cost_howTitle: "How We Calculate Costs",
    cost_how1: "Surface Preparation:",
    cost_how1b: " Based on computed element surface area and cleaning/priming rates.",
    cost_how2: "Epoxy Injection:",
    cost_how2b: " Crack length inferred from damage extent and element perimeter.",
    cost_how3: "RC Jacketing:",
    cost_how3b: " Jacket concrete quantity from geometry and retrofit-level assumptions.",
    cost_how4: "Labor:",
    cost_how4b: " Labor effort scales with damage extent, access limits, and occupancy constraints.",
    cost_how5: "Regional Adjustments:",
    cost_how5b: " Location multiplier and complexity coefficient are applied to base cost.",
    cost_accuracyTitle: "Cost Accuracy Range: ±15%",
    cost_accuracyBody:
      "Final costs may vary based on material availability, contractor rates, and site-specific conditions. This estimate serves as a professional guideline.",
    cost_addDefect: "Add Another Defect",
    cost_genReport: "Generate Full Report",
    cost_item_surface: "Surface Preparation",
    cost_item_epoxy: "Epoxy Injection",
    cost_item_rc: "RC Jacketing",
    cost_item_labor: "Skilled Labor",
    cost_item_investigation: "Detailed structural investigation",
    cost_item_replacement: "High-severity replacement allowance",
    cost_qty_lump: "Lump sum",
    panel_dbTitle: "Database Not Connected",
    panel_noParams: "No Cost Parameters Available",
    panel_noParamsBody:
      "Please configure your location and cost rates first to access the cost parameters panel.",
    panel_close: "Close",
    panel_group_method: "Retrofit Method Unit Prices",
    panel_group_method_d: "Cost per unit for each retrofit method",
    panel_group_labor: "Labor Rates",
    panel_group_labor_d: "Skilled labor and service rates",
    panel_group_severity: "Surface Repair Rates by Severity",
    panel_group_severity_d: "Unit prices for surface repairs based on damage severity",
    panel_group_multi: "Cost Multipliers & Indices",
    panel_group_multi_d: "Adjustment factors for location and project complexity",
    panel_group_overhead: "Contingency & Overhead",
    panel_group_overhead_d: "Percentage allocations for contingencies and contractor overhead",
    panel_group_extra: "Additional Cost Variables",
    panel_group_extra_d: "Fixed costs and allowances for special conditions",
    panel_save: "Save Changes",
    panel_reset: "Reset to Defaults",
    panel_unsaved: "You have unsaved changes",
    panel_titleCostDb: "Cost Parameters Database",
    panel_supportedCities: "Supported Cities",
    panel_noteRecalc:
      "All changes to cost parameters will automatically recalculate the estimated costs in the Cost Breakdown and Final Report pages in real-time.",
    panel_saveClose: "Save & Close",
    rate_severeSurf: "Severe Surface Repair Rate",
    rate_modSurf: "Moderate Surface Repair Rate",
    rate_lowSurf: "Low Surface Repair Rate",
    rate_vlowSurf: "Very Low Surface Repair Rate",
    rate_locMult: "Location Multiplier",
    rate_contingencyPct: "Contingency Percentage",
    rate_overheadPct: "Contractor Overhead Percentage",
    rate_investigation: "Investigation Cost",
    rate_replacement: "Replacement Allowance",
    loc_errorGeneric: "Failed to detect location",
    report_pageTitle: "Seismic Retrofit Assessment Report",
    report_generatedProf: "Professional Assessment • Generated {date}",
    report_execSummary: "Executive Summary",
    report_execSub: "Total cost estimate and project overview",
    report_minEst: "Minimum Estimate",
    report_conservative: "Conservative scenario",
    report_mostLikely: "Most Likely Cost",
    report_recommendedBudget: "Recommended budget",
    report_maxEst: "Maximum Estimate",
    report_contingencyIncluded: "Contingency included",
    report_location: "Location",
    report_defectsAssessed: "Defects Assessed",
    report_estDuration: "Est. Duration",
    report_weeks: "weeks",
    report_confidence: "Confidence",
    report_annotatedTitle: "Annotated Severity Segmentation",
    report_annotatedSub:
      "Manual color-coded zones converted to measurable area and retrofit strategy",
    report_weightedRisk: "Weighted Risk Score",
    report_damageCoverage: "Damage Coverage",
    report_highSevCoverage: "High-Severity Coverage",
    report_th_severity: "Severity",
    report_th_areaPct: "Area %",
    report_th_areaM2: "Area (m²)",
    report_th_estCost: "Estimated Cost",
    report_th_recAction: "Recommended Action",
    report_warnReplace:
      "Severe area threshold exceeded: full element replacement assessment is recommended. ",
    report_warnInvestigate: "Detailed structural investigation should be included in the project scope.",
    report_defectBreakdownTitle: "Detailed Defect Breakdown",
    report_defectBreakdownSub: "Complete list of identified defects and estimated costs",
    report_th_num: "#",
    report_th_elementType: "Element Type",
    report_th_defectType: "Defect Type",
    report_th_severityCol: "Severity",
    report_totalEstCost: "Total Estimated Cost",
    report_costByElement: "Cost Distribution by Element",
    report_defectsBySeverity: "Defects by Severity Level",
    report_costCompareElement: "Cost Comparison by Element Type",
    report_tooltipCost: "Cost",
    report_lineItemsTitle: "Detailed Cost Line Items",
    report_lineItemsSub: "Breakdown of materials, labor, and services",
    report_th_itemDesc: "Item Description",
    report_th_qty: "Quantity",
    report_th_unitCost: "Unit Cost (PKR)",
    report_th_total: "Total (PKR)",
    report_assumptionsTitle: "Project Assumptions & Notes",
    report_downloadPdf: "Download PDF Report",
    report_shareSummary: "Share Summary",
    report_engineerReview: "Engineer Review",
    report_shareTitle: "Retrofit Assessment Report",
    report_clipboardOk: "Report summary copied to clipboard.",
    report_mailSubject: "Engineer Review Request - Retrofit Assessment",
    report_mailBody:
      "Please review this retrofit assessment.\n\nLocation: {location}\nTotal Estimate: PKR {total}\nEstimated Range: PKR {min} - PKR {max}\nDetected Defect: {defect}",
    report_pdfTitle: "Seismic Retrofit Assessment Report",
    report_pdfGenerated: "Generated: {date} | Location: {location}",
    report_pdfExecSummary: "Executive Summary",
    report_pdfMostLikely: "Most Likely Cost: PKR {amount}",
    report_pdfCostRange: "Cost Range: PKR {min} – PKR {max}",
    report_pdfDefectsConf: "Total Defects: {n}  |  Confidence: {c}%",
    report_pdfDuration: "Estimated Duration: {w} weeks",
    report_pdfDamageRisk:
      "Damage Coverage: {d}%  |  Risk Score: {r}/100",
    report_pdfCostBreakdown: "Cost Breakdown",
    report_pdfThElement: "Element",
    report_pdfThSeverity: "Severity",
    report_pdfThEstCost: "Estimated Cost",
    report_pdfTotalCost: "TOTAL COST",
    report_pdfDamageViz: "Damage Assessment Visualization",
    report_pdfOriginal: "Original Condition",
    report_pdfDamageMap: "Damage Assessment Map",
    report_pdfLegendTitle: "Color Legend & Retrofit Actions",
    report_pdfThColor: "Color",
    report_pdfThDesc: "Description",
    report_pdfThRetrofitAction: "Retrofit Action",
    report_pdfAnnotSummary: "Damage Assessment Summary",
    report_pdfBulletDamage: "• Total Damage Coverage: {p}%",
    report_pdfBulletHigh: "• High Severity Zone: {p}%",
    report_pdfBulletRisk: "• Risk Assessment Score: {s}/100",
    report_pdfReplaceYes: "Yes – Full element replacement assessment required",
    report_pdfReplaceNo: "No – Repair strategy is feasible",
    report_pdfInvYes: "Yes – Include detailed structural assessment",
    report_pdfInvNo: "No – Standard retrofit approach sufficient",
    report_pdfPageOf: "Page {i} of {n}",
    report_pdfFooter: "Confidential | Infra Resilience360 Assessment | AI-Powered Retrofit Cost Analysis",
    report_pdfUnableImage: "Unable to load image for PDF export",
    report_legend_sev: "Severe",
    report_legend_sevDesc: "Structural integrity compromised",
    report_legend_sevAction: "Full strengthening required",
    report_legend_mod: "Moderate",
    report_legend_modDesc: "Significant cracking/spalling",
    report_legend_modAction: "Partial strengthening + repair",
    report_legend_low: "Low",
    report_legend_lowDesc: "Surface-level defects",
    report_legend_lowAction: "Minor repair treatment",
    report_legend_vlow: "Very Low",
    report_legend_vlowDesc: "Hairline or cosmetic defects",
    report_legend_vlowAction: "Monitoring/preventive care",
    report_dataHigh: "High",
    report_dataModerate: "Moderate",
    report_dataLow: "Low",
    report_unknown: "Unknown",
    report_unknownLocation: "Unknown location",
    report_shareText:
      "Retrofit estimate for {location}: PKR {total} (range PKR {min} - PKR {max})",
    report_pdfReplaceRecommended: "Replacement Recommended:",
    report_pdfInvestigationRequired: "Investigation Required:",
  },
  ur: {
    brand: "ریٹروفٹ پرو",
    navDashboard: "ڈیش بورڈ",
    navDetection: "نتیجۂ تشخیص",
    navCost: "لاگت کی تفصیل",
    navReport: "حتمی رپورٹ",
    systemStatus: "سسٹم کی حالت",
    aiModel: "مصنوعی ذہانت ماڈل",
    online: "آن لائن",
    database: "ڈیٹا بیس",
    connected: "مربوط",
    disconnected: "غیر مربوط",
    costHint: "لاگت کے پیرامیٹرز دیکھنے کے لیے کلک کریں ←",
    loc_configTitle: "ریٹروفٹ لاگت کی ترتیب",
    loc_configSubtitle: "تشخیص سے پہلے مقام اور شرحیں تصدیق کریں",
    loc_selectTitle: "اپنا مقام منتخب کریں",
    loc_detecting: "مقام کا پتہ لگایا جا رہا ہے…",
    loc_useCurrent: "موجودہ مقام استعمال کریں",
    loc_gpsHint: "جی پی ایس / آئی پی سے خودکار",
    loc_manual: "دستی طور پر مقام درج کریں",
    loc_selectList: "فہرست سے منتخب کریں",
    loc_failTitle: "مقام کی شناخت ناکام",
    loc_selectCity: "شہر منتخب کریں",
    loc_searchPh: "شہر تلاش کریں…",
    loc_noCities: "کوئی شہر نہیں ملا",
    loc_cancel: "منسوخ",
    loc_configureRates: "ریٹروفٹ شرحیں ترتیب دیں",
    loc_autoDetected: "مقام خودکار پہچانا گیا",
    loc_autoDetectedBody: "آپ کے شہر کی شرحیں لوڈ ہو گئیں۔ ذیل میں ترمیم کر سکتے ہیں۔",
    loc_changeLocation: "مقام تبدیل کریں",
    loc_confirmRates: "شرحیں تصدیق کریں اور آگے بڑھیں",
    rate_surfacePrep: "سطح تیاری کی شرح",
    rate_epoxy: "ایپاکسی انجیکشن شرح",
    rate_rcJacket: "آر سی جیکٹنگ شرح",
    rate_skilledLabor: "ماہر مزدوری کی شرح",
    dash_aiTitle: "مصنوعی ذہانت سے ریٹروفٹ تشخیص",
    dash_aiSubtitle: "فوری لاگت کے لیے ساختی نقص کی تصویر اپ لوڈ کریں",
    dash_uploadTitle: "ساختی نقص کی تصویر اپ لوڈ کریں",
    dash_uploadSub: "کالم، بیم، سلیب، دیواریں",
    dash_dragHint: "گھسیٹیں یا براؤز کریں",
    dash_readyAnalyze: "✓ تجزیے کے لیے تیار",
    dash_changeImage: "تصویر تبدیل کریں",
    dash_selectImage: "تصویر منتخب کریں",
    dash_projectLoc: "منصوبے کا مقام:",
    dash_changeLocRates: "مقام اور شرحیں تبدیل کریں",
    dash_locMeta: "مقام:",
    dash_analyzing: "مصنوعی ذہانت سے تجزیہ…",
    dash_startAi: "مصنوعی ذہانت تجزیہ شروع کریں",
    dash_errImage: "درست تصویر فائل اپ لوڈ کریں۔",
    dash_errUpload: "تجزیے کے لیے تصویر اپ لوڈ کریں۔",
    dash_errAnalysis: "AI analysis is temporarily unavailable. Please try again shortly.",
    ai_statusReadyTitle: "تجزیے کے لیے تیار",
    ai_statusReadyBody: "آپ کی تصویر لوڈ ہو گئی ہے۔ جب تیار ہوں تو AI تجزیہ شروع کریں۔",
    ai_statusAnalyzingBody: "آپ کی تصویر سے ساختی خصوصیات پر کارروائی ہو رہی ہے۔",
    ai_statusTemporaryTitle: "عارضی سروس رکاوٹ",
    ai_statusTemporaryBody: "تصویر کا تجزیہ عارضی طور پر دستیاب نہیں۔ براہ کرم بعد میں دوبارہ کوشش کریں۔",
    ai_statusConnectionTitle: "رابطے کا مسئلہ",
    ai_statusConnectionBody: "تجزیہ سروس تک رسائی ممکن نہیں۔ اپنا انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔",
    ai_statusDemandTitle: "تجزیہ عارضی طور پر دستیاب نہیں",
    ai_statusDemandBody: "AI تجزیہ عارضی طور پر دستیاب نہیں۔ براہ کرم جلد دوبارہ کوشش کریں۔",
    ai_statusInputTitle: "غلط تصویر",
    ai_statusRetry: "دوبارہ کوشش",
    ai_statusDismiss: "بند کریں",
    route_errTitle: "ریٹروفٹ ورک فلو میں رکاوٹ",
    route_errBody: "تصویر پر کارروائی کے دوران خرابی ہوئی۔ صفحہ ریفریش کیے بغیر دوبارہ کوشش کریں۔",
    route_retryUpload: "دوبارہ اپ لوڈ",
    route_chooseAnother: "دوسری تصویر منتخب کریں",
    route_removeImage: "تصویر ہٹائیں",
    dash_sysPerf: "سسٹم کی کارکردگی",
    dash_analyzerStatus: "تجزیہ کار کی حالت",
    dash_running: "چل رہا ہے",
    dash_ready: "تیار",
    dash_currentFile: "موجودہ فائل",
    dash_notSelected: "منتخب نہیں",
    dash_quickFacts: "فوری معلومات",
    dash_qf1: "اپ لوڈ شدہ تصویر اور بیک اینڈ سے تجزیہ",
    dash_qf2: "اگلے مراحل میں مقام کے مطابق لاگت",
    dash_qf3: "حتمی رپورٹ ڈاؤن لوڈ اور اشتراک",
    dash_bestPractices: "بہترین طریقے",
    dash_bestPracticesBody: "اچھی روشنی میں واضح تصویر لیں اور پیمانے کے لیے حوالہ شامل کریں",
    ai_pageTitle: "مصنوعی ذہانت کے نتائج",
    ai_pageSubtitle: "لاگت سے پہلے ساختی تفصیلات تصدیق کریں",
    ai_detectionComplete: "تشخیص مکمل",
    ai_damageMarked: "نقصان نشان زد:",
    ai_brushSize: "برش سائز",
    ai_brushOpacity: "برش دھندلاپن",
    ai_clearPaint: "رنگ صاف کریں",
    ai_resetAiDims: "مصنوعی ذہانت کے پیمانے دوبارہ",
    ai_activeBrush: "فعال:",
    ai_paintNote:
      "نوٹ: غیر نشان زد علاقے خودکار طور پر «کوئی نقصان نہیں» سمجھے جاتے ہیں — درست لاگت کے لیے صرف نقصان والی جگہوں پر رنگ کریں۔",
    ai_severity: "شدت",
    ai_areaPct: "رقبہ ٪",
    ai_areaM2: "رقبہ م²",
    ai_summaryTitle: "مصنوعی ذہانت کا خلاصہ",
    ai_elementType: "عنصر کی قسم",
    ai_defectType: "نقص کی قسم",
    ai_severityLevel: "شدت کی سطح",
    ai_confidence: "اعتماد کا اسکور",
    ai_structuralElement: "ساختی عنصر",
    ai_notDetected: "نہیں ملا",
    ai_moderate: "درمیانہ",
    ai_confirmTitle: "ساختی تفصیلات کی تصدیق",
    ai_step1Dims: "عنصر کے پیمانے",
    ai_step2Damage: "نقصان کی حد",
    ai_step3Material: "مواد کی قسم",
    ai_step4Floor: "منزل",
    ai_step5Site: "سائٹ کی صورت حال اور رسائی",
    ai_step6Retrofit: "مطلوبہ ریٹروفٹ سطح",
    ai_widthCm: "چوڑائی (سینٹی میٹر)",
    ai_depthCm: "گہرائی (سینٹی میٹر)",
    ai_heightCm: "اونچائی (سینٹی میٹر)",
    ai_minor: "معمولی (۰٪)",
    ai_severe: "شدید (۱۰۰٪)",
    ai_materialType: "مواد کی قسم",
    ai_mat_rc: "تقویت شدہ کنکریٹ",
    ai_mat_brick: "اینٹ کی چنائی",
    ai_mat_steel: "اسٹیل",
    ai_mat_block: "بلاک",
    ai_mat_adobe: "کچا مٹی",
    ai_floorLevel: "منزل",
    ai_fl_ground: "زمین",
    ai_fl_plus: "۴+",
    ai_siteAccess: "سائٹ کی صورت حال اور رسائی",
    ai_tightAccess: "محدود سائٹ رسائی",
    ai_occupied: "عمارت آباد",
    ai_scaffolding: "سکیفولڈنگ درکار",
    ai_retrofitLevel: "مطلوبہ ریٹروفٹ سطح",
    ai_retro_cosmetic: "سطحی مرمت",
    ai_retro_cosmetic_d: "صرف سطحی درستگی",
    ai_retro_struct: "ساختی تقویت",
    ai_retro_struct_d: "درمیانے نقص کے لیے تجویز",
    ai_retro_seismic: "مکمل زلزلے کی اپ گریڈ",
    ai_retro_seismic_d: "زلزلے کے خلاف جامع مزاحمت",
    ai_calcCost: "لاگت کی تفصیل نکالیں",
    ai_altDefect: "پایا گیا نقص",
    brush_severe: "شدید نقصان",
    brush_moderate: "درمیانہ نقصان",
    brush_low: "ہلکا نقصان",
    brush_verylow: "بہت ہلکا نقصان",
    insight_severe:
      "شدید زون عنصر کے ۴۰٪ سے زیادہ؛ مکمل تبدیلی پر غور کریں۔",
    insight_large: "بڑا نقصان دکھائی دیا؛ تفصیلی ساختی تحقیق شامل کریں۔",
    insight_localized: "نقصان محدود ہے؛ ہدف بند ریٹروفٹ ممکن ہے۔",
    insight_none: "ابھی کوئی رنگ شدہ نقصان کا زون نہیں۔",
    cost_title: "تفصیلی لاگت",
    cost_subtitle: "علاقائی ضارب کے ساتھ عنصر وار تجزیہ",
    cost_confidenceBadge: "۹۲٪ اعتماد",
    cost_estimateTitle: "ریٹروفٹ تخمینہ",
    cost_estimateSub: "مقام کے مطابق ساختی لاگت",
    cost_calculating: "تفصیلی لاگت نکالی جا رہی ہے…",
    cost_colItem: "شے",
    cost_colQty: "مقدار",
    cost_colUnit: "یونٹ لاگت",
    cost_colTotal: "کل",
    cost_baseSubtotal: "بنیادی ذیلی کل",
    cost_severityLayer: "شدت کی پرت",
    cost_areaPct: "رقبہ ٪",
    cost_areaM2: "رقبہ م²",
    cost_strategy: "ریٹروفٹ حکمت عملی",
    cost_summaryTitle: "لاگت کا خلاصہ",
    cost_baseRepair: "بنیادی مرمت (نقصان کے زونز کا مجموعہ)",
    cost_locFactor: "مقام کا عنصر",
    cost_complexity: "پیچیدگی کا عنصر",
    cost_retrofitFactor: "ریٹروفٹ سطح کا عنصر",
    cost_adjSubtotal: "ترمیم شدہ ذیلی کل",
    cost_contingency: "احتیاط (ذیلی کل کا ۱۰٪)",
    cost_overhead: "ٹھیکیدار اوور ہیڈ (ذیلی کل کا ۱۵٪)",
    cost_totalEst: "کل تخمینہ شدہ لاگت",
    cost_mlFallback: "ایم ایل تخمینہ دستیاب نہیں:",
    cost_mlFallbackEnd: "انجینئرنگ فارمولہ استعمال ہو رہا ہے۔",
    cost_methodology: "حساب کی طریقہ",
    cost_howTitle: "لاگت کیسے نکالی جاتی ہے",
    cost_how1: "سطح تیاری:",
    cost_how1b: " عنصر کے رقبے اور صفائی کی شرحوں سے۔",
    cost_how2: "ایپاکسی انجیکشن:",
    cost_how2b: " نقصان کی حد اور گھیراؤ سے دراڑ کی لمبائی۔",
    cost_how3: "آر سی جیکٹنگ:",
    cost_how3b: " جیومیٹری اور ریٹروفٹ سطح سے کنکریٹ۔",
    cost_how4: "مزدوری:",
    cost_how4b: " نقصان، رسائی، اور آباد کاری سے مشقت۔",
    cost_how5: "علاقائی ترمیم:",
    cost_how5b: " بنیادی لاگت پر مقام اور پیچیدگی کے ضارب۔",
    cost_accuracyTitle: "درستگی کی حد: ±۱۵٪",
    cost_accuracyBody:
      "حتمی لاگت مواد، ٹھیکیدار، اور سائٹ کی صورت سے بدل سکتی ہے۔ یہ پیشہ ورانہ رہنما ہے۔",
    cost_addDefect: "ایک اور نقص شامل کریں",
    cost_genReport: "مکمل رپورٹ بنائیں",
    cost_item_surface: "سطح تیاری",
    cost_item_epoxy: "ایپاکسی انجیکشن",
    cost_item_rc: "آر سی جیکٹنگ",
    cost_item_labor: "ماہر مزدوری",
    cost_item_investigation: "تفصیلی ساختی تحقیق",
    cost_item_replacement: "شدید تبدیلی کی رعایت",
    cost_qty_lump: "ایک مرتبہ",
    panel_dbTitle: "ڈیٹا بیس مربوط نہیں",
    panel_noParams: "لاگت کے پیرامیٹرز نہیں",
    panel_noParamsBody:
      "پہلے مقام اور شرحیں ترتیب دیں، پھر یہ پینل کھولیں۔",
    panel_close: "بند کریں",
    panel_group_method: "ریٹروفٹ یونٹ قیمتیں",
    panel_group_method_d: "ہر طریقے کی فی یونٹ لاگت",
    panel_group_labor: "مزدوری کی شرحیں",
    panel_group_labor_d: "ماہر مزدوری اور خدمات",
    panel_group_severity: "شدت کے مطابق سطح مرمت",
    panel_group_severity_d: "نقصان کی سطح کے مطابق فی یونٹ",
    panel_group_multi: "ضارب اور اشاریہ",
    panel_group_multi_d: "مقام اور منصوبے کی پیچیدگی",
    panel_group_overhead: "احتیاط اور اوور ہیڈ",
    panel_group_overhead_d: "فیصد کی تقسیم",
    panel_group_extra: "اضافی لاگت",
    panel_group_extra_d: "خاص حالات کے لیے رقوم",
    panel_save: "تبدیلیاں محفوظ کریں",
    panel_reset: "طے شدہ پر واپس",
    panel_unsaved: "غیر محفوظ تبدیلیاں",
    panel_titleCostDb: "لاگت پیرامیٹرز ڈیٹا بیس",
    panel_supportedCities: "معاون شہر",
    panel_noteRecalc:
      "لاگت کی تبدیلیاں خودکار طور پر لاگت کی تفصیل اور حتمی رپورٹ میں دوبارہ حساب کریں گی۔",
    panel_saveClose: "محفوظ کریں اور بند کریں",
    rate_severeSurf: "شدید سطح مرمت شرح",
    rate_modSurf: "درمیانہ سطح مرمت شرح",
    rate_lowSurf: "ہلکی سطح مرمت شرح",
    rate_vlowSurf: "بہت ہلکی سطح مرمت شرح",
    rate_locMult: "مقام ضارب",
    rate_contingencyPct: "احتیاط فیصد",
    rate_overheadPct: "ٹھیکیدار اوور ہیڈ فیصد",
    rate_investigation: "تحقیق کی لاگت",
    rate_replacement: "تبدیلی کی رعایت",
    loc_errorGeneric: "مقام کا پتہ نہ لگ سکا",
    report_pageTitle: "زلزلے کے ریٹروفٹ کی تشخیصی رپورٹ",
    report_generatedProf: "پیشہ ورانہ تشخیص • تیار کردہ {date}",
    report_execSummary: "مجموعی خلاصہ",
    report_execSub: "کل لاگت کا تخمینہ اور منصوبے کا جائزہ",
    report_minEst: "کم از کم تخمینہ",
    report_conservative: "احتیاطی منظرنامہ",
    report_mostLikely: "غالب ترین لاگت",
    report_recommendedBudget: "تجویز شدہ بجٹ",
    report_maxEst: "زیادہ سے زیادہ تخمینہ",
    report_contingencyIncluded: "احتیاط شامل",
    report_location: "مقام",
    report_defectsAssessed: "جانچے گئے نقص",
    report_estDuration: "متوقع مدت",
    report_weeks: "ہفتے",
    report_confidence: "اعتماد",
    report_annotatedTitle: "نشان زد شدت کی تقسیم",
    report_annotatedSub:
      "رنگ کوڈ والے زونز سے پیمائشی رقبہ اور ریٹروفٹ حکمت عملی",
    report_weightedRisk: "وزنی خطرے کا اسکور",
    report_damageCoverage: "نقصان کی حد",
    report_highSevCoverage: "شدید نقصان کی حد",
    report_th_severity: "شدت",
    report_th_areaPct: "رقبہ ٪",
    report_th_areaM2: "رقبہ (م²)",
    report_th_estCost: "تخمینہ شدہ لاگت",
    report_th_recAction: "تجویز کردہ اقدام",
    report_warnReplace:
      "شدید علاقے کی حد سے زیادہ؛ مکمل عنصر کی تبدیلی کی جانچ تجویز ہے۔ ",
    report_warnInvestigate: "تفصیلی ساختی تحقیق منصوبے میں شامل ہونی چاہیے۔",
    report_defectBreakdownTitle: "نقصان کی تفصیلی فہرست",
    report_defectBreakdownSub: "شناخت شدہ نقص اور تخمینہ شدہ لاگت",
    report_th_num: "#",
    report_th_elementType: "عنصر کی قسم",
    report_th_defectType: "نقص کی قسم",
    report_th_severityCol: "شدت",
    report_totalEstCost: "کل تخمینہ شدہ لاگت",
    report_costByElement: "عنصر کے مطابق لاگت",
    report_defectsBySeverity: "شدت کی سطح کے مطابق نقص",
    report_costCompareElement: "عنصر کی قسم کے مطابق موازنہ",
    report_tooltipCost: "لاگت",
    report_lineItemsTitle: "تفصیلی لاگت کی اشیاء",
    report_lineItemsSub: "مواد، مزدوری، اور خدمات کی تفریق",
    report_th_itemDesc: "شے کی وضاحت",
    report_th_qty: "مقدار",
    report_th_unitCost: "یونٹ لاگت (PKR)",
    report_th_total: "کل (PKR)",
    report_assumptionsTitle: "منصوبے کے مفروضے اور نوٹس",
    report_downloadPdf: "پی ڈی ایف رپورٹ ڈاؤن لوڈ",
    report_shareSummary: "خلاصہ شیئر کریں",
    report_engineerReview: "انجینئر جائزہ",
    report_shareTitle: "ریٹروفٹ تشخیصی رپورٹ",
    report_clipboardOk: "رپورٹ کا خلاصہ کلپ بورڈ پر کاپی ہو گیا۔",
    report_mailSubject: "انجینئر جائزے کی درخواست — ریٹروفٹ تشخیص",
    report_mailBody:
      "براہ کرم اس ریٹروفٹ تشخیص کا جائزہ لیں۔\n\nمقام: {location}\nکل تخمینہ: PKR {total}\nتخمینہ حد: PKR {min} - PKR {max}\nپایا گیا نقص: {defect}",
    report_pdfTitle: "زلزلے کے ریٹروفٹ کی تشخیصی رپورٹ",
    report_pdfGenerated: "تیار: {date} | مقام: {location}",
    report_pdfExecSummary: "مجموعی خلاصہ",
    report_pdfMostLikely: "غالب ترین لاگت: PKR {amount}",
    report_pdfCostRange: "لاگت کی حد: PKR {min} – PKR {max}",
    report_pdfDefectsConf: "کل نقص: {n}  |  اعتماد: {c}%",
    report_pdfDuration: "متوقع مدت: {w} ہفتے",
    report_pdfDamageRisk: "نقصان کی حد: {d}%  |  خطرے کا اسکور: {r}/100",
    report_pdfCostBreakdown: "لاگت کی تفریق",
    report_pdfThElement: "عنصر",
    report_pdfThSeverity: "شدت",
    report_pdfThEstCost: "تخمینہ شدہ لاگت",
    report_pdfTotalCost: "کل لاگت",
    report_pdfDamageViz: "نقصان کی بصری تشخیص",
    report_pdfOriginal: "اصل حالت",
    report_pdfDamageMap: "نقصان کا نقشہ",
    report_pdfLegendTitle: "رنگ کی وضاحت اور ریٹروفٹ اقدامات",
    report_pdfThColor: "رنگ",
    report_pdfThDesc: "تفصیل",
    report_pdfThRetrofitAction: "ریٹروفٹ اقدام",
    report_pdfAnnotSummary: "نقصان کی تشخیص کا خلاصہ",
    report_pdfBulletDamage: "• کل نقصان کی حد: {p}%",
    report_pdfBulletHigh: "• شدید زون: {p}%",
    report_pdfBulletRisk: "• خطرے کا جائزہ اسکور: {s}/100",
    report_pdfReplaceYes: "ہاں — مکمل عنصر کی تبدیلی کی جانچ درکار",
    report_pdfReplaceNo: "نہیں — مرمت کی حکمت عملی ممکن ہے",
    report_pdfInvYes: "ہاں — تفصیلی ساختی جانچ شامل کریں",
    report_pdfInvNo: "نہیں — معیاری ریٹروفٹ کافی ہے",
    report_pdfPageOf: "صفحہ {i} از {n}",
    report_pdfFooter: "خفیہ | Infra Resilience360 تشخیص | مصنوعی ذہانت سے ریٹروفٹ لاگت",
    report_pdfUnableImage: "پی ڈی ایف کے لیے تصویر لوڈ نہیں ہو سکی",
    report_legend_sev: "شدید",
    report_legend_sevDesc: "ساختی سالمیت متاثر",
    report_legend_sevAction: "مکمل تقویت درکار",
    report_legend_mod: "درمیانہ",
    report_legend_modDesc: "نمایاں درزیں/چھلکنا",
    report_legend_modAction: "جزوی تقویت + مرمت",
    report_legend_low: "ہلکا",
    report_legend_lowDesc: "سطحی نقص",
    report_legend_lowAction: "ہلکی مرمت",
    report_legend_vlow: "بہت ہلکا",
    report_legend_vlowDesc: "باریک یا ظاہری نقص",
    report_legend_vlowAction: "نگرانی/احتیاطی دیکھ بھال",
    report_dataHigh: "زیادہ",
    report_dataModerate: "درمیانہ",
    report_dataLow: "ہلکا",
    report_unknown: "نامعلوم",
    report_unknownLocation: "نامعلوم مقام",
    report_shareText:
      "{location} کے لیے ریٹروفٹ تخمینہ: PKR {total} (حد PKR {min} - PKR {max})",
    report_pdfReplaceRecommended: "تبدیلی کی سفارش:",
    report_pdfInvestigationRequired: "تحقیق درکار:",
  },
};
