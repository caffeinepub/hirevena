import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useState } from "react";

const ADMIN_ID = "Utkarsh809071";
const ADMIN_PASS = "U80907120";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate a brief auth check
    setTimeout(() => {
      if (adminId === ADMIN_ID && password === ADMIN_PASS) {
        localStorage.setItem("hirevena_admin_auth", "true");
        onLoginSuccess();
      } else {
        setError("Invalid credentials. Please try again.");
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.20 0.07 245) 0%, oklch(0.32 0.09 245) 60%, oklch(0.45 0.13 245) 100%)",
      }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, oklch(0.70 0.15 245) 0%, transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.60 0.12 245) 0%, transparent 40%)",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header band */}
          <div
            className="px-8 pt-8 pb-6 text-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.28 0.085 245), oklch(0.40 0.12 245))",
            }}
          >
            <img
              src="/assets/uploads/IMG_20260303_130341.jpg-1.jpeg"
              alt="Hirevena"
              className="h-16 w-auto mx-auto mb-4 object-contain"
            />
            <h1 className="text-xl font-display font-black text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Secure login — authorized personnel only
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {/* Error message */}
            {error && (
              <div
                data-ocid="admin_login.error_state"
                role="alert"
                className="px-4 py-3 rounded-lg text-sm font-medium border"
                style={{
                  backgroundColor: "oklch(0.97 0.02 27)",
                  borderColor: "oklch(0.85 0.12 27)",
                  color: "oklch(0.45 0.22 27)",
                }}
              >
                {error}
              </div>
            )}

            {/* Admin ID */}
            <div className="space-y-1.5">
              <Label
                htmlFor="adminId"
                className="text-sm font-semibold"
                style={{ color: "oklch(0.28 0.085 245)" }}
              >
                Admin ID
              </Label>
              <Input
                id="adminId"
                data-ocid="admin_login.admin_id.input"
                type="text"
                placeholder="Enter your admin ID"
                value={adminId}
                onChange={(e) => {
                  setAdminId(e.target.value);
                  setError("");
                }}
                autoComplete="username"
                required
                className="h-11 rounded-xl border-2 transition-colors focus:border-blue-500"
                style={{
                  borderColor: "oklch(0.88 0.03 240)",
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-semibold"
                style={{ color: "oklch(0.28 0.085 245)" }}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  data-ocid="admin_login.password.input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  required
                  className="h-11 rounded-xl border-2 pr-11 transition-colors focus:border-blue-500"
                  style={{
                    borderColor: "oklch(0.88 0.03 240)",
                  }}
                />
                <button
                  type="button"
                  data-ocid="admin_login.toggle_password.button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              data-ocid="admin_login.submit_button"
              disabled={isLoading || !adminId || !password}
              className="w-full h-11 font-bold text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: isLoading
                  ? "oklch(0.48 0.12 245)"
                  : "linear-gradient(135deg, oklch(0.28 0.085 245), oklch(0.50 0.15 245))",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-white/50 mt-5">
          Hirevena CRM · Admin Access Only · v1.0
        </p>
      </div>
    </div>
  );
}
