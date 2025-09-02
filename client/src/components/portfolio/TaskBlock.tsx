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
  const handleChange = (field: keyof CreateTaskData, value: string | number) => {
    onUpdate(index, { ...task, [field]: value });
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-4" data-testid={`task-block-${index}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground">Task {index + 1}</h4>
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

        <div className="grid grid-cols-2 gap-2">
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
