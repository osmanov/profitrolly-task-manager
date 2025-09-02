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
    <Card className="w-full max-w-md mx-4 shadow-2xl border-t-4 border-t-blue-600 bg-blue-50" data-testid="register-form">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-blue-700 mb-2">profiTrolly</CardTitle>
        <p className="text-muted-foreground">Создайте ваш аккаунт</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="fullName">Полное имя</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Введите ваше полное имя"
              {...register("fullName")}
              data-testid="input-full-name"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="username">Логин</Label>
            <Input
              id="username"
              type="text"
              placeholder="Выберите логин"
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
              placeholder="Введите ваш email"
              {...register("email")}
              data-testid="input-email"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Создайте надёжный пароль"
              {...register("password")}
              data-testid="input-password"
            />
            {errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            disabled={isRegisterPending}
            data-testid="button-register"
          >
            {isRegisterPending ? "Создание аккаунта..." : "Создать аккаунт"}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="text-primary hover:text-primary/80"
              onClick={onSwitchToLogin}
              data-testid="button-switch-login"
            >
              Уже есть аккаунт? Войти
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
