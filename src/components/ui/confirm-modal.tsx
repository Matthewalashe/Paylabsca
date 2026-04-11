// ============================================================
// ConfirmModal.tsx — Reusable confirmation dialog
// ============================================================

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

export type ConfirmVariant = "default" | "danger" | "success" | "warning";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const VARIANT_CONFIG: Record<ConfirmVariant, { icon: typeof Info; iconBg: string; iconColor: string; btnVariant: "default" | "destructive" | "gold" }> = {
  default: { icon: Info, iconBg: "bg-blue-100", iconColor: "text-blue-600", btnVariant: "default" },
  danger: { icon: AlertTriangle, iconBg: "bg-red-100", iconColor: "text-red-600", btnVariant: "destructive" },
  success: { icon: CheckCircle, iconBg: "bg-green-100", iconColor: "text-green-600", btnVariant: "default" },
  warning: { icon: AlertTriangle, iconBg: "bg-amber-100", iconColor: "text-amber-600", btnVariant: "gold" },
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ animation: "fadeIn 0.2s ease-out" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-[420px] mx-4 overflow-hidden"
        style={{ animation: "scaleIn 0.2s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{title}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-5 pt-6">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={config.btnVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
