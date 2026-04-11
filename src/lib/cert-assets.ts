import { useState, useEffect } from "react";

export interface CertAssets {
  stampUrl: string | null;
  signatureUrl: string | null;
  qrBaseUrl: string | null;
}

const DEFAULT_STAMP = "/stamp.png";
const DEFAULT_SIGNATURE = "/signature.png";

// Compress image to reduce localStorage size — max 200KB base64
function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        
        // Scale down if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context unavailable")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export as compressed JPEG/PNG
        const isPNG = file.type === "image/png";
        const dataUrl = canvas.toDataURL(isPNG ? "image/png" : "image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Load from local storage or failover to defaults
export function useCertAssets() {
  const [assets, setAssets] = useState<CertAssets>({
    stampUrl: DEFAULT_STAMP,
    signatureUrl: DEFAULT_SIGNATURE,
    qrBaseUrl: null,
  });

  useEffect(() => {
    const stored = localStorage.getItem("lasbca_cert_assets");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAssets({
          stampUrl: parsed.stampUrl || DEFAULT_STAMP,
          signatureUrl: parsed.signatureUrl || DEFAULT_SIGNATURE,
          qrBaseUrl: parsed.qrBaseUrl || null,
        });
      } catch (e) {
        console.error("Failed to parse cert assets", e);
      }
    }
  }, []);

  const updateAsset = (key: keyof CertAssets, value: string | null) => {
    setAssets(prev => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem("lasbca_cert_assets", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save cert assets (quota exceeded?)", e);
      }
      return next;
    });
  };

  return {
    ...assets,
    updateAsset,
    compressImage,
  };
}
