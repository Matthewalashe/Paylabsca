// ============================================================
// LandingPage.tsx — Minimal internal portal landing
// ============================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ArrowRight } from "lucide-react";

// Words that cycle in the hero
const MORPH_WORDS = ["Billing", "Certification", "Payments", "Revenue"];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Word cycling interval
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setWordIndex(prev => (prev + 1) % MORPH_WORDS.length);
        setIsAnimating(false);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const dashboardPath = user?.role === "billing_officer" ? "/billing" : "/certification";

  return (
    <div className="min-h-screen bg-[#050F0A] text-white font-sans selection:bg-[#D4AF37]/30 overflow-x-hidden">
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes morph-out {
          0% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
          100% { opacity: 0; transform: translateY(-28px) scale(0.95); filter: blur(6px); }
        }
        @keyframes morph-in {
          0% { opacity: 0; transform: translateY(28px) scale(0.95); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(260px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(260px) rotate(-360deg); }
        }
        @keyframes orbit-reverse {
          from { transform: rotate(0deg) translateX(180px) rotate(0deg); }
          to { transform: rotate(-360deg) translateX(180px) rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.08); opacity: 0.25; }
        }
        .anim-up { animation: fade-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .d1 { animation-delay: 0ms; }
        .d2 { animation-delay: 120ms; }
        .d3 { animation-delay: 240ms; }
        .d4 { animation-delay: 360ms; }
        .morph-out { animation: morph-out 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .morph-in { animation: morph-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* ===== NAV ===== */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-[#050F0A]/90 backdrop-blur-xl border-b border-white/5 py-3" : "py-5"
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/lasbca-logo.png" alt="" className="w-8 h-8 rounded-full" />
            <span className="font-bold text-[13px] tracking-wide text-white/90">LASBCA</span>
          </Link>
          <Link to={isAuthenticated ? dashboardPath : "/login"}>
            <button className="flex items-center gap-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors">
              {isAuthenticated ? "Dashboard" : "Sign In"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Orbital ambient background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Pulsing ring */}
          <div className="absolute w-[520px] h-[520px] border border-white/[0.03] rounded-full" style={{ animation: "pulse-ring 6s ease-in-out infinite" }} />
          <div className="absolute w-[360px] h-[360px] border border-white/[0.04] rounded-full" style={{ animation: "pulse-ring 5s ease-in-out infinite 1s" }} />
          
          {/* Orbiting dots */}
          <div className="absolute w-0 h-0" style={{ animation: "orbit 30s linear infinite" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/40" />
          </div>
          <div className="absolute w-0 h-0" style={{ animation: "orbit-reverse 22s linear infinite" }}>
            <div className="w-1 h-1 rounded-full bg-green-400/30" />
          </div>
          
          {/* Gradient orbs */}
          <div className="absolute w-[500px] h-[500px] bg-[#0A3D1E] rounded-full blur-[140px] opacity-30" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-[#D4AF37] rounded-full blur-[160px] opacity-[0.04]" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          {/* Micro-badge */}
          <div className="opacity-0 anim-up d1 inline-flex items-center gap-2 border border-white/10 rounded-full px-3 py-1.5 mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.25em]">Internal Portal</span>
          </div>

          {/* Main heading with morph text */}
          <h1 className="opacity-0 anim-up d2 text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[1] tracking-tight mb-8">
            <span className="text-white/90">Automated</span>
            <br />
            <span className="inline-block relative h-[1.1em] overflow-hidden align-bottom">
              <span
                key={wordIndex}
                className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-[#D4AF37] ${
                  isAnimating ? "morph-out" : "morph-in"
                }`}
              >
                {MORPH_WORDS[wordIndex]}
              </span>
            </span>
          </h1>

          {/* One-line subtitle */}
          <p className="opacity-0 anim-up d3 text-white/30 text-lg font-light mb-12 max-w-md mx-auto leading-relaxed">
            Lagos State Building Control Agency
          </p>

          {/* Single CTA */}
          <div className="opacity-0 anim-up d4">
            <Link to={isAuthenticated ? dashboardPath : "/login"}>
              <button className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#050F0A] font-bold text-[15px] px-8 py-4 rounded-xl hover:scale-[1.03] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(212,175,55,0.15)] hover:shadow-[0_0_60px_rgba(212,175,55,0.25)]">
                {isAuthenticated ? "Go to Dashboard" : "Sign In to Portal"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30">
          <div className="w-4 h-7 border border-white/30 rounded-full flex justify-center pt-1.5">
            <div className="w-0.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ===== MINIMAL INFO STRIP ===== */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: "20", label: "LGAs" },
            { val: "₦270M+", label: "Revenue" },
            { val: "500+", label: "Invoices" },
            { val: "99.9%", label: "Uptime" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-bold text-white/90 tracking-tight">{s.val}</p>
              <p className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-[11px] text-white/20">© {new Date().getFullYear()} Lagos State Government</span>
          <span className="text-[11px] text-white/20">LASBCA Digital Infrastructure</span>
        </div>
      </footer>
    </div>
  );
}
