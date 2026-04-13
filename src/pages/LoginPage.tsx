// ============================================================
// LoginPage.tsx — Clean white login page
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { loginWithCredentials, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "billing_officer" ? "/billing" : "/certification", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    setIsSubmitting(true);
    try {
      const result = await loginWithCredentials(email.trim(), password);
      if (!result.success) {
        setError(result.error || "Invalid credentials.");
      }
      // Navigation happens automatically via useEffect when isAuthenticated changes
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6 py-12 relative font-sans">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .d1 { animation-delay: 50ms; }
        .d2 { animation-delay: 150ms; }
        .d3 { animation-delay: 250ms; }
      `}</style>

      {/* Back */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-[12px] text-gray-300 hover:text-gray-600 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </Link>

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-10 opacity-0 fade d1">
          <img src="/lasbca-logo.png" alt="" className="w-12 h-12 rounded-full mx-auto mb-5 shadow-sm" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In</h1>
          <p className="text-[13px] text-gray-400 mt-1.5">LASBCA Digital Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 opacity-0 fade d2">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1.5 block pl-1">Email</label>
            <Input
              type="email"
              placeholder="name@lasbca.lg.gov.ng"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="h-12 rounded-xl text-[15px] border-gray-200 focus:border-[#006400] focus:ring-[#006400]/20"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1.5 block pl-1">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="h-12 rounded-xl text-[15px] pr-11 border-gray-200 focus:border-[#006400] focus:ring-[#006400]/20"
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="w-full h-12 rounded-xl font-bold text-[15px] bg-[#006400] text-white hover:bg-[#005000] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-green-900/15 mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Demo quick-fill */}
        <div className="mt-8 pt-6 border-t border-gray-200 opacity-0 fade d3">
          <p className="text-[10px] text-gray-300 uppercase tracking-[0.2em] text-center mb-3">Demo</p>
          <div className="flex gap-2">
            <button
              onClick={() => { setEmail("a.ogunlade@lasbca.lg.gov.ng"); setPassword("Billing@2026"); setError(""); }}
              className="flex-1 text-center py-2.5 rounded-lg bg-white border border-gray-200 text-[12px] text-gray-400 hover:text-[#006400] hover:border-[#006400]/30 transition-all"
            >
              Billing Officer
            </button>
            <button
              onClick={() => { setEmail("b.mustapha@lasbca.lg.gov.ng"); setPassword("Certify@2026"); setError(""); }}
              className="flex-1 text-center py-2.5 rounded-lg bg-white border border-gray-200 text-[12px] text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all"
            >
              Certification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
