export interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  unit: string;
  category: 'physical' | 'mental' | 'other';
}

export interface DashboardData {
  startDate: string;
  targetDate: string;
  lastUpdate: string;
  goals: Goal[];
}
