import React, { useMemo } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { calculatePortfolioMetrics, generateMarkdownSummary } from "@/services/calculations";
import type { CreateTaskData } from "@/types/portfolio";

interface SummaryDisplayProps {
  tasks: CreateTaskData[];
  portfolioName: string;
  startDate: string;
}

export default function SummaryDisplay({ tasks, portfolioName, startDate }: SummaryDisplayProps) {
  const { toast } = useToast();

  // Convert CreateTaskData to Task-like objects for calculations
  // Use useMemo to avoid recalculating on every render
  const taskData = useMemo(() => 
    tasks.map((task, index) => ({
      ...task,
      id: `temp-${index}`,
      portfolioId: "temp",
      createdAt: new Date().toISOString(),
    })), [tasks]);

  const calculations = useMemo(() => 
    calculatePortfolioMetrics(taskData, startDate), 
    [taskData, startDate]);

  const copyMarkdown = async () => {
    try {
      const markdown = generateMarkdownSummary(portfolioName, taskData, calculations, startDate);
      await navigator.clipboard.writeText(markdown);
      toast({
        title: "Успешно",
        description: "Jira сводка скопирована в буфер обмена!",
        className: "bg-green-100 border-green-500 text-green-800",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать в буфер обмена",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('ru', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="lg:sticky lg:top-6 shadow-xl border-l-4 border-l-teal-500 bg-teal-50" data-testid="summary-display">
      <CardHeader className="bg-teal-100">
        <CardTitle className="text-teal-700 font-bold">Расчёты</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Distribution */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Распределение по командам</h4>
          <div className="space-y-2">
            {Object.entries(calculations.teamDistribution).map(([team, days]) => (
              <div key={team} className="flex justify-between text-sm" data-testid={`team-${team}-days`}>
                <span className="capitalize">{team}</span>
                <span className="font-medium">{days} дней</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="space-y-3 p-3 bg-muted rounded-md">
          <div className="flex justify-between text-sm">
            <span>Общие дни:</span>
            <span className="font-semibold" data-testid="text-total-days">{calculations.totalDays} дней</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Story Points:</span>
            <span className="font-semibold" data-testid="text-story-points">{calculations.storyPoints} points</span>
          </div>
          <div className="flex justify-between text-sm text-orange-600 font-bold">
            <span>Рисковые дни:</span>
            <span className="font-semibold" data-testid="text-risk-days">+{calculations.riskDays} дней</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border pt-2">
            <span>С рисками:</span>
            <span className="font-semibold" data-testid="text-total-with-risks">{calculations.totalWithRisks} дней</span>
          </div>
        </div>

        {/* Date Calculations */}
        {startDate && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Временная линия</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Дата начала:</span>
                <span className="font-medium" data-testid="text-start-date">{formatDate(startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Дата окончания:</span>
                <span className="font-medium" data-testid="text-end-date">{formatDate(calculations.endDate)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Export Link */}
        <button
          onClick={copyMarkdown}
          className="w-full text-teal-600 hover:text-teal-700 underline text-center py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!portfolioName || tasks.length === 0}
          data-testid="button-copy-markdown"
        >
          <Copy className="h-4 w-4 mr-2 inline" />
          Скопировать Jira Summary
        </button>
      </CardContent>
    </Card>
  );
}
