import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import RegisterForm from "@/components/auth/RegisterForm";

export default function Register() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation("/portfolios");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 p-4">
      <RegisterForm onSwitchToLogin={() => setLocation("/login")} />
    </div>
  );
}
