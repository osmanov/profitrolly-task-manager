import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import TaskBlock from "./TaskBlock";
import SummaryDisplay from "../calculations/SummaryDisplay";
import { usePortfolio, useCreatePortfolio, useUpdatePortfolio, useCreateTask } from "@/hooks/usePortfolio";
import { Skeleton } from "@/components/ui/skeleton";
import type { CreatePortfolioData, CreateTaskData } from "@/types/portfolio";

const portfolioSchema = z.object({
  name: z.string().min(1, "Portfolio name is required").max(200, "Name too long"),
  startDate: z.string().min(1, "Start date is required"),
});

interface PortfolioFormProps {
  portfolioId?: string;
}

export default function PortfolioForm({ portfolioId }: PortfolioFormProps) {
  const [, setLocation] = useLocation();
  const [tasks, setTasks] = useState<CreateTaskData[]>([
    {
      title: "",
      description: "",
      team: "frontend",
      days: 1,
      parallelGroup: undefined,
      orderIndex: 0,
    },
  ]);

  const isEditing = !!portfolioId;
  const { portfolio, isLoading: isLoadingPortfolio } = usePortfolio(portfolioId || "");
  const createPortfolio = useCreatePortfolio();
  const updatePortfolio = useUpdatePortfolio();
  const createTask = useCreateTask();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreatePortfolioData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      name: "",
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const watchedValues = watch();

  // Load portfolio data for editing
  useEffect(() => {
    if (isEditing && portfolio) {
      setValue("name", portfolio.name);
      setValue("startDate", portfolio.startDate);
      
      if (portfolio.tasks.length > 0) {
        setTasks(portfolio.tasks.map(task => ({
          title: task.title,
          description: task.description,
          team: task.team,
          days: task.days,
          parallelGroup: task.parallelGroup,
          orderIndex: task.orderIndex,
        })));
      }
    }
  }, [portfolio, isEditing, setValue]);

  const addTask = () => {
    setTasks([...tasks, {
      title: "",
      description: "",
      team: "frontend",
      days: 1,
      parallelGroup: undefined,
      orderIndex: tasks.length,
    }]);
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const updateTask = (index: number, task: CreateTaskData) => {
    const newTasks = [...tasks];
    newTasks[index] = task;
    setTasks(newTasks);
  };

  const onSubmit = async (data: CreatePortfolioData) => {
    try {
      if (isEditing && portfolioId) {
        await updatePortfolio.mutateAsync({ id: portfolioId, data });
        
        // Update tasks for editing mode
        // First, delete existing tasks
        if (portfolio?.tasks) {
          for (const existingTask of portfolio.tasks) {
            await fetch(`/api/tasks/${existingTask.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
            });
          }
        }
        
        // Then create new tasks
        for (const task of tasks) {
          if (task.title && task.description) { // Only create tasks with content
            await createTask.mutateAsync({
              portfolioId: portfolioId,
              data: task
            });
          }
        }
        
        setLocation("/portfolios");
      } else {
        const newPortfolio = await createPortfolio.mutateAsync(data);
        
        // Create all tasks after portfolio creation
        for (const task of tasks) {
          if (task.title && task.description) { // Only create tasks with content
            await createTask.mutateAsync({
              portfolioId: newPortfolio.id,
              data: task
            });
          }
        }
        
        setLocation("/portfolios");
      }
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  if (isEditing && isLoadingPortfolio) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="text-form-title">
          {isEditing ? "Edit Portfolio" : "Create New Portfolio"}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/portfolios")}
          data-testid="button-close-form"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-t-4 border-t-blue-600 bg-blue-50">
            <CardHeader className="bg-blue-100">
              <CardTitle className="text-blue-700 font-bold">Portfolio Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Portfolio Name */}
                <div>
                  <Label htmlFor="name">Portfolio Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter portfolio name"
                    {...register("name")}
                    data-testid="input-portfolio-name"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register("startDate")}
                    data-testid="input-start-date"
                  />
                  {errors.startDate && (
                    <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                {/* Tasks Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Tasks</h3>
                    <Button
                      type="button"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                      onClick={addTask}
                      data-testid="button-add-task"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Task
                    </Button>
                  </div>

                  {tasks.map((task, index) => (
                    <TaskBlock
                      key={index}
                      task={task}
                      index={index}
                      onUpdate={updateTask}
                      onRemove={removeTask}
                      canRemove={tasks.length > 1}
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6 border-t border-border">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    disabled={createPortfolio.isPending || updatePortfolio.isPending}
                    data-testid="button-save-portfolio"
                  >
                    {(createPortfolio.isPending || updatePortfolio.isPending)
                      ? "Saving..."
                      : (isEditing ? "Update Portfolio" : "Save Portfolio")
                    }
                  </Button>
                  <Button
                    type="button"
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                    onClick={() => setLocation("/portfolios")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Calculations Sidebar */}
        <div className="lg:col-span-1">
          <SummaryDisplay
            tasks={tasks}
            portfolioName={watchedValues.name || ""}
            startDate={watchedValues.startDate || ""}
          />
        </div>
      </div>
    </div>
  );
}
