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

  // Check if start date is a working day and count it as the first day
  const startDayOfWeek = currentDate.getDay();
  const startDateString = currentDate.toISOString().split('T')[0];
  
  if (startDayOfWeek !== 0 && startDayOfWeek !== 6 && !holidaySet.has(startDateString)) {
    workDaysAdded = 1; // Start date counts as the first working day
  }

  // If we need more days, continue adding
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
  // Group tasks by parallelGroup
  const parallelGroups: { [key: string]: Task[] } = {};
  const sequentialTasks: Task[] = [];

  tasks.forEach(task => {
    if (task.parallelGroup && task.parallelGroup.trim()) {
      if (!parallelGroups[task.parallelGroup]) {
        parallelGroups[task.parallelGroup] = [];
      }
      parallelGroups[task.parallelGroup].push(task);
    } else {
      sequentialTasks.push(task);
    }
  });

  // Calculate total days: sum of sequential tasks + max days from each parallel group
  let totalDays = sequentialTasks.reduce((sum, task) => sum + task.days, 0);
  
  // For each parallel group, take the maximum days instead of sum
  Object.values(parallelGroups).forEach(groupTasks => {
    const maxDaysInGroup = Math.max(...groupTasks.map(task => task.days));
    totalDays += maxDaysInGroup;
  });

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
    return date.toLocaleDateString('ru', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Group tasks by parallelGroup first, then by team
  const parallelGroups: { [key: string]: Task[] } = {};
  const sequentialTasks: Task[] = [];

  tasks.forEach(task => {
    if (task.parallelGroup && task.parallelGroup.trim()) {
      if (!parallelGroups[task.parallelGroup]) {
        parallelGroups[task.parallelGroup] = [];
      }
      parallelGroups[task.parallelGroup].push(task);
    } else {
      sequentialTasks.push(task);
    }
  });

  // Group sequential tasks by team
  const sequentialByTeam = sequentialTasks.reduce((acc, task) => {
    if (!acc[task.team]) {
      acc[task.team] = [];
    }
    acc[task.team].push(task);
    return acc;
  }, {} as { [key: string]: Task[] });

  // Start with Jira-style formatting
  let markdown = `h1. ${portfolioName}\n\n`;
  markdown += `*Временная линия проекта:* ${formatDate(startDate)} - ${formatDate(calculations.endDate)}\n`;
  markdown += `*Общее время разработки:* ${calculations.totalDays} дн. (${calculations.storyPoints} story points)\n`;
  markdown += `*С учетом рисков:* ${calculations.totalWithRisks} дн. (+${calculations.riskDays} дн. рисков)\n\n`;

  markdown += `h2. Декомпозиция задач\n\n`;

  // Add sequential tasks by team
  if (Object.keys(sequentialByTeam).length > 0) {
    markdown += `h3. Последовательные задачи\n\n`;
    Object.entries(sequentialByTeam).forEach(([team, teamTasks]) => {
      const teamName = team.charAt(0).toUpperCase() + team.slice(1);
      const teamDays = teamTasks.reduce((sum, task) => sum + task.days, 0);
      
      markdown += `h4. Команда ${teamName} (${teamDays} дн.)\n\n`;
      
      teamTasks.forEach(task => {
        markdown += `* *${task.title}* - ${task.description}\n`;
        markdown += `  _Оценка времени: ${task.days} ${task.days === 1 ? 'день' : task.days < 5 ? 'дня' : 'дней'}_\n`;
      });
      markdown += '\n';
    });
  }

  // Add parallel groups
  if (Object.keys(parallelGroups).length > 0) {
    markdown += `h3. Группы параллельных задач\n\n`;
    Object.entries(parallelGroups).forEach(([groupName, groupTasks]) => {
      const maxDays = Math.max(...groupTasks.map(task => task.days));
      const totalGroupDays = groupTasks.reduce((sum, task) => sum + task.days, 0);
      
      markdown += `h4. Группа "${groupName}" (${maxDays} дн. эффективно, ${totalGroupDays} общий объем работ)\n`;
      markdown += `_Эти задачи выполняются параллельно - временная линия проекта использует максимальную продолжительность_\n\n`;
      
      groupTasks.forEach(task => {
        markdown += `* *${task.title}* (${task.team}) - ${task.description}\n`;
        markdown += `  _Оценка времени: ${task.days} ${task.days === 1 ? 'день' : task.days < 5 ? 'дня' : 'дней'}_\n`;
      });
      markdown += '\n';
    });
  }

  // Add summary table in Jira format
  markdown += `h2. Итоговая сводка по проекту\n\n`;
  markdown += `|| Метрика || Значение ||\n`;
  markdown += `| Дата начала | ${formatDate(startDate)} |\n`;
  markdown += `| Дата окончания | ${formatDate(calculations.endDate)} |\n`;
  markdown += `| Дни разработки | ${calculations.totalDays} |\n`;
  markdown += `| Дни рисков | +${calculations.riskDays} |\n`;
  markdown += `| Общая продолжительность | ${calculations.totalWithRisks} дн. |\n`;
  markdown += `| Story Points | ${calculations.storyPoints} |\n\n`;

  // Add team allocation table
  markdown += `h2. Распределение по командам\n\n`;
  markdown += `|| Команда || Дни || Процент ||\n`;
  
  Object.entries(calculations.teamDistribution).forEach(([team, days]) => {
    const teamName = team.charAt(0).toUpperCase() + team.slice(1);
    const percentage = Math.round((days / calculations.totalDays) * 100);
    markdown += `| ${teamName} | ${days} | ${percentage}% |\n`;
  });

  return markdown;
};
