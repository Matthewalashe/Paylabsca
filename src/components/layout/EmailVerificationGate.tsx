// ============================================================
// EmailVerificationGate.tsx — Blocks unverified users
// ============================================================
// Shows a full-screen prompt for users who haven't verified
// their email yet. They can resend the verification email.
// ============================================================

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email-service";
import { supabase } from "@/lib/supabase";
import { Mail, RefreshCw, LogOut, ShieldAlert, CheckCircle } from "lucide-react";

export default function EmailVerificationGate({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // If user is verified or not logged in, render children normally
  if (!user || user.emailVerified) {
    return <>{children}</>;
  }

  const handleResend = async () => {
    if (resending || !user) return;
    setResending(true);
    setResent(false);

    try {
      // Generate a new verification token via RPC
      const { data: token, error } = await supabase.rpc("generate_verification_token", {
        p_user_id: user.id,
      });

      if (error || !token) {
        throw new Error(error?.message || "Failed to generate token.");
      }

      // Send verification email via EmailJS
      await sendVerificationEmail({
        name: user.name,
        email: user.email,
        token: token as string,
      });

      setResent(true);
    } catch (e) {
      console.error("Failed to resend verification:", e);
    }

    setResending(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6 py-12 font-sans">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(212, 175, 55, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
        }
        .fade { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .pulse { animation: pulse-ring 2s ease-out infinite; }
      `}</style>

      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="opacity-0 fade" style={{ animationDelay: "50ms" }}>
          <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center mx-auto mb-6 pulse">
            <ShieldAlert className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        {/* Title */}
        <div className="opacity-0 fade" style={{ animationDelay: "150ms" }}>
          <h1 className="text-2xl font-black text-gray-900">Verify Your Email</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            A verification link was sent to <strong className="text-gray-800">{user.email}</strong>.
            Please check your inbox and click the link to continue.
          </p>
        </div>

        {/* Status cards */}
        <div className="mt-8 space-y-3 opacity-0 fade" style={{ animationDelay: "250ms" }}>
          {resent ? (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 text-left">
                Verification email sent! Check your inbox at <strong>{user.email}</strong>.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800 text-left">
                Check your inbox for the verification email. Also check your spam/junk folder.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3 opacity-0 fade" style={{ animationDelay: "350ms" }}>
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full h-12 rounded-xl font-bold text-[15px] bg-[#006400] text-white hover:bg-[#005000] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-green-900/15 flex items-center justify-center gap-2"
          >
            {resending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend Verification Email
              </>
            )}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full h-12 rounded-xl font-bold text-[15px] bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            I've Verified — Refresh
          </button>

          <button
            onClick={logout}
            className="w-full h-10 rounded-xl text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-gray-300 mt-10">
          LASBCA Digital Portal &middot; Lagos State Government
        </p>
      </div>
    </div>
  );
}
