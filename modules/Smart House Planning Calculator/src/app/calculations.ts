import {
  FormInputs,
  CalculationResults,
  RiskLevel,
  RiskAssessment,
  FoundationRecommendation,
  StructuralRecommendation,
  DoorDesign,
  FireSafety,
  FloodSafety,
  EarthquakeSafety,
  ElectricalSafety,
  VentilationHeat,
  WaterRequirements,
} from './types';

// Risk assessment based on location and inputs
export function assessRisks(inputs: FormInputs): RiskAssessment {
  let floodRisk: RiskLevel = 'Low';
  let earthquakeRisk: RiskLevel = 'Low';
  let heatRisk: RiskLevel = 'Low';

  // Flood risk assessment
  if (inputs.floodProne) {
    floodRisk = 'High';
  } else if (inputs.soilType === 'wet' || inputs.soilType === 'clay') {
    floodRisk = 'Medium';
  }

  // Earthquake risk assessment (based on common high-risk areas in India)
  const location = inputs.location.toLowerCase();
  const highEarthquakeZones = ['delhi', 'shimla', 'srinagar', 'guwahati', 'gangtok', 'uttarakhand', 'himachal'];
  const mediumEarthquakeZones = ['mumbai', 'bangalore', 'kolkata', 'pune', 'ahmedabad'];
  
  if (highEarthquakeZones.some(zone => location.includes(zone))) {
    earthquakeRisk = 'High';
  } else if (mediumEarthquakeZones.some(zone => location.includes(zone))) {
    earthquakeRisk = 'Medium';
  } else if (inputs.floors > 2) {
    earthquakeRisk = 'Medium';
  }

  // Heat risk assessment
  const highHeatZones = ['rajasthan', 'delhi', 'ahmedabad', 'nagpur', 'hyderabad', 'chennai'];
  const mediumHeatZones = ['mumbai', 'pune', 'bangalore'];
  
  if (highHeatZones.some(zone => location.includes(zone))) {
    heatRisk = 'High';
  } else if (mediumHeatZones.some(zone => location.includes(zone))) {
    heatRisk = 'Medium';
  }

  return { floodRisk, earthquakeRisk, heatRisk };
}

// Foundation recommendations
export function calculateFoundation(inputs: FormInputs, risks: RiskAssessment): FoundationRecommendation {
  let type = '';
  let details = '';
  let raisedPlinth: string | undefined;

  // Soil-based foundation
  if (inputs.soilType === 'clay' || inputs.soilType === 'wet') {
    type = 'Deep Foundation';
    details = 'Pile foundation or Raft foundation recommended due to weak soil bearing capacity. Minimum depth: 8-10 feet.';
  } else if (inputs.soilType === 'rocky') {
    type = 'Shallow Foundation';
    details = 'Strip footing foundation suitable for rocky soil with good bearing capacity. Depth: 3-5 feet.';
  } else {
    type = 'Standard Foundation';
    details = 'Isolated footing or combined footing foundation. Depth: 4-6 feet depending on load.';
  }

  // Flood-prone adjustments
  if (inputs.floodProne || risks.floodRisk === 'High') {
    type = 'Raised RCC Foundation';
    raisedPlinth = 'Plinth height: 3-4 feet above ground level to prevent water ingress';
    details += ' Must use RCC (Reinforced Cement Concrete) for water resistance. Include proper drainage around foundation.';
  }

  return { type, details, raisedPlinth };
}

// Structural recommendations
export function calculateStructural(inputs: FormInputs, risks: RiskAssessment): StructuralRecommendation {
  const warnings: string[] = [];
  const details: string[] = [];
  let recommendation = '';

  // Multi-floor structures
  if (inputs.floors > 2) {
    recommendation = 'RCC Frame Structure (Mandatory)';
    details.push('Use RCC columns (minimum 9" × 12") and beams (minimum 9" × 12")');
    details.push('Slab thickness: minimum 5-6 inches with proper reinforcement');
    details.push('Follow IS 456:2000 for structural design');
  } else if (inputs.floors === 2) {
    recommendation = 'RCC Frame Structure or Load-Bearing Walls';
    details.push('RCC frame recommended for better earthquake resistance');
    details.push('Wall thickness: 9 inches for load-bearing walls');
  } else {
    recommendation = 'Load-Bearing Wall Structure';
    details.push('Wall thickness: 9 inches for exterior walls, 4.5 inches for interior');
  }

  // Non-RCC warnings
  if (inputs.constructionType !== 'RCC' && inputs.floors > 2) {
    warnings.push('⚠️ CRITICAL: Multi-story buildings must use RCC frame structure. Current construction type is unsafe!');
  }

  if (inputs.constructionType === 'Mud' && inputs.floors > 1) {
    warnings.push('⚠️ WARNING: Mud construction not recommended for multi-story buildings');
  }

  // Earthquake considerations
  if (risks.earthquakeRisk === 'High' || risks.earthquakeRisk === 'Medium') {
    details.push('Use seismic-resistant design as per IS 1893');
    details.push('Provide lateral bracing and shear walls');
    details.push('Avoid heavy roofing materials (prefer lightweight options)');
  }

  // Load distribution
  details.push('Ensure proper load distribution from roof to foundation');
  details.push('Use tie beams at plinth level for stability');

  return { recommendation, warnings, details };
}

// Door design (code-compliant)
export function calculateDoorDesign(inputs: FormInputs, risks: RiskAssessment): DoorDesign {
  let direction = '';
  let material = '';
  let reasoning = '';

  // Direction based on occupancy and floors
  if (inputs.people > 5 || inputs.floors > 1) {
    direction = 'Outward Opening';
    reasoning = 'Required for safe emergency evacuation (National Building Code compliance). Main exit must allow quick escape during emergencies.';
  } else {
    direction = 'Inward Opening Allowed';
    reasoning = 'Small residential units with limited occupancy may use inward-opening doors.';
  }

  // Material based on risks
  if (risks.floodRisk === 'High') {
    material = 'PVC or Water-Resistant Treated Wood';
    reasoning += ' Water-resistant material chosen due to high flood risk.';
  } else if (inputs.location.toLowerCase().includes('industrial') || risks.earthquakeRisk === 'High') {
    material = 'Steel Fire-Rated Door';
    reasoning += ' Fire-rated steel door for enhanced safety.';
  } else {
    material = 'Solid Wooden Door';
    reasoning += ' Standard solid wood door suitable for normal conditions.';
  }

  const dimensions = 'Height: 7 feet, Width: 3 feet (Main door)';

  return { direction, material, reasoning, dimensions };
}

// Fire safety calculations
export function calculateFireSafety(inputs: FormInputs, risks: RiskAssessment): FireSafety {
  const area = inputs.plotSize * inputs.floors;
  
  // Extinguishers calculation: 1 per 2000 sq ft + 1 per floor
  const extinguishers = Math.ceil(area / 2000) + inputs.floors;

  let smokeDetectors = false;
  let fireAlarmSystem = false;
  const details: string[] = [];

  // Based on Fire Safety Provisions 2016
  if (risks.earthquakeRisk === 'Medium' || risks.earthquakeRisk === 'High' || 
      inputs.floors > 2 || inputs.people > 10) {
    smokeDetectors = true;
    details.push('Install smoke detectors in each bedroom and common areas');
  }

  if (risks.earthquakeRisk === 'High' || inputs.floors > 3 || inputs.people > 15) {
    fireAlarmSystem = true;
    details.push('Install fire alarm system with manual call points');
  }

  details.push(`${extinguishers} fire extinguisher(s) required (ABC type, 5kg capacity)`);
  details.push('Keep clear access to all fire safety equipment');
  details.push('Maintain minimum 2 escape routes from building');
  
  if (inputs.floors > 1) {
    details.push('Emergency exit signage required on each floor');
  }

  return { extinguishers, smokeDetectors, fireAlarmSystem, details };
}

// Flood safety equipment
export function calculateFloodSafety(risks: RiskAssessment, inputs: FormInputs): FloodSafety {
  const required = risks.floodRisk === 'High';
  const equipment: string[] = [];

  if (required) {
    equipment.push('Sandbags (minimum 50 bags for perimeter protection)');
    equipment.push('Submersible water pump (1 HP minimum)');
    equipment.push('Raised electrical sockets (minimum 4 feet above floor level)');
    equipment.push('Proper drainage system with slope away from building');
    equipment.push('Waterproof sealant for walls and floors');
    equipment.push('Sump pump for basement (if applicable)');
  }

  return { equipment, required };
}

// Earthquake safety
export function calculateEarthquakeSafety(risks: RiskAssessment, inputs: FormInputs): EarthquakeSafety {
  const required = risks.earthquakeRisk === 'Medium' || risks.earthquakeRisk === 'High';
  const equipment: string[] = [];
  const recommendations: string[] = [];

  if (required) {
    equipment.push('Emergency survival kit (first aid, flashlight, batteries, whistle)');
    equipment.push('Emergency water storage (minimum 3 days supply)');
    equipment.push('Gas shutoff valve with emergency tool');
    equipment.push('Battery-powered radio');
    equipment.push('Fire extinguisher in accessible location');

    recommendations.push('Anchor heavy furniture and appliances to walls');
    recommendations.push('Install structural bracing for water heaters');
    recommendations.push('Use flexible gas and water connections');
    recommendations.push('Avoid heavy roof materials (use lightweight alternatives)');
    recommendations.push('Ensure proper anchoring of building to foundation');
    recommendations.push('Create an earthquake evacuation plan');
  }

  return { equipment, recommendations, required };
}

// Electrical safety
export function calculateElectricalSafety(): ElectricalSafety {
  const components = [
    'MCB (Miniature Circuit Breaker) - Main distribution board',
    'ELCB (Earth Leakage Circuit Breaker) / RCCB - 30mA sensitivity',
    'Proper earthing system with earth pit',
    'Surge protection devices',
  ];

  const details = [
    'Install separate MCBs for different circuits (lighting, power, AC)',
    'ELCB/RCCB mandatory for bathroom and outdoor circuits',
    'Earth resistance should be less than 5 ohms',
    'Use copper wiring (minimum 2.5 sq mm for power, 1.5 sq mm for lighting)',
    'Maintain clearance from water pipes and gas lines',
    'Regular testing of earth leakage protection',
  ];

  return { components, details };
}

// Heat and ventilation
export function calculateVentilationHeat(inputs: FormInputs, risks: RiskAssessment): VentilationHeat {
  const fans = Math.ceil(inputs.people / 2);
  const windows = inputs.rooms * 2;
  const additionalRequirements: string[] = [];

  additionalRequirements.push(`Minimum ${fans} ceiling fan(s) for adequate air circulation`);
  additionalRequirements.push(`${windows} window(s) recommended (2 per room for cross ventilation)`);
  additionalRequirements.push('Window area should be 15-20% of room floor area');
  
  if (risks.heatRisk === 'High') {
    additionalRequirements.push('⚠️ HIGH HEAT ZONE - Additional measures required:');
    additionalRequirements.push('• Roof insulation or cool roof coating (white/reflective)');
    additionalRequirements.push('• Cross ventilation mandatory in all rooms');
    additionalRequirements.push('• Water storage tank (minimum 1000L capacity)');
    additionalRequirements.push('• Consider installing exhaust fans in kitchen and bathrooms');
    additionalRequirements.push('• Provide shaded outdoor areas (verandah/porch)');
  }

  return { fans, windows, additionalRequirements };
}

// Water requirements
export function calculateWaterRequirements(inputs: FormInputs): WaterRequirements {
  const tapPoints = Math.ceil(inputs.people / 5);
  const details: string[] = [];

  details.push(`${tapPoints} tap point(s) (Nalka) required`);
  details.push('Minimum water requirement: 135 liters per person per day');
  details.push(`Total daily requirement: ${inputs.people * 135} liters`);
  details.push('Install overhead water tank with capacity for 2 days supply');
  details.push('Provide separate drinking water connection with filter');
  
  if (inputs.rooms > 1) {
    details.push('Consider bathroom attached to each bedroom for convenience');
  }

  return { tapPoints, details };
}

// Main calculation function
export function calculateResults(inputs: FormInputs): CalculationResults {
  const risks = assessRisks(inputs);
  const foundation = calculateFoundation(inputs, risks);
  const structural = calculateStructural(inputs, risks);
  const door = calculateDoorDesign(inputs, risks);
  const fireSafety = calculateFireSafety(inputs, risks);
  const floodSafety = calculateFloodSafety(risks, inputs);
  const earthquakeSafety = calculateEarthquakeSafety(risks, inputs);
  const electricalSafety = calculateElectricalSafety();
  const ventilationHeat = calculateVentilationHeat(inputs, risks);
  const waterRequirements = calculateWaterRequirements(inputs);

  const warnings: string[] = [];

  // Collect all warnings
  warnings.push(...structural.warnings);

  // Additional warnings
  if (inputs.rooms < Math.ceil(inputs.people / 3)) {
    warnings.push('⚠️ Insufficient rooms: Recommended 1 room per 2-3 persons');
  }

  if (inputs.constructionType === 'Brick' && risks.earthquakeRisk === 'High') {
    warnings.push('⚠️ Consider RCC frame structure for high earthquake risk area');
  }

  return {
    risks,
    foundation,
    structural,
    door,
    fireSafety,
    floodSafety,
    earthquakeSafety,
    electricalSafety,
    ventilationHeat,
    waterRequirements,
    warnings,
  };
}
