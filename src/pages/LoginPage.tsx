// ============================================================
// LoginPage.tsx — Clean, minimal login
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import {
  Eye, EyeOff, AlertCircle, ArrowLeft, ArrowRight,
} from "lucide-react";

export default function LoginPage() {
  const { loginWithCredentials, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "billing_officer" ? "/billing" : "/certification", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    setIsSubmitting(true);

    setTimeout(() => {
      const result = loginWithCredentials(email.trim(), password);
      if (result.success) {
        const savedUser = JSON.parse(localStorage.getItem("lasbca_user") || "null");
        navigate(savedUser?.role === "certification_officer" ? "/certification" : "/billing");
      } else {
        setError(result.error || "Invalid credentials.");
      }
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#050F0A] flex items-center justify-center px-6 py-12 relative">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .d1 { animation-delay: 50ms; }
        .d2 { animation-delay: 150ms; }
        .d3 { animation-delay: 250ms; }

        .login-input {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: white !important;
          height: 48px;
          border-radius: 12px;
          font-size: 15px;
        }
        .login-input:focus {
          border-color: #D4AF37 !important;
          box-shadow: 0 0 0 2px rgba(212,175,55,0.15) !important;
        }
        .login-input::placeholder {
          color: rgba(255,255,255,0.2) !important;
        }
      `}</style>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0A3D1E] rounded-full blur-[180px] opacity-25" />
      </div>

      {/* Back link */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-[12px] text-white/25 hover:text-white/60 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </Link>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo + Title */}
        <div className="text-center mb-10 opacity-0 fade d1">
          <img src="/lasbca-logo.png" alt="" className="w-12 h-12 rounded-full mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign In</h1>
          <p className="text-[13px] text-white/30 mt-1.5">LASBCA Digital Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 opacity-0 fade d2">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl p-3.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.2em] mb-1.5 block pl-1">Email</label>
            <Input
              type="email"
              placeholder="name@lasbca.lg.gov.ng"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="login-input"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.2em] mb-1.5 block pl-1">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="login-input pr-11"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="w-full h-12 rounded-xl font-bold text-[15px] bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#050F0A] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none shadow-[0_0_30px_rgba(212,175,55,0.12)] mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-[#050F0A]/30 border-t-[#050F0A] rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Demo quick-fill — small, unobtrusive */}
        <div className="mt-8 pt-6 border-t border-white/5 opacity-0 fade d3">
          <p className="text-[10px] text-white/15 uppercase tracking-[0.2em] text-center mb-3">Demo</p>
          <div className="flex gap-2">
            <button
              onClick={() => { setEmail("a.ogunlade@lasbca.lg.gov.ng"); setPassword("Billing@2026"); setError(""); }}
              className="flex-1 text-center py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-[12px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
            >
              Billing
            </button>
            <button
              onClick={() => { setEmail("b.mustapha@lasbca.lg.gov.ng"); setPassword("Certify@2026"); setError(""); }}
              className="flex-1 text-center py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-[12px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
            >
              Certification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
