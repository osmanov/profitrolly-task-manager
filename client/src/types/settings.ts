export interface SystemSettings {
  id?: string;
  maxDaysPerTask: number;
  updatedBy?: string;
  updatedAt?: string;
}

export interface RiskTableEntry {
  totalDays: string | number;
  riskDays: number;
}
