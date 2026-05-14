// ============================================================
// VerifyEmailPage.tsx — Handles email verification link clicks
// ============================================================

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the link.");
      return;
    }

    verifyToken(token);
  }, [token]);

  async function verifyToken(t: string) {
    try {
      const { data, error } = await supabase.rpc("verify_email_token", {
        p_token: t,
      });

      if (error) {
        setStatus("error");
        setErrorMsg(error.message || "Verification failed.");
        return;
      }

      if (data?.success) {
        setStatus("success");
        setEmail(data.email || "");
      } else {
        setStatus("error");
        setErrorMsg(data?.error || "Invalid or expired verification link.");
      }
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e.message || "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6 py-12 font-sans">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .fade { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scale { animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="w-full max-w-md">
        {/* Loading */}
        {status === "loading" && (
          <div className="text-center opacity-0 fade" style={{ animationDelay: "50ms" }}>
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Verifying your email...</h1>
            <p className="text-sm text-gray-400 mt-2">Please wait a moment.</p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="text-center opacity-0 fade" style={{ animationDelay: "50ms" }}>
            <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-6 opacity-0 scale" style={{ animationDelay: "200ms" }}>
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Email Verified!</h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {email ? (
                <>Your email <strong className="text-gray-800">{email}</strong> has been verified successfully.</>
              ) : (
                <>Your email has been verified successfully.</>
              )}
            </p>

            <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Your account is now fully activated
              </div>
            </div>

            <Link
              to="/login"
              className="mt-6 inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl font-bold text-[15px] bg-[#006400] text-white hover:bg-[#005000] transition-all shadow-lg shadow-green-900/15"
            >
              Sign In to Your Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="text-center opacity-0 fade" style={{ animationDelay: "50ms" }}>
            <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-6 opacity-0 scale" style={{ animationDelay: "200ms" }}>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Verification Failed</h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{errorMsg}</p>

            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-amber-800 text-sm">
                This link may have already been used or expired. Try signing in — if your email isn't verified, you can request a new verification email.
              </p>
            </div>

            <Link
              to="/login"
              className="mt-6 inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl font-bold text-[15px] bg-[#006400] text-white hover:bg-[#005000] transition-all shadow-lg shadow-green-900/15"
            >
              Go to Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-300 mt-10">
          LASBCA Digital Portal &middot; Lagos State Government
        </p>
      </div>
    </div>
  );
}
