import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import type { RegisterData } from "@/types/auth";

const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200, "Full name too long"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username too long"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[a-zA-Z])(?=.*\d)/, "Password must contain letters and numbers"),
});

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register: registerUser, isRegisterPending } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterData) => {
    registerUser(data);
  };

  return (
    <Card className="w-full max-w-md card-enhanced shadow-xl" data-testid="register-form">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">profiTrolly</CardTitle>
        <p className="text-muted-foreground">Create your account</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              {...register("fullName")}
              data-testid="input-full-name"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              {...register("username")}
              data-testid="input-username"
            />
            {errors.username && (
              <p className="text-sm text-destructive mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register("email")}
              data-testid="input-email"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
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
            disabled={isRegisterPending}
            data-testid="button-register"
          >
            {isRegisterPending ? "Creating Account..." : "Create Account"}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="text-primary hover:text-primary/80"
              onClick={onSwitchToLogin}
              data-testid="button-switch-login"
            >
              Already have an account? Sign in here
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
