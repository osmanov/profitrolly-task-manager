import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Users } from "lucide-react";
import TaskBlock from "./TaskBlock";
import SummaryDisplay from "../calculations/SummaryDisplay";
import { usePortfolio, useCreatePortfolio, useUpdatePortfolio, useCreateTask } from "@/hooks/usePortfolio";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUnsavedChangesContext } from "@/contexts/UnsavedChangesContext";
import { useAuth } from "@/hooks/useAuth";
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChangesContext();
  const { user } = useAuth();
  const { joinPortfolio, isConnected } = useWebSocket();
  
  const markAsChanged = () => {
    if (isInitialized) {
      setHasUnsavedChanges(true);
    }
  };
  
  const markAsSaved = () => {
    setHasUnsavedChanges(false);
  };
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

  // Track form changes
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (type === 'change' && name && isInitialized) {
        markAsChanged();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isInitialized]);

  const handleNavigateWithConfirmation = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowConfirmDialog(true);
    } else {
      setLocation(path);
    }
  };

  const handleConfirmNavigation = () => {
    markAsSaved();
    setLocation(pendingNavigation);
    setShowConfirmDialog(false);
    setPendingNavigation("");
  };

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
      
      // Mark as initialized after loading data
      setTimeout(() => setIsInitialized(true), 100);
    } else if (!isEditing) {
      // For new portfolios, initialize immediately
      setIsInitialized(true);
    }
  }, [portfolio, isEditing, setValue]);
  
  // Clear unsaved changes when component unmounts or portfolio ID changes
  useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [setHasUnsavedChanges, portfolioId]);
  
  // Reset form when switching from edit to create mode
  useEffect(() => {
    if (!isEditing) {
      // Reset to default values for new portfolio
      setValue("name", "");
      setValue("startDate", new Date().toISOString().split('T')[0]);
      setTasks([{
        title: "",
        description: "",
        team: "frontend",
        days: 1,
        parallelGroup: undefined,
        orderIndex: 0,
      }]);
      setIsInitialized(true);
      setHasUnsavedChanges(false);
    }
  }, [isEditing, setValue, setHasUnsavedChanges]);

  const addTask = () => {
    setTasks([...tasks, {
      title: "",
      description: "",
      team: "frontend",
      days: 1,
      parallelGroup: undefined,
      orderIndex: tasks.length,
    }]);
    markAsChanged();
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
      markAsChanged();
    }
  };

  const updateTask = (index: number, task: CreateTaskData) => {
    const newTasks = [...tasks];
    newTasks[index] = task;
    setTasks(newTasks);
    markAsChanged();
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
        
        markAsSaved();
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
        
        markAsSaved();
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
          {isEditing ? "Редактировать Portfolio" : "Создать новое Portfolio"}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavigateWithConfirmation("/portfolios")}
          data-testid="button-close-form"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <Card className="shadow-xl border-t-4 border-t-blue-600 bg-blue-50">
            <CardHeader className="bg-blue-100">
              <CardTitle className="text-blue-700 font-bold">Детали Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Portfolio Name */}
                <div>
                  <Label htmlFor="name">Название Portfolio</Label>
                  <Input
                    id="name"
                    placeholder="Введите название портфолио"
                    {...register("name")}
                    data-testid="input-portfolio-name"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <Label htmlFor="startDate">Дата начала</Label>
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
                    <h3 className="text-lg font-medium">Задачи</h3>
                    <Button
                      type="button"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                      onClick={addTask}
                      data-testid="button-add-task"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить задачу
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
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-6 border-t border-border">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    disabled={createPortfolio.isPending || updatePortfolio.isPending}
                    data-testid="button-save-portfolio"
                  >
                    {(createPortfolio.isPending || updatePortfolio.isPending)
                      ? "Сохранение..."
                      : (isEditing ? "Обновить Portfolio" : "Сохранить Portfolio")
                    }
                  </Button>
                  <Button
                    type="button"
                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white"
                    onClick={() => handleNavigateWithConfirmation("/portfolios")}
                    data-testid="button-cancel"
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Calculations Sidebar */}
        <div className="lg:col-span-1 order-1 lg:order-2 space-y-6">
          <SummaryDisplay
            tasks={tasks}
            portfolioName={watchedValues.name || ""}
            startDate={watchedValues.startDate || ""}
          />
        </div>
      </div>
      
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Несохранённые изменения"
        description="У вас есть несохранённые изменения. Вы уверены, что хотите покинуть эту страницу?"
        onConfirm={handleConfirmNavigation}
      />
    </div>
  );
}
