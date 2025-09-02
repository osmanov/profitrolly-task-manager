export interface Task {
  id: string;
  portfolioId: string;
  title: string;
  description: string;
  team: string;
  days: number;
  parallelGroup?: string; // Tasks with same group run in parallel
  orderIndex: number;
  createdAt: string;
}

export interface Portfolio {
  id: string;
  name: string;
  userId: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

export interface PortfolioWithTasks extends Portfolio {
  tasks: Task[];
  user: {
    id: string;
    username: string;
    fullName: string;
  };
}

export interface CreatePortfolioData {
  name: string;
  startDate: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  team: string;
  days: number;
  parallelGroup?: string; // Tasks with same group run in parallel
  orderIndex: number;
}

export interface TeamDistribution {
  [team: string]: number;
}

export interface CalculationResults {
  totalDays: number;
  storyPoints: number;
  riskDays: number;
  totalWithRisks: number;
  endDate: string;
  teamDistribution: TeamDistribution;
}
