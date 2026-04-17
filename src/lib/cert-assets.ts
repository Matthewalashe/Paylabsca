import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export interface CertAssets {
  stampUrl: string | null;
  signatureUrl: string | null;
  qrBaseUrl: string | null;
}

const DEFAULT_STAMP = "/stamp.png";
const DEFAULT_SIGNATURE = "/signature.png";

export function useCertAssets() {
  const { user, isAuthenticated } = useAuth();
  const [assets, setAssets] = useState<CertAssets>({
    stampUrl: DEFAULT_STAMP,
    signatureUrl: DEFAULT_SIGNATURE,
    qrBaseUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load from Supabase
  useEffect(() => {
    async function loadAssets() {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("cert_assets")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          const newAssets = { ...assets };
          
          for (const row of data) {
            // Get public URL or signed URL
            const { data: urlData } = supabase.storage
              .from("cert-assets")
              .getPublicUrl(row.storage_path);
              
            if (row.asset_type === "stamp") {
              // Add a cache buster
              newAssets.stampUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
            } else if (row.asset_type === "signature") {
              newAssets.signatureUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
            }
          }
          setAssets(newAssets);
        }
      } catch (err) {
        console.error("Failed to load cert assets from Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const uploadAsset = async (type: "stamp" | "signature", file: File) => {
    if (!user) throw new Error("Must be logged in to upload assets");

    const filePath = `${user.id}/${type}-${Date.now()}`;
    
    // 1. Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("cert-assets")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 2. Check if row exists in table, delete old ones
    await supabase.from("cert_assets").delete().eq("user_id", user.id).eq("asset_type", type);
    
    // 3. Insert new row
    const { error: insertError } = await supabase.from("cert_assets").insert({
      user_id: user.id,
      asset_type: type,
      storage_path: filePath,
    });

    if (insertError) throw insertError;

    // 4. Get URL and update state
    const { data: urlData } = supabase.storage.from("cert-assets").getPublicUrl(filePath);
    
    setAssets(prev => ({
      ...prev,
      [type === "stamp" ? "stampUrl" : "signatureUrl"]: `${urlData.publicUrl}?t=${new Date().getTime()}`
    }));

    return urlData.publicUrl;
  };

  const deleteAsset = async (type: "stamp" | "signature") => {
    if (!user) return;
    
    const { data } = await supabase.from("cert_assets").select("storage_path").eq("user_id", user.id).eq("asset_type", type);
    
    if (data && data.length > 0) {
      // Remove from storage
      await supabase.storage.from("cert-assets").remove(data.map(d => d.storage_path));
      // Remove from DB
      await supabase.from("cert_assets").delete().eq("user_id", user.id).eq("asset_type", type);
    }
    
    setAssets(prev => ({
      ...prev,
      [type === "stamp" ? "stampUrl" : "signatureUrl"]: type === "stamp" ? DEFAULT_STAMP : DEFAULT_SIGNATURE
    }));
  };

  return {
    ...assets,
    isLoading,
    uploadAsset,
    deleteAsset,
  };
}

