export interface TimelineEvent {
  year: number;
  duration: string;
}

export interface Guidance {
  before: string[];
  during: string[];
  after: string[];
}

export interface Disaster {
  id: string;
  name: string;
  icon: string;
  description: string;
  timeline: TimelineEvent[];
  seasonalPeriod: string;
  seasonalMonths: number[]; // 0-11 (Jan-Dec)
  guidance: Guidance;
  color: string;
}
