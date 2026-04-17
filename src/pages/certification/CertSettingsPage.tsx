// ============================================================
// CertSettingsPage.tsx — Manage Official Stamp & Signature
// ============================================================

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useCertAssets } from "@/lib/cert-assets";
import ConfirmModal from "@/components/ui/confirm-modal";
import { Image, UploadCloud, Shield, CheckCircle, Trash2, Loader2 } from "lucide-react";
import { useNotifications } from "@/lib/notifications";
import { toast } from "sonner";

export default function CertSettingsPage() {
  const { stampUrl, signatureUrl, uploadAsset, deleteAsset, isLoading } = useCertAssets();
  const { addNotification } = useNotifications();
  
  const [isUploading, setIsUploading] = useState<"stamp" | "signature" | null>(null);
  
  const stampInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (type: "stamp" | "signature", file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Please use an image smaller than 10MB.");
      return;
    }

    setIsUploading(type);
    try {
      await uploadAsset(type, file);
      toast.success(`${type === "stamp" ? "Stamp" : "Signature"} uploaded and saved successfully!`);
      
      addNotification({
        type: "info",
        title: "Asset Updated",
        message: `Official ${type} has been updated.`,
        targetRole: "certification_officer",
      });
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(`Failed to upload ${type}.`);
    } finally {
      setIsUploading(null);
      if (type === "stamp" && stampInputRef.current) stampInputRef.current.value = "";
      if (type === "signature" && sigInputRef.current) sigInputRef.current.value = "";
    }
  };

  const handleReset = async (type: "stamp" | "signature") => {
    try {
      await deleteAsset(type);
      toast.info(`${type === "stamp" ? "Stamp" : "Signature"} reset to default.`);
    } catch (err) {
      toast.error(`Failed to reset ${type}.`);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <Shield className="w-8 h-8 text-[#006400]" />
        <div>
          <h1 className="text-2xl font-black text-gray-900">Certification Settings</h1>
          <p className="text-sm text-gray-500">Manage the official stamp and signature used for approving invoices.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Stamp Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Image className="w-4 h-4 text-amber-600" />
            Official Stamp
          </h3>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            ref={stampInputRef}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload("stamp", e.target.files[0])}
          />
          <div className="mb-4 bg-gray-50 rounded-lg aspect-square flex items-center justify-center border-2 border-dashed border-gray-200 p-4 relative">
            {isUploading === "stamp" || isLoading ? (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            ) : stampUrl ? (
              <img src={stampUrl} alt="Stamp preview" className="max-w-full max-h-full object-contain drop-shadow-md mix-blend-multiply" />
            ) : (
              <p className="text-sm text-gray-400">No stamp uploaded</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => stampInputRef.current?.click()} disabled={isUploading === "stamp"}>
              <UploadCloud className="w-4 h-4 mr-2" /> Upload New Stamp
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleReset("stamp")} title="Reset to default">
              <Trash2 className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Signature Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Image className="w-4 h-4 text-amber-600" />
            Official Signature
          </h3>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            ref={sigInputRef}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload("signature", e.target.files[0])}
          />
          <div className="mb-4 bg-gray-50 rounded-lg aspect-square flex items-center justify-center border-2 border-dashed border-gray-200 p-4 relative">
            {isUploading === "signature" || isLoading ? (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            ) : signatureUrl ? (
              <img src={signatureUrl} alt="Signature preview" className="max-w-full max-h-full object-contain drop-shadow-sm mix-blend-multiply" />
            ) : (
              <p className="text-sm text-gray-400">No signature uploaded</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => sigInputRef.current?.click()} disabled={isUploading === "signature"}>
              <UploadCloud className="w-4 h-4 mr-2" /> Upload New Signature
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleReset("signature")} title="Reset to default">
              <Trash2 className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm text-amber-800 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>These assets will be applied automatically to all approved invoices when you click "Apply Stamp" or "Apply Signature" in the review screen. Images with transparent backgrounds (PNG) are highly recommended. Assets are saved automatically upon upload.</p>
      </div>

    </div>
  );
}
