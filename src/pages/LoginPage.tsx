// ============================================================
// LoginPage.tsx — Premium standalone login portal
// ============================================================

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye, EyeOff, AlertCircle, LogIn, Mail,
  KeyRound, ArrowLeft, Shield, ChevronRight,
} from "lucide-react";

export default function LoginPage() {
  const { loginWithCredentials, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect
  if (isAuthenticated && user) {
    navigate(user.role === "billing_officer" ? "/billing" : "/certification", { replace: true });
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
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
    }, 600);
  };

  return (
    <div className="min-h-screen flex">
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .anim-fade { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-1 { animation-delay: 100ms; }
        .delay-2 { animation-delay: 200ms; }
        .delay-3 { animation-delay: 300ms; }
        .shimmer-text {
          background: linear-gradient(90deg, #D4AF37 25%, #f5e6a3 50%, #D4AF37 75%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* Left Panel — Branding & Visual */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#061A12] relative overflow-hidden flex-col justify-between p-12">
        {/* Background orbs */}
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-[#0B5D2E] rounded-full blur-[130px] opacity-40" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#D4AF37] rounded-full blur-[150px] opacity-8" />
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[300px] bg-[#008833] rounded-full blur-[120px] opacity-15" />
        {/* Grid texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50" />

        {/* Top — Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/lasbca-logo.png" alt="" className="w-10 h-10 rounded-full" />
          <div>
            <span className="font-bold text-white text-sm tracking-wide">LASBCA</span>
            <span className="text-gray-500 text-[10px] uppercase tracking-widest block leading-tight">Digital Portal</span>
          </div>
        </div>

        {/* Center — Hero Text */}
        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
            Building a<br />
            <span className="shimmer-text">Smarter Lagos.</span>
          </h1>
          <p className="text-gray-400 text-lg font-light leading-relaxed max-w-md">
            One centralized platform for billing, certification, and revenue management across all 20 Local Government Areas.
          </p>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 mt-10">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">500+</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Invoices</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">₦270M+</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Revenue</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">99.9%</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Uptime</span>
            </div>
          </div>
        </div>

        {/* Bottom — Footer */}
        <div className="relative z-10">
          <p className="text-[11px] text-gray-600">© {new Date().getFullYear()} Lagos State Government • All Rights Reserved</p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] px-6 py-12 relative">
        {/* Back arrow */}
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-900 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <div className="w-full max-w-md">
          {/* Mobile Logo (visible on small screens) */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <img src="/lasbca-logo.png" alt="" className="w-10 h-10 rounded-full shadow-sm" />
            <div>
              <span className="font-bold text-[#006400] text-sm">LASBCA</span>
              <span className="text-gray-400 text-[10px] block">Digital Billing Portal</span>
            </div>
          </div>

          <div className="opacity-0 anim-fade">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-gray-500 text-[15px] mb-8">Sign in using your official credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="opacity-0 anim-fade bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="opacity-0 anim-fade delay-1 space-y-2">
              <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Email Address</Label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-gray-400 group-focus-within:text-[#006400] transition-colors absolute left-4 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  placeholder="name@lasbca.lg.gov.ng"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="pl-11 h-12 rounded-xl text-[15px] border-gray-200 focus:border-[#006400] focus:ring-[#006400]/20"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="opacity-0 anim-fade delay-2 space-y-2">
              <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Password</Label>
              <div className="relative group">
                <KeyRound className="w-4 h-4 text-gray-400 group-focus-within:text-[#006400] transition-colors absolute left-4 top-1/2 -translate-y-1/2" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="pl-11 pr-11 h-12 rounded-xl text-[15px] border-gray-200 focus:border-[#006400] focus:ring-[#006400]/20"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="opacity-0 anim-fade delay-3">
              <Button 
                type="submit" 
                className="w-full h-12 text-[15px] font-bold rounded-xl bg-[#006400] hover:bg-[#005000] text-white transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-green-900/20" 
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" /> Sign In
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Demo Quick-Fill */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold text-center mb-4">Demo Access</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setEmail('a.ogunlade@lasbca.lg.gov.ng'); setPassword('Billing@2026'); setError(""); }}
                className="text-left bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#006400]/30 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-green-700" />
                  </div>
                  <span className="text-[11px] text-gray-400 uppercase tracking-widest group-hover:text-green-700 transition-colors">Billing</span>
                </div>
                <p className="text-sm text-gray-900 font-medium">a.ogunlade</p>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-green-600 mt-1 transition-colors" />
              </button>
              <button 
                onClick={() => { setEmail('b.mustapha@lasbca.lg.gov.ng'); setPassword('Certify@2026'); setError(""); }}
                className="text-left bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#D4AF37]/30 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-amber-700" />
                  </div>
                  <span className="text-[11px] text-gray-400 uppercase tracking-widest group-hover:text-amber-700 transition-colors">Certify</span>
                </div>
                <p className="text-sm text-gray-900 font-medium">b.mustapha</p>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-amber-600 mt-1 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
