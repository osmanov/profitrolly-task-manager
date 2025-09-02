import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateTaskData } from "@/types/portfolio";

interface TaskBlockProps {
  task: CreateTaskData;
  index: number;
  onUpdate: (index: number, task: CreateTaskData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const TEAMS = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "testing", label: "Testing" },
];

export default function TaskBlock({ task, index, onUpdate, onRemove, canRemove }: TaskBlockProps) {
  const handleChange = (field: keyof CreateTaskData, value: string | number | undefined) => {
    onUpdate(index, { ...task, [field]: value });
  };

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'frontend': return 'border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-950/20';
      case 'backend': return 'border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'testing': return 'border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20';
      default: return 'border-l-4 border-l-primary bg-muted';
    }
  };

  const getTeamBadgeColor = (team: string) => {
    switch (team) {
      case 'frontend': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'backend': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      case 'testing': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className={`rounded-lg p-4 space-y-4 transition-all hover:shadow-sm ${getTeamColor(task.team)}`} data-testid={`task-block-${index}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm text-foreground">Task {index + 1}</h4>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTeamBadgeColor(task.team)}`}>
            {task.team.charAt(0).toUpperCase() + task.team.slice(1)}
          </span>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-destructive hover:bg-destructive/10"
            data-testid={`button-remove-task-${index}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`title-${index}`}>Task Title</Label>
          <Input
            id={`title-${index}`}
            placeholder="Brief task title"
            value={task.title}
            onChange={(e) => handleChange("title", e.target.value)}
            data-testid={`input-task-title-${index}`}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor={`team-${index}`}>Team</Label>
            <Select
              value={task.team}
              onValueChange={(value) => handleChange("team", value)}
            >
              <SelectTrigger data-testid={`select-team-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAMS.map((team) => (
                  <SelectItem key={team.value} value={team.value}>
                    {team.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`days-${index}`}>Days</Label>
            <Input
              id={`days-${index}`}
              type="number"
              min="1"
              max="10"
              value={task.days}
              onChange={(e) => handleChange("days", parseInt(e.target.value) || 1)}
              data-testid={`input-task-days-${index}`}
            />
          </div>

          <div>
            <Label htmlFor={`parallel-group-${index}`}>
              Parallel Group
              <span className="text-xs text-muted-foreground ml-1">(optional)</span>
            </Label>
            <Input
              id={`parallel-group-${index}`}
              placeholder="e.g., group-1"
              value={task.parallelGroup || ""}
              onChange={(e) => handleChange("parallelGroup", e.target.value || undefined)}
              data-testid={`input-parallel-group-${index}`}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor={`description-${index}`}>Description</Label>
        <Textarea
          id={`description-${index}`}
          rows={3}
          placeholder="Detailed task description"
          value={task.description}
          onChange={(e) => handleChange("description", e.target.value)}
          data-testid={`textarea-task-description-${index}`}
        />
      </div>
    </div>
  );
}
