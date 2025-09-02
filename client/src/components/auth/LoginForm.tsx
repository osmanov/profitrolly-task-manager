import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import type { LoginData } from "@/types/auth";

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login, isLoginPending } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginData) => {
    login(data);
  };

  return (
    <Card className="w-full max-w-md card-enhanced shadow-xl" data-testid="login-form">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">profiTrolly</CardTitle>
        <p className="text-muted-foreground">Task Decomposition & Risk Calculator</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="usernameOrEmail">Username or Email</Label>
            <Input
              id="usernameOrEmail"
              type="text"
              placeholder="Enter your username or email"
              {...register("usernameOrEmail")}
              data-testid="input-username-email"
            />
            {errors.usernameOrEmail && (
              <p className="text-sm text-destructive mt-1">{errors.usernameOrEmail.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              data-testid="input-password"
            />
            {errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full btn-primary shadow-md"
            disabled={isLoginPending}
            data-testid="button-login"
          >
            {isLoginPending ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="text-primary hover:text-primary/80"
              onClick={onSwitchToRegister}
              data-testid="button-switch-register"
            >
              Don't have an account? Register here
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
