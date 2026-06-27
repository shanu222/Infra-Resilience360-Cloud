export type RiskLevel = 'Low' | 'Medium' | 'High';

export type SoilType = 'sandy' | 'clay' | 'rocky' | 'wet';
export type ConstructionType = 'RCC' | 'Brick' | 'Mud';

export interface FormInputs {
  location: string;
  plotSize: number;
  floors: number;
  rooms: number;
  people: number;
  soilType: SoilType;
  constructionType: ConstructionType;
  floodProne: boolean;
}

export interface RiskAssessment {
  floodRisk: RiskLevel;
  earthquakeRisk: RiskLevel;
  heatRisk: RiskLevel;
}

export interface FoundationRecommendation {
  type: string;
  details: string;
  raisedPlinth?: string;
}

export interface StructuralRecommendation {
  recommendation: string;
  warnings: string[];
  details: string[];
}

export interface DoorDesign {
  direction: string;
  material: string;
  reasoning: string;
  dimensions: string;
}

export interface FireSafety {
  extinguishers: number;
  smokeDetectors: boolean;
  fireAlarmSystem: boolean;
  details: string[];
}

export interface FloodSafety {
  equipment: string[];
  required: boolean;
}

export interface EarthquakeSafety {
  equipment: string[];
  recommendations: string[];
  required: boolean;
}

export interface ElectricalSafety {
  components: string[];
  details: string[];
}

export interface VentilationHeat {
  fans: number;
  windows: number;
  additionalRequirements: string[];
}

export interface WaterRequirements {
  tapPoints: number;
  details: string[];
}

export interface CalculationResults {
  risks: RiskAssessment;
  foundation: FoundationRecommendation;
  structural: StructuralRecommendation;
  door: DoorDesign;
  fireSafety: FireSafety;
  floodSafety: FloodSafety;
  earthquakeSafety: EarthquakeSafety;
  electricalSafety: ElectricalSafety;
  ventilationHeat: VentilationHeat;
  waterRequirements: WaterRequirements;
  warnings: string[];
}
