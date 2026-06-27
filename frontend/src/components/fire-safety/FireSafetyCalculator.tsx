import { useMemo, useState } from 'react'
import type { UniversalElementPayload } from '../../types/universalElement'
import type { AppLocaleStrings } from '../../i18n/appLocale'
import { usePageConfigElementsContext } from '../../context/PageConfigElementsContext'
import { getCmsElement } from '../../utils/getCmsElement'
import { migrateToBilingual, resolveBilingual } from '../../utils/bilingualText'
import { mergeCms } from '../../utils/mergeCms'
import { CmsText } from '../cms/CmsText'

type FireSafetyLabels = AppLocaleStrings['fireSafety']

type RiskLevel = 'Low' | 'Medium' | 'High'

type CalculationResult = {
  riskScore: number
  riskLevel: RiskLevel
  extinguishers: number
  recommendations: string[]
  extinguisherTypes: string[]
  placementGuidelines: string[]
}

const BUILDING_TYPE_VALUES = [
  'Residential',
  'Commercial',
  'Industrial',
  'Educational',
  'Healthcare',
  'Mixed Use',
  'Warehouse',
  'Office Building',
] as const

const riskBadgeClass = (riskLevel: RiskLevel) => {
  if (riskLevel === 'Low') return 'fire-safety-badge fire-safety-badge-low'
  if (riskLevel === 'Medium') return 'fire-safety-badge fire-safety-badge-medium'
  return 'fire-safety-badge fire-safety-badge-high'
}

const riskBadgeLabel = (labels: FireSafetyLabels, riskLevel: RiskLevel) => {
  if (riskLevel === 'Low') return labels.riskLowBadge
  if (riskLevel === 'Medium') return labels.riskMediumBadge
  return labels.riskHighBadge
}

const generateRecommendations = (
  labels: FireSafetyLabels,
  riskLevel: RiskLevel,
  floorsNum: number,
  areaNum: number,
  occupantsNum: number,
  hasKitchen: boolean,
  electricalLevel: 'low' | 'medium' | 'high',
  hasFlammable: boolean,
) => {
  const recommendations: string[] = []

  if (riskLevel === 'High') {
    recommendations.push(labels.recoHigh1, labels.recoHigh2, labels.recoHigh3)
  } else if (riskLevel === 'Medium') {
    recommendations.push(labels.recoMed1, labels.recoMed2)
  } else {
    recommendations.push(labels.recoLow1, labels.recoLow2)
  }

  if (floorsNum >= 6) {
    recommendations.push(labels.recoFloors6a, labels.recoFloors6b)
  } else if (floorsNum >= 3) {
    recommendations.push(labels.recoFloors3)
  }

  if (hasKitchen) {
    recommendations.push(labels.recoKitchen)
  }

  if (electricalLevel === 'high') {
    recommendations.push(labels.recoElectrical)
  }

  if (hasFlammable) {
    recommendations.push(labels.recoFlammable1, labels.recoFlammable2)
  }

  if (occupantsNum > 50) {
    recommendations.push(labels.recoOccupants)
  }

  if (areaNum > 5000) {
    recommendations.push(labels.recoArea)
  }

  return recommendations
}

const generateExtinguisherTypes = (
  labels: FireSafetyLabels,
  hasKitchen: boolean,
  electricalLevel: 'low' | 'medium' | 'high',
  hasFlammable: boolean,
) => {
  const types = [labels.extinguisherClassA]

  if (electricalLevel !== 'low') {
    types.push(labels.extinguisherClassC)
  }

  if (hasFlammable) {
    types.push(labels.extinguisherClassB)
  }

  if (hasKitchen) {
    types.push(labels.extinguisherClassK)
  }

  return types
}

const generatePlacementGuidelines = (
  labels: FireSafetyLabels,
  totalExtinguishers: number,
  floorsNum: number,
  hasKitchen: boolean,
  hasFlammable: boolean,
) => {
  const basePerFloor = Math.max(1, Math.floor(totalExtinguishers / floorsNum))
  const remainder = Math.max(0, totalExtinguishers - basePerFloor * floorsNum)

  const floorPlan = Array.from({ length: floorsNum }).map((_, index) => {
    const floorNo = index + 1
    const count = basePerFloor + (index < remainder ? 1 : 0)
    return labels.floorPlanLine.replace('{floor}', String(floorNo)).replace('{count}', String(count))
  })

  const rules = [
    labels.placementRule1,
    labels.placementRule2,
    labels.placementRule3,
    labels.placementRule4,
  ]

  if (hasKitchen) {
    rules.push(labels.placementKitchen)
  }

  if (hasFlammable) {
    rules.push(labels.placementFlammable)
  }

  return [...floorPlan, ...rules]
}

type FireSafetyCalculatorProps = {
  labels: FireSafetyLabels
}

export default function FireSafetyCalculator({ labels }: FireSafetyCalculatorProps) {
  const cms = usePageConfigElementsContext()
  const cmsLang = cms?.language ?? 'en'
  const cmsLine = (id: string, fallback: string) => {
    const el = getCmsElement(cms?.elements, id)
    const defaultData: UniversalElementPayload = {
      text: migrateToBilingual(fallback),
    }
    const merged = mergeCms(defaultData, el)
    return resolveBilingual(merged.text, cmsLang, fallback)
  }

  const [buildingType, setBuildingType] = useState('')
  const [area, setArea] = useState('')
  const [floors, setFloors] = useState('')
  const [occupants, setOccupants] = useState('')
  const [kitchen, setKitchen] = useState<'yes' | 'no'>('no')
  const [electrical, setElectrical] = useState<'low' | 'medium' | 'high'>('low')
  const [flammable, setFlammable] = useState<'yes' | 'no'>('no')
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [validationError, setValidationError] = useState('')

  const canCalculate = useMemo(
    () => Boolean(buildingType && Number(area) > 0 && Number(floors) > 0 && Number(occupants) > 0),
    [buildingType, area, floors, occupants],
  )

  const calculateRisk = () => {
    const areaNum = Number.parseFloat(area)
    const floorsNum = Number.parseInt(floors, 10)
    const occupantsNum = Number.parseInt(occupants, 10)

    if (!buildingType || !Number.isFinite(areaNum) || !Number.isFinite(floorsNum) || !Number.isFinite(occupantsNum)) {
      setValidationError(labels.validationError)
      return
    }

    setValidationError('')

    let riskScore = 0

    if (floorsNum >= 3) riskScore += 2
    if (floorsNum >= 6) riskScore += 3

    if (occupantsNum > 10) riskScore += 2
    if (occupantsNum > 50) riskScore += 3

    if (areaNum > 2000) riskScore += 2
    if (areaNum > 5000) riskScore += 3

    if (kitchen === 'yes') riskScore += 2
    if (electrical === 'high') riskScore += 3
    if (flammable === 'yes') riskScore += 4

    let riskLevel: RiskLevel = 'Low'
    if (riskScore > 8) {
      riskLevel = 'High'
    } else if (riskScore > 4) {
      riskLevel = 'Medium'
    }

    let extinguishers = Math.ceil(areaNum / 2000)
    if (floorsNum > 1) extinguishers += floorsNum
    if (riskLevel === 'High') extinguishers += 2
    if (kitchen === 'yes') extinguishers += 1

    const recommendations = generateRecommendations(
      labels,
      riskLevel,
      floorsNum,
      areaNum,
      occupantsNum,
      kitchen === 'yes',
      electrical,
      flammable === 'yes',
    )

    const extinguisherTypes = generateExtinguisherTypes(labels, kitchen === 'yes', electrical, flammable === 'yes')
    const placementGuidelines = generatePlacementGuidelines(labels, extinguishers, floorsNum, kitchen === 'yes', flammable === 'yes')

    setResult({
      riskScore,
      riskLevel,
      extinguishers,
      recommendations,
      extinguisherTypes,
      placementGuidelines,
    })
  }

  const reset = () => {
    setBuildingType('')
    setArea('')
    setFloors('')
    setOccupants('')
    setKitchen('no')
    setElectrical('low')
    setFlammable('no')
    setResult(null)
    setValidationError('')
  }

  return (
    <div className="fire-safety-root">
      <CmsText className="fire-safety-description" id="readiness.fire.description" fallback={labels.description} />

      <div className="fire-safety-grid">
        <div className="fire-safety-card">
          <CmsText as="h4" id="readiness.fire.buildingInformation" fallback={labels.buildingInformation} />

          <label>
            <CmsText as="span" id="readiness.fire.label.buildingType" fallback={labels.buildingType} />
            <select value={buildingType} onChange={(event) => setBuildingType(event.target.value)}>
              <option value="">{cmsLine('readiness.fire.option.selectBuildingType', labels.selectBuildingType)}</option>
              {BUILDING_TYPE_VALUES.map((value, index) => (
                <option key={value} value={value}>
                  {labels.buildingTypes[index] ?? value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <CmsText as="span" id="readiness.fire.label.areaSqFt" fallback={labels.areaSqFt} />
            <input type="number" min={1} value={area} onChange={(event) => setArea(event.target.value)} />
          </label>

          <label>
            <CmsText as="span" id="readiness.fire.label.numberOfFloors" fallback={labels.numberOfFloors} />
            <input type="number" min={1} value={floors} onChange={(event) => setFloors(event.target.value)} />
          </label>

          <label>
            <CmsText as="span" id="readiness.fire.label.numberOfOccupants" fallback={labels.numberOfOccupants} />
            <input type="number" min={1} value={occupants} onChange={(event) => setOccupants(event.target.value)} />
          </label>

          <label>
            <CmsText as="span" id="readiness.fire.label.kitchenPresent" fallback={labels.kitchenPresent} />
            <select value={kitchen} onChange={(event) => setKitchen(event.target.value as 'yes' | 'no')}>
              <option value="no">{cmsLine('readiness.fire.option.no', labels.optionNo)}</option>
              <option value="yes">{cmsLine('readiness.fire.option.yes', labels.optionYes)}</option>
            </select>
          </label>

          <label>
            <CmsText as="span" id="readiness.fire.label.electricalLoad" fallback={labels.electricalLoad} />
            <select value={electrical} onChange={(event) => setElectrical(event.target.value as 'low' | 'medium' | 'high')}>
              <option value="low">{cmsLine('readiness.fire.option.electricalLow', labels.electricalLow)}</option>
              <option value="medium">{cmsLine('readiness.fire.option.electricalMedium', labels.electricalMedium)}</option>
              <option value="high">{cmsLine('readiness.fire.option.electricalHigh', labels.electricalHigh)}</option>
            </select>
          </label>

          <label>
            <CmsText as="span" id="readiness.fire.label.flammableMaterialsStored" fallback={labels.flammableMaterialsStored} />
            <select value={flammable} onChange={(event) => setFlammable(event.target.value as 'yes' | 'no')}>
              <option value="no">{cmsLine('readiness.fire.option.noFlammable', labels.optionNo)}</option>
              <option value="yes">{cmsLine('readiness.fire.option.yesFlammable', labels.optionYes)}</option>
            </select>
          </label>

          {validationError && <p className="fire-safety-error">{validationError}</p>}

          <div className="fire-safety-actions">
            <button type="button" onClick={calculateRisk} disabled={!canCalculate}>
              <CmsText as="span" id="readiness.fire.calculateRisk" fallback={labels.calculateRisk} />
            </button>
            <button type="button" className="secondary" onClick={reset}>
              <CmsText as="span" id="readiness.fire.reset" fallback={labels.reset} />
            </button>
          </div>
        </div>

        <div className="fire-safety-card">
          {result ? (
            <>
              <CmsText as="h4" id="readiness.fire.assessmentResult" fallback={labels.assessmentResult} />
              <div className={riskBadgeClass(result.riskLevel)}>
                <strong>{riskBadgeLabel(labels, result.riskLevel)}</strong>
                <span>
                  <CmsText as="span" id="readiness.fire.result.scoreLabel" fallback={labels.scoreLabel} /> {result.riskScore}
                </span>
              </div>

              <div className="fire-safety-metric">
                <CmsText as="span" id="readiness.fire.result.requiredExtinguishers" fallback={labels.requiredFireExtinguishers} />
                <strong>{result.extinguishers}</strong>
              </div>

              <CmsText as="h5" id="readiness.fire.recommendedExtinguisherTypes" fallback={labels.recommendedExtinguisherTypes} />
              <ul>
                {result.extinguisherTypes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <CmsText as="h5" id="readiness.fire.placementGuidelinesHeading" fallback={labels.placementGuidelinesHeading} />
              <ul>
                {result.placementGuidelines.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <CmsText as="h5" id="readiness.fire.recommendedActions" fallback={labels.recommendedActions} />
              <ul>
                {result.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : (
            <CmsText className="fire-safety-empty" id="readiness.fire.emptyState" fallback={labels.emptyState} />
          )}
        </div>
      </div>
    </div>
  )
}
