// ============================================================
// LandingPage.tsx — White hero with particle field + morph text
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ArrowRight } from "lucide-react";

const MORPH_WORDS = ["Billing", "Certification", "Payments", "Revenue"];

// Particle system
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; opacity: number;
}

function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>, count = 60) {
  const particles = useRef<Particle[]>([]);
  const animId = useRef(0);

  const init = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = c.offsetWidth * window.devicePixelRatio;
    c.height = c.offsetHeight * window.devicePixelRatio;
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.3 + 0.1,
    }));
  }, [canvasRef, count]);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, c.width, c.height);

    const pts = particles.current;
    // Move & draw particles
    for (const p of pts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = c.width;
      if (p.x > c.width) p.x = 0;
      if (p.y < 0) p.y = c.height;
      if (p.y > c.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * window.devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 100, 0, ${p.opacity})`;
      ctx.fill();
    }

    // Draw connection lines
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 120 * window.devicePixelRatio;
        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(0, 100, 0, ${0.06 * (1 - dist / maxDist)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    animId.current = requestAnimationFrame(draw);
  }, [canvasRef]);

  useEffect(() => {
    init();
    draw();
    const handleResize = () => { init(); };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [init, draw]);
}

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useParticles(canvasRef, 55);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <div className="h-screen bg-white text-gray-900 font-sans selection:bg-[#006400]/20 overflow-hidden">
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes morph-out {
          0% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
          100% { opacity: 0; transform: translateY(-28px) scale(0.95); filter: blur(8px); }
        }
        @keyframes morph-in {
          0% { opacity: 0; transform: translateY(28px) scale(0.95); filter: blur(8px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
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
        scrolled ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 py-3" : "py-5"
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/lasbca-logo.png" alt="" className="w-8 h-8 rounded-full" />
            <span className="font-bold text-[13px] tracking-wide text-gray-900">LASBCA</span>
          </Link>
          <Link to={isAuthenticated ? dashboardPath : "/login"}>
            <button className="flex items-center gap-2 text-[13px] font-medium text-gray-400 hover:text-gray-900 transition-colors">
              {isAuthenticated ? "Dashboard" : "Sign In"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </nav>

      {/* ===== HERO — Full viewport, white with particle canvas ===== */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Particle canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Soft radial lighting */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-radial from-green-50/80 via-transparent to-transparent rounded-full" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-radial from-amber-50/40 via-transparent to-transparent rounded-full" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="opacity-0 anim-up d1 inline-flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 mb-10 bg-white/60 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#006400] animate-pulse" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.25em]">Internal Portal</span>
          </div>

          {/* Heading with morph */}
          <h1 className="opacity-0 anim-up d2 text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[1] tracking-tight mb-8">
            <span className="text-gray-900">Automated</span>
            <br />
            <span className="inline-block relative h-[1.15em] overflow-hidden align-bottom">
              <span
                key={wordIndex}
                className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#006400] to-[#D4AF37] ${
                  isAnimating ? "morph-out" : "morph-in"
                }`}
              >
                {MORPH_WORDS[wordIndex]}
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="opacity-0 anim-up d3 text-gray-400 text-lg font-light mb-12">
            Lagos State Building Control Agency
          </p>

          {/* CTA */}
          <div className="opacity-0 anim-up d4">
            <Link to={isAuthenticated ? dashboardPath : "/login"}>
              <button className="group inline-flex items-center gap-3 bg-[#006400] text-white font-bold text-[15px] px-8 py-4 rounded-xl hover:bg-[#005000] hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-green-900/15">
                {isAuthenticated ? "Go to Dashboard" : "Sign In to Portal"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
