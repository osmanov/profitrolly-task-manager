import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation("/portfolios");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 p-4">
      {isRegister ? (
        <RegisterForm onSwitchToLogin={() => setIsRegister(false)} />
      ) : (
        <LoginForm onSwitchToRegister={() => setIsRegister(true)} />
      )}
    </div>
  );
}
