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
        title: "Success",
        description: "Markdown copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="sticky top-6 shadow-xl border-l-4 border-l-teal-500 bg-gradient-to-b from-teal-50 to-white" data-testid="summary-display">
      <CardHeader className="bg-gradient-to-r from-blue-100 to-teal-100">
        <CardTitle className="text-blue-700 font-bold">Calculations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Distribution */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Team Distribution</h4>
          <div className="space-y-2">
            {Object.entries(calculations.teamDistribution).map(([team, days]) => (
              <div key={team} className="flex justify-between text-sm" data-testid={`team-${team}-days`}>
                <span className="capitalize">{team}</span>
                <span className="font-medium">{days} days</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="space-y-3 p-3 bg-muted rounded-md">
          <div className="flex justify-between text-sm">
            <span>Total Days:</span>
            <span className="font-semibold" data-testid="text-total-days">{calculations.totalDays} days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Story Points:</span>
            <span className="font-semibold" data-testid="text-story-points">{calculations.storyPoints} points</span>
          </div>
          <div className="flex justify-between text-sm text-orange-600 font-bold">
            <span>Risk Days:</span>
            <span className="font-semibold" data-testid="text-risk-days">+{calculations.riskDays} days</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border pt-2">
            <span>With Risks:</span>
            <span className="font-semibold" data-testid="text-total-with-risks">{calculations.totalWithRisks} days</span>
          </div>
        </div>

        {/* Date Calculations */}
        {startDate && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Start Date:</span>
                <span className="font-medium" data-testid="text-start-date">{formatDate(startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>End Date:</span>
                <span className="font-medium" data-testid="text-end-date">{formatDate(calculations.endDate)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={copyMarkdown}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg"
          disabled={!portfolioName || tasks.length === 0}
          data-testid="button-copy-markdown"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Jira Summary
        </Button>
      </CardContent>
    </Card>
  );
}
