export type HubStatus = 'ready' | 'moderate' | 'critical';

export interface MaterialHub {
  id: string;
  name: string;
  location: string;
  district: string;
  latitude: number;
  longitude: number;
  capacity: number;
  status: HubStatus;
  stockPercentage: number;
  damagePercentage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaterialEntry {
  id: string;
  hubId: string;
  name: string;
  unit: string;
  opening: number;
  received: number;
  issued: number;
  closing: number;
  damaged: number;
  percentageRemaining: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HubInventory {
  hubId: string;
  hubName: string;
  materials: MaterialEntry[];
  lastUpdated: string;
}
