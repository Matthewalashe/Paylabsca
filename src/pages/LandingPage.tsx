// ============================================================
// LandingPage.tsx — Premium Visual Showcase (No Login)
// ============================================================
// Mobile-first, Lagos State green + gold accent gradients,
// rich animations, intentional whitespace, typographic hierarchy.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, FileText, Shield, CreditCard, Send,
  BarChart3, Lock, CheckCircle, ChevronRight,
  Building2, Zap,
} from "lucide-react";

const WORKFLOW = [
  { step: "01", title: "Create Invoice", desc: "Billing Officer enters property details, photos, GPS data, and fee schedules.", icon: FileText },
  { step: "02", title: "Official Review", desc: "Certification Officer reviews, applies official stamp and digital signature.", icon: Shield },
  { step: "03", title: "Deliver to Client", desc: "Client receives invoice via email with embedded QR code and payment link.", icon: Send },
  { step: "04", title: "Instant Payment", desc: "Client pays online via Credo, receipt auto-generated. Books updated in real-time.", icon: CreditCard },
];

const CAPABILITIES = [
  { title: "Revenue Intelligence", desc: "Real-time dashboards tracking billing performance across all 20 LGAs.", icon: BarChart3, color: "from-green-500 to-emerald-600" },
  { title: "Tamper-Proof Certification", desc: "Digital stamps and biometric signatures with full audit trail.", icon: Shield, color: "from-[#D4AF37] to-amber-600" },
  { title: "Enterprise Security", desc: "Role-based access, encrypted storage, and session management.", icon: Lock, color: "from-gray-700 to-gray-900" },
  { title: "Automated Delivery", desc: "Email integration with branded invoices and embedded payment QR codes.", icon: Send, color: "from-green-600 to-[#D4AF37]" },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll-based navbar transition
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for scroll-reveal animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => new Set(prev).add(entry.target.id));
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll("[data-reveal]").forEach(el => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#006400] selection:text-white overflow-x-hidden">
      <style>{`
        @keyframes hero-fade {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob-float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-3deg); }
        }
        @keyframes blob-float-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-40px, 20px) rotate(-5deg); }
          66% { transform: translate(20px, -40px) rotate(3deg); }
        }
        @keyframes count-up { from { opacity: 0; } to { opacity: 1; } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pulse-gold { 0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); } 50% { box-shadow: 0 0 0 12px rgba(212,175,55,0); } }

        .hero-anim { animation: hero-fade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .d1 { animation-delay: 0ms; }
        .d2 { animation-delay: 150ms; }
        .d3 { animation-delay: 300ms; }
        .d4 { animation-delay: 450ms; }
        .d5 { animation-delay: 600ms; }

        .blob-1 { animation: blob-float 20s ease-in-out infinite; }
        .blob-2 { animation: blob-float-2 25s ease-in-out infinite; }

        .reveal { opacity: 0; transform: translateY(32px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        .gradient-border {
          background: linear-gradient(135deg, #006400, #D4AF37) padding-box,
                      linear-gradient(135deg, #006400, #D4AF37) border-box;
        }

        .cta-glow { animation: pulse-gold 2.5s ease-in-out infinite; }
      `}</style>

      {/* ===== NAVBAR ===== */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100 py-3' 
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/lasbca-logo.png" alt="LASBCA" className="w-9 h-9 rounded-full shadow-sm group-hover:scale-105 transition-transform" />
            <div className="hidden sm:block">
              <span className={`font-bold text-[13px] tracking-wide transition-colors ${scrolled ? 'text-[#006400]' : 'text-white'}`}>LASBCA</span>
              <span className={`text-[10px] uppercase tracking-[0.2em] block leading-tight transition-colors ${scrolled ? 'text-gray-400' : 'text-white/50'}`}>Digital Portal</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <Link to={user.role === "billing_officer" ? "/billing" : "/certification"}>
                <Button size="sm" className="rounded-full px-5 bg-[#006400] hover:bg-[#005000] text-white shadow-md">
                  Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm" className={`rounded-full px-6 font-medium transition-all ${
                  scrolled 
                    ? 'bg-[#006400] text-white hover:bg-[#005000] shadow-md' 
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-md'
                }`}>
                  Sign In <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-[100vh] bg-[#061A12] flex items-center overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-[#0A5D2E] rounded-full blur-[150px] opacity-30 blob-1" />
          <div className="absolute bottom-[-15%] left-[-8%] w-[550px] h-[550px] bg-[#D4AF37] rounded-full blur-[160px] opacity-8 blob-2" />
          <div className="absolute top-[30%] left-[15%] w-[500px] h-[300px] bg-[#008833] rounded-full blur-[130px] opacity-15 blob-1" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjAuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvc3ZnPg==')] opacity-80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full py-32 lg:py-0">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="opacity-0 hero-anim d1 inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-[0.2em]">Lagos State Government</span>
            </div>

            {/* Main Title */}
            <h1 className="opacity-0 hero-anim d2 text-[clamp(2.5rem,6vw,5rem)] font-black text-white leading-[1.05] tracking-tight mb-8">
              The Future of<br />Building Control<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-[#D4AF37]">
                Starts Here.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="opacity-0 hero-anim d3 text-xl text-gray-400 font-light leading-relaxed max-w-lg mb-12">
              LASBCA's automated billing, digital certification, and instant payment platform — serving 20 Local Government Areas.
            </p>

            {/* CTA Buttons */}
            <div className="opacity-0 hero-anim d4 flex flex-wrap gap-4">
              <Link to="/login">
                <Button className="h-14 px-8 text-base font-bold rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-[#c9a430] hover:to-amber-400 text-[#061A12] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#D4AF37]/20 cta-glow">
                  Access Portal <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button className="h-14 px-8 text-base font-medium rounded-xl bg-white/5 border border-white/15 text-white hover:bg-white/10 backdrop-blur-sm transition-all">
                  See How It Works
                </Button>
              </a>
            </div>

            {/* Stats Row */}
            <div className="opacity-0 hero-anim d5 flex flex-wrap gap-10 mt-16 pt-10 border-t border-white/10">
              {[
                { value: "20", label: "LGAs Covered" },
                { value: "₦270M+", label: "Revenue Managed" },
                { value: "500+", label: "Invoices Processed" },
                { value: "99.9%", label: "System Uptime" },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{stat.value}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-semibold mt-1">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-5 h-8 border-2 border-white/20 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" data-reveal className="py-24 lg:py-32 px-6 bg-[#FAFAFA]">
        <div className={`max-w-7xl mx-auto reveal ${isVisible('how-it-works') ? 'visible' : ''}`}>
          <div className="max-w-2xl mb-16">
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-[0.25em] mb-4 block">Process</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-5">
              From creation<br />to collection.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              A streamlined 4-step workflow that takes invoices from creation to certified payment, with full accountability at every stage.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW.map((w, i) => {
              const Icon = w.icon;
              return (
                <div key={w.step} className="group relative bg-white rounded-2xl p-7 border border-gray-100 hover:border-[#006400]/20 hover:shadow-xl transition-all duration-500 overflow-hidden">
                  {/* Step gradient number */}
                  <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-100 to-gray-50 mb-4 leading-none select-none">
                    {w.step}
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#006400] to-[#008833] flex items-center justify-center mb-5 shadow-md shadow-green-900/10 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">{w.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{w.desc}</p>

                  {/* Connector line */}
                  {i < WORKFLOW.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CAPABILITIES — Bento Grid ===== */}
      <section id="capabilities" data-reveal className="py-24 lg:py-32 px-6">
        <div className={`max-w-7xl mx-auto reveal ${isVisible('capabilities') ? 'visible' : ''}`}>
          <div className="max-w-2xl mb-16">
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-[0.25em] mb-4 block">Capabilities</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Built for<br />government scale.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {CAPABILITIES.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <div 
                  key={i} 
                  className="group relative bg-white rounded-3xl p-8 lg:p-10 border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-500 overflow-hidden"
                >
                  {/* Subtle gradient orb */}
                  <div className={`absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br ${cap.color} rounded-full blur-[60px] opacity-0 group-hover:opacity-15 transition-opacity duration-700`} />

                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cap.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-[#006400] transition-colors">{cap.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{cap.desc}</p>
                  <ArrowRight className="w-5 h-5 text-gray-200 group-hover:text-[#006400] mt-6 transform group-hover:translate-x-2 transition-all" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FULL-WIDTH CTA ===== */}
      <section id="cta" data-reveal className="py-24 lg:py-32 px-6">
        <div className={`max-w-7xl mx-auto reveal ${isVisible('cta') ? 'visible' : ''}`}>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#061A12] via-[#0A3D1E] to-[#061A12] p-12 lg:p-20 text-center">
            {/* Background ornaments */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#D4AF37] rounded-full blur-[180px] opacity-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-green-500 rounded-full blur-[140px] opacity-10 pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
                <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-[0.2em]">Get Started Today</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-6 max-w-2xl mx-auto">
                Ready to transform<br />government billing?
              </h2>
              <p className="text-lg text-gray-400 max-w-lg mx-auto mb-10 font-light leading-relaxed">
                Access the LASBCA Digital Portal and start generating compliant, certified invoices instantly.
              </p>

              <Link to="/login">
                <Button className="h-14 px-10 text-base font-bold rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#061A12] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#D4AF37]/20 cta-glow">
                  Access Portal <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#FAFAFA] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src="/lasbca-logo.png" alt="" className="w-8 h-8 rounded-full grayscale hover:grayscale-0 transition-all" />
              <div>
                <span className="font-bold text-gray-900 text-sm tracking-wide">LASBCA</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] block">Lagos State Building Control Agency</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-8 text-[13px] text-gray-400 font-medium">
              <a href="#" className="hover:text-gray-900 transition-colors">Documentation</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Support</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
            <p className="text-[12px] text-gray-400">© {new Date().getFullYear()} Lagos State Government. All rights reserved.</p>
            <p className="text-[12px] text-gray-400">Powered by LASBCA Digital Infrastructure</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
