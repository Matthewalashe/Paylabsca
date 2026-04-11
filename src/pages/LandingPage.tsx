// ============================================================
// LandingPage.tsx — Public landing with credential-based login
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText, Shield, Send, CreditCard, CheckCircle,
  ArrowRight, Zap, Lock, Globe, UserCheck, ClipboardCheck,
  BarChart3, Eye, EyeOff, AlertCircle, LogIn, Mail, KeyRound,
} from "lucide-react";

const FEATURES = [
  { icon: FileText, title: "Automated Invoice Generation", description: "Create professional invoices with official LASBCA branding and statutory revenue codes." },
  { icon: Shield, title: "Certification Workflow", description: "Billing Officer creates, Certification Officer stamps, signs, and approves — all digitally." },
  { icon: CreditCard, title: "Instant Paystack Payment", description: "Clients get QR codes and instant payment links. Payments confirm automatically." },
  { icon: Send, title: "Email & SMS Delivery", description: "Approved invoices are delivered via email and SMS with payment links." },
  { icon: BarChart3, title: "Real-Time Dashboard", description: "Track invoices, payments, and revenue across all 20 LGAs." },
  { icon: Lock, title: "Secure & Compliant", description: "Role-based access, audit trails, and encrypted data storage." },
];

const WORKFLOW_STEPS = [
  { step: "01", title: "Billing Officer Creates", description: "Enter property details, photos, coordinates, and fees", icon: FileText },
  { step: "02", title: "Certification Officer Reviews", description: "Reviews invoice, applies official stamp & digital signature", icon: Shield },
  { step: "03", title: "Invoice Sent to Client", description: "Client receives invoice via email + SMS with Paystack link", icon: Send },
  { step: "04", title: "Payment Confirmed", description: "Paystack processes payment, receipt auto-generated", icon: CheckCircle },
];

export default function LandingPage() {
  const { loginWithCredentials, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Small delay for UX polish
    setTimeout(() => {
      const result = loginWithCredentials(email.trim(), password);
      if (result.success) {
        // Determine where to navigate based on user role
        const savedUser = JSON.parse(localStorage.getItem("lasbca_user") || "null");
        if (savedUser?.role === "certification_officer") {
          navigate("/certification");
        } else {
          navigate("/billing");
        }
      } else {
        setError(result.error || "Login failed");
      }
      setIsSubmitting(false);
    }, 400);
  };

  const handleContinue = () => {
    if (user) {
      navigate(user.role === "billing_officer" ? "/billing" : "/certification");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Inline animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up-delay {
          0% { opacity: 0; transform: translateY(30px); }
          30% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up-delay-2 {
          0% { opacity: 0; transform: translateY(30px); }
          50% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite 1s; }
        .animate-pulse-ring { animation: pulse-ring 3s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .animate-slide-up-delay { animation: slide-up-delay 1.2s ease-out forwards; }
        .animate-slide-up-delay-2 { animation: slide-up-delay-2 1.5s ease-out forwards; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }
      `}</style>

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/lasbca-logo.png" alt="LASBCA" className="w-10 h-10 rounded-full" />
            <div>
              <span className="font-bold text-[#006400] text-sm">LASBCA</span>
              <span className="text-gray-400 text-xs block leading-none">Billing System</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <Button size="sm" onClick={handleContinue}>
                Continue as {user.role === "billing_officer" ? "Billing" : "Certification"} <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <a href="#login" className="text-sm font-medium text-[#006400] hover:underline">
                Sign In →
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO — Centered + Animated ===== */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Animated background blobs */}
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-green-100/60 to-emerald-50/30 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-gradient-to-tr from-amber-100/50 to-yellow-50/20 rounded-full blur-3xl animate-float-delayed pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-green-50/30 to-transparent rounded-full blur-3xl animate-pulse-ring pointer-events-none" />

        <div className="max-w-7xl mx-auto relative w-full">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="animate-slide-up inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-8">
              <Zap className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-semibold text-green-700">Official Government Platform</span>
            </div>

            {/* Title */}
            <h1 className="animate-slide-up text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
              Automated Billing &{" "}
              <span className="bg-gradient-to-r from-[#006400] via-[#008000] to-[#D4AF37] bg-clip-text text-transparent animate-gradient">
                Payment Tracking
              </span>
              <br />
              for LASBCA
            </h1>

            {/* Subtitle */}
            <p className="animate-slide-up-delay text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              The official digital billing platform for the Lagos State Building Control Agency.
              Create invoices, certify, approve, and process payments — all in one system.
            </p>

            {/* Stats row — animated */}
            <div className="animate-slide-up-delay-2 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto mb-10">
              {[
                { value: "20", label: "LGAs Covered" },
                { value: "₦270M+", label: "Revenue Tracked" },
                { value: "500+", label: "Invoices Processed" },
                { value: "24/7", label: "System Uptime" },
              ].map(s => (
                <div key={s.label} className="bg-white/80 backdrop-blur rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xl font-black text-[#006400]">{s.value}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== LOGIN FORM ===== */}
      <section id="login" className="py-16 px-6 bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-2">Secure Access</p>
            <h2 className="text-3xl font-black text-gray-900">Sign In</h2>
            <p className="text-sm text-gray-500 mt-2">Enter your LASBCA credentials to access the system</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src="/lasbca-logo.png" alt="LASBCA" className="w-12 h-12 rounded-full shadow-md" />
              <div className="text-left">
                <p className="font-bold text-gray-900 text-sm">LASBCA Portal</p>
                <p className="text-[11px] text-gray-500">Billing & Payment System</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-slide-up">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Email Address</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    placeholder="name@lasbca.lg.gov.ng"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="pl-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full mt-2" 
                size="lg" 
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" /> Sign In
                  </span>
                )}
              </Button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-3">Demo Credentials</p>
              <div className="space-y-2">
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardCheck className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-bold text-green-800">Billing Officer</span>
                  </div>
                  <p className="text-[11px] text-green-700 font-mono">a.ogunlade@lasbca.lg.gov.ng</p>
                  <p className="text-[11px] text-green-700 font-mono">Billing@2026</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-bold text-amber-800">Certification Officer</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-mono">b.mustapha@lasbca.lg.gov.ng</p>
                  <p className="text-[11px] text-amber-700 font-mono">Certify@2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WORKFLOW ===== */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-2">How It Works</p>
            <h2 className="text-3xl font-black text-gray-900">Simple 4-Step Workflow</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map(ws => {
              const Icon = ws.icon;
              return (
                <div key={ws.step} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="text-4xl font-black text-green-100 mb-3">{ws.step}</div>
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-[#006400]" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{ws.title}</h3>
                  <p className="text-sm text-gray-500">{ws.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-2">Features</p>
            <h2 className="text-3xl font-black text-gray-900">Everything You Need</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center mb-4 transition-colors">
                    <Icon className="w-6 h-6 text-[#006400]" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#006400] to-[#003200]">
        <div className="max-w-3xl mx-auto text-center">
          <Globe className="w-12 h-12 text-[#D4AF37] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Modernize LASBCA Billing?</h2>
          <p className="text-green-200 text-lg mb-8">Access the automated billing system and start generating compliant invoices instantly.</p>
          <a href="#login">
            <Button variant="gold" size="xl">
              <ArrowRight className="w-5 h-5" /> Get Started Now
            </Button>
          </a>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/lasbca-logo.png" alt="" className="w-8 h-8 rounded-full" />
            <div>
              <p className="text-white text-sm font-semibold">LASBCA Automated Billing System</p>
              <p className="text-gray-400 text-xs">Lagos State Building Control Agency</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs">© {new Date().getFullYear()} Lagos State Government. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
