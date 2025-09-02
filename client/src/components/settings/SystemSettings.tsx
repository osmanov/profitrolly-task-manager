import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const settingsSchema = z.object({
  maxDaysPerTask: z.number().min(1, "Must be at least 1").max(10, "Must be at most 10"),
});

type SettingsData = z.infer<typeof settingsSchema>;

const RISK_TABLE = [
  { totalDays: "2", riskDays: 1 },
  { totalDays: "3-7", riskDays: 2 },
  { totalDays: "8-12", riskDays: 3 },
  { totalDays: "13-17", riskDays: 4 },
  { totalDays: "18-22", riskDays: 5 },
  { totalDays: "23-27", riskDays: 6 },
  { totalDays: "28-30", riskDays: 7 },
  { totalDays: "30+", riskDays: 7 },
];

export default function SystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const updateSettings = useMutation({
    mutationFn: async (data: SettingsData) => {
      const response = await api.settings.update(data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      maxDaysPerTask: 3,
    },
  });

  // Set form values when settings load
  useEffect(() => {
    if (settings && typeof settings === 'object' && 'maxDaysPerTask' in settings) {
      setValue("maxDaysPerTask", settings.maxDaysPerTask || 3);
    }
  }, [settings, setValue]);

  const onSubmit = (data: SettingsData) => {
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="text-settings-title">System Settings</h2>
        <Badge variant="secondary" data-testid="badge-admin-only">Admin Only</Badge>
      </div>

      <div className="grid gap-6">
        {/* Maximum Days Setting */}
        <Card>
          <CardHeader>
            <CardTitle>Task Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxDaysPerTask">Maximum Days per Task</Label>
                  <Input
                    id="maxDaysPerTask"
                    type="number"
                    min="1"
                    max="10"
                    {...register("maxDaysPerTask", { valueAsNumber: true })}
                    data-testid="input-max-days"
                  />
                  {errors.maxDaysPerTask && (
                    <p className="text-sm text-destructive mt-1">{errors.maxDaysPerTask.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum number of days allowed per task (1-10)
                  </p>
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={updateSettings.isPending}
                    data-testid="button-update-settings"
                  >
                    {updateSettings.isPending ? "Updating..." : "Update Setting"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Risk Calculation Table */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Calculation Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="risk-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Total Days</th>
                    <th className="text-left py-2 font-medium">Risk Days</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {RISK_TABLE.map((row, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-2">{row.totalDays}</td>
                      <td className="py-2">+{row.riskDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Application Version</p>
                <p className="font-medium" data-testid="text-app-version">v1.0.0</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium" data-testid="text-last-updated">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
