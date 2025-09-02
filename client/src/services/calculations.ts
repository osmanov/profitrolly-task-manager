import type { Task, CalculationResults, TeamDistribution } from "@/types/portfolio";

export const calculateRiskDays = (totalDays: number): number => {
  if (totalDays === 2) return 1;
  if (totalDays >= 3 && totalDays <= 7) return 2;
  if (totalDays >= 8 && totalDays <= 12) return 3;
  if (totalDays >= 13 && totalDays <= 17) return 4;
  if (totalDays >= 18 && totalDays <= 22) return 5;
  if (totalDays >= 23 && totalDays <= 27) return 6;
  if (totalDays >= 28 && totalDays <= 30) return 7;
  if (totalDays > 30) return 7;
  return 0;
};

export const calculateStoryPoints = (totalDays: number): number => {
  return Math.round(totalDays / 2);
};

export const calculateTeamDistribution = (tasks: Task[]): TeamDistribution => {
  return tasks.reduce((acc, task) => {
    acc[task.team] = (acc[task.team] || 0) + task.days;
    return acc;
  }, {} as TeamDistribution);
};

export const calculateEndDate = (startDate: string, totalDaysWithRisks: number): string => {
  const start = new Date(startDate);
  const holidays2025 = [
    "2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-05", "2025-01-06", "2025-01-07", "2025-01-08",
    "2025-02-22", "2025-02-23",
    "2025-03-08", "2025-03-09",
    "2025-05-01", "2025-05-02", "2025-05-03", "2025-05-04",
    "2025-05-08", "2025-05-09", "2025-05-10", "2025-05-11",
    "2025-06-12", "2025-06-13", "2025-06-14", "2025-06-15",
    "2025-11-02", "2025-11-03", "2025-11-04",
    "2025-12-31",
  ];

  const holidaySet = new Set(holidays2025);
  let workDaysAdded = 0;
  let currentDate = new Date(start);

  while (workDaysAdded < totalDaysWithRisks) {
    currentDate.setDate(currentDate.getDate() + 1);
    
    const dayOfWeek = currentDate.getDay();
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Skip weekends (Saturday = 6, Sunday = 0) and holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateString)) {
      workDaysAdded++;
    }
  }

  return currentDate.toISOString().split('T')[0];
};

export const calculatePortfolioMetrics = (tasks: Task[], startDate: string): CalculationResults => {
  const totalDays = tasks.reduce((sum, task) => sum + task.days, 0);
  const storyPoints = calculateStoryPoints(totalDays);
  const riskDays = calculateRiskDays(totalDays);
  const totalWithRisks = totalDays + riskDays;
  const endDate = calculateEndDate(startDate, totalWithRisks);
  const teamDistribution = calculateTeamDistribution(tasks);

  return {
    totalDays,
    storyPoints,
    riskDays,
    totalWithRisks,
    endDate,
    teamDistribution,
  };
};

export const generateMarkdownSummary = (
  portfolioName: string,
  tasks: Task[],
  calculations: CalculationResults,
  startDate: string
): string => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  // Group tasks by team
  const tasksByTeam = tasks.reduce((acc, task) => {
    if (!acc[task.team]) {
      acc[task.team] = [];
    }
    acc[task.team].push(task);
    return acc;
  }, {} as { [key: string]: Task[] });

  let markdown = `# ${portfolioName}\n\n## Декомпозиция задач\n\n`;

  // Add tasks by team
  Object.entries(tasksByTeam).forEach(([team, teamTasks]) => {
    const teamName = team.charAt(0).toUpperCase() + team.slice(1);
    markdown += `### ${teamName}\n`;
    
    teamTasks.forEach(task => {
      markdown += `- **${task.title}** - ${task.description} - ${task.days} дня\n`;
    });
    markdown += '\n';
  });

  // Add summary
  markdown += `## Итоговые показатели\n\n`;
  markdown += `- **Общее время:** ${calculations.totalDays} дней\n`;
  markdown += `- **Story Points:** ${calculations.storyPoints}\n`;
  markdown += `- **Время с рисками:** ${calculations.totalWithRisks} дней\n`;
  markdown += `- **Дата начала:** ${formatDate(startDate)}\n`;
  markdown += `- **Дата окончания:** ${formatDate(calculations.endDate)}\n\n`;

  // Add team distribution
  markdown += `## Распределение по командам\n\n`;
  markdown += `| Команда | Дни |\n`;
  markdown += `|---------|-----|\n`;
  
  Object.entries(calculations.teamDistribution).forEach(([team, days]) => {
    const teamName = team.charAt(0).toUpperCase() + team.slice(1);
    markdown += `| ${teamName} | ${days} |\n`;
  });

  return markdown;
};
