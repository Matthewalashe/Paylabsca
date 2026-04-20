// ============================================================
// InvoiceEditorPage.tsx — Side-by-side form + live preview
// ============================================================
// Supports both NEW and EDIT modes via URL params
// Left: Scrollable form with all invoice fields + file upload
// Right: Live invoice template preview that updates in real-time
// ============================================================
// FIXED: async/await on save/submit, mobile responsive overhaul
// ============================================================

import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatNaira, generateReferenceNumber, createBlankInvoice, LOCAL_GOVERNMENTS } from "@/lib/types";
import { useInvoiceStore } from "@/lib/invoice-store";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import { validateInvoice, type ValidationErrors } from "@/lib/form-validation";
import type { InvoiceData, InvoiceLineItem, LagosLGA, BuildingUseType, CertificateType } from "@/lib/types";
import { toast } from "sonner";
import {
  Save, Send, Eye, EyeOff, Plus, Trash2, MapPin, Camera,
  Building2, FileText, ArrowLeft, UploadCloud, AlertCircle, Loader2, CheckCircle2, Map
} from "lucide-react";
import { geocodeAddress } from "@/lib/geocode";
import { lazy, Suspense } from "react";
const MapPicker = lazy(() => import("@/components/ui/MapPicker"));

const BUILDING_TYPES: BuildingUseType[] = ["Residential", "Commercial", "Industrial", "Mixed-Use", "Institutional"];

const CERT_TYPES: { value: CertificateType; label: string }[] = [
  { value: "completion_fitness", label: "Certificate for Completion & Fitness for Habitation" },
  { value: "building_plan", label: "Building Plan Approval" },
  { value: "penalty", label: "Penalty / Unsealing Fees" },
  { value: "registration", label: "Registration Fees" },
  { value: "renewal", label: "Annual Renewal Fees" },
];

const CERT_TITLES: Record<CertificateType, string> = {
  completion_fitness: "CERTIFICATE FOR COMPLETION AND FITNESS FOR HABITATION",
  building_plan: "BUILDING PLAN APPROVAL AND CERTIFICATION",
  penalty: "PENALTY AND UNSEALING FEES ASSESSMENT",
  registration: "REGISTRATION FEE ASSESSMENT",
  renewal: "ANNUAL RENEWAL FEE ASSESSMENT",
};

const FieldGroup = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`space-y-1.5 ${className}`}>
    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</Label>
    {children}
  </div>
);

const ErrorMsg = ({ error }: { error?: string }) => {
  if (!error) return null;
  return <p className="text-[11px] font-semibold text-red-500 mt-1">{error}</p>;
};

export default function InvoiceEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addInvoice, updateInvoice, getInvoice, uploadPhoto } = useInvoiceStore();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Determine if editing existing invoice
  const isEditMode = !!id;
  const existingInvoice = isEditMode ? getInvoice(id) : undefined;
  
  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    if (existingInvoice) return { ...existingInvoice };
    return createBlankInvoice();
  });

  // Default showPreview to false on mobile (preview panel is hidden anyway)
  const [showPreview, setShowPreview] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth >= 1024;
    return true;
  });
  const [photoUrls, setPhotoUrls] = useState<string[]>(() => {
    if (existingInvoice) {
      const urls = ["", "", "", ""];
      existingInvoice.photos.forEach(p => {
        if (p.position >= 1 && p.position <= 4) urls[p.position - 1] = p.url;
      });
      return urls;
    }
    return ["", "", "", ""];
  });
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<"idle" | "found" | "not_found">("idle");
  // Track actual File objects for upload to Supabase storage
  const [pendingFiles, setPendingFiles] = useState<(File | null)[]>([null, null, null, null]);
  
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Update invoice field
  const updateField = useCallback(<K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle certificate type change
  const handleCertTypeChange = (type: CertificateType) => {
    const revCodeMap: Record<CertificateType, string> = {
      completion_fitness: "4020167",
      building_plan: "4020004",
      penalty: "4060021",
      registration: "4020047",
      renewal: "4020083",
    };
    setInvoice(prev => ({
      ...prev,
      certificateType: type,
      certificateTitle: CERT_TITLES[type],
      revenueCode: revCodeMap[type],
    }));
  };

  // Handle client name change
  const handleClientNameChange = (name: string) => {
    setInvoice(prev => ({
      ...prev,
      clientName: name,
    }));
  };

  // Auto-geocode property address on blur
  const handlePropertyAddressBlur = async () => {
    const address = invoice.propertyAddress;
    if (!address || address.trim().length < 5) return;
    // Don't re-geocode if coordinates already set manually
    if (invoice.coordinates.latitude !== 0 && invoice.coordinates.longitude !== 0 && geocodeStatus === "found") return;

    setIsGeocoding(true);
    setGeocodeStatus("idle");
    try {
      const result = await geocodeAddress(address);
      if (result) {
        updateField("coordinates", {
          latitude: result.latitude,
          longitude: result.longitude,
        });
        setGeocodeStatus("found");
      } else {
        setGeocodeStatus("not_found");
      }
    } catch {
      setGeocodeStatus("not_found");
    } finally {
      setIsGeocoding(false);
    }
  };

  // Line items
  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: crypto.randomUUID(),
      address: invoice.propertyAddress || "",
      floor: 1,
      price: 0,
      total: 0,
    };
    updateLineItems([...invoice.lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
    const newItems = invoice.lineItems.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === "floor" || field === "price") {
        updated.total = Number(updated.floor) * Number(updated.price);
      }
      return updated;
    });
    updateLineItems(newItems);
  };

  const removeLineItem = (id: string) => {
    updateLineItems(invoice.lineItems.filter(item => item.id !== id));
  };

  const updateLineItems = (items: InvoiceLineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    setInvoice(prev => ({
      ...prev,
      lineItems: items,
      subtotal,
      totalAmount: subtotal,
    }));
  };

  // ============================================================
  // Photo validation constants
  // ============================================================
  const MAX_PHOTO_SIZE_MB = 5;
  const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
  const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_PHOTO_DIMENSION = 4096; // pixels

  /**
   * Validate image dimensions by loading it into an Image element.
   * Returns { valid, width, height } or { valid: false } if too large.
   */
  const validateImageDimensions = (file: File): Promise<{ valid: boolean; width?: number; height?: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width > MAX_PHOTO_DIMENSION || img.height > MAX_PHOTO_DIMENSION) {
          resolve({ valid: false, width: img.width, height: img.height });
        } else {
          resolve({ valid: true, width: img.width, height: img.height });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve({ valid: false });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Real File Upload Handler — with validation
  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;
    
    // 1. Validate file type
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      toast.error(`Photo ${index + 1}: Invalid format. Accepted: JPG, PNG, WebP.`);
      return;
    }

    // 2. Validate file size
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(`Photo ${index + 1}: File too large (${sizeMB}MB). Maximum is ${MAX_PHOTO_SIZE_MB}MB.`);
      return;
    }

    // 3. Validate dimensions
    const dimResult = await validateImageDimensions(file);
    if (!dimResult.valid) {
      toast.error(
        `Photo ${index + 1}: Image too large (${dimResult.width || "?"}×${dimResult.height || "?"}px). Maximum is ${MAX_PHOTO_DIMENSION}×${MAX_PHOTO_DIMENSION}px.`
      );
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const newUrls = [...photoUrls];
    newUrls[index] = objectUrl;
    setPhotoUrls(newUrls);

    // Store the actual file for later upload to Supabase
    const newPending = [...pendingFiles];
    newPending[index] = file;
    setPendingFiles(newPending);

    const photos = newUrls
      .map((u, i) => u ? { id: `photo-${i}`, url: u, position: (i + 1) as 1 | 2 | 3 | 4 } : null)
      .filter(Boolean) as InvoiceData["photos"];
    
    updateField("photos", photos);
    toast.success(`Photo ${index + 1} ready (${dimResult.width}×${dimResult.height}px, ${(file.size / 1024).toFixed(0)}KB)`);
  };

  const handlePhotoRemove = (index: number) => {
    const newUrls = [...photoUrls];
    newUrls[index] = "";
    setPhotoUrls(newUrls);

    // Clear the pending file
    const newPending = [...pendingFiles];
    newPending[index] = null;
    setPendingFiles(newPending);

    const photos = newUrls
      .map((u, i) => u ? { id: `photo-${i}`, url: u, position: (i + 1) as 1 | 2 | 3 | 4 } : null)
      .filter(Boolean) as InvoiceData["photos"];
    
    updateField("photos", photos);
  };

  // Helper: upload pending photo files to Supabase storage
  const uploadPendingPhotos = async (invoiceId: string) => {
    const failedPhotos: number[] = [];
    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      if (file) {
        try {
          await uploadPhoto(invoiceId, file, (i + 1) as 1 | 2 | 3 | 4);
        } catch (err: any) {
          console.error(`Failed to upload photo ${i + 1}:`, err);
          failedPhotos.push(i + 1);
        }
      }
    }
    if (failedPhotos.length > 0) {
      toast.error(`Failed to upload photo(s) ${failedPhotos.join(", ")}. Please re-edit and re-upload them.`);
    }
  };

  // ============================================================
  // SAVE DRAFT — with proper async/await and error handling
  // ============================================================
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const code = invoice.clientName.split(/\s+/).slice(0, 3).map(w => w[0] || "").join("").toUpperCase();
      const referenceNumber = code ? generateReferenceNumber(code) : invoice.referenceNumber;
      // Strip local blob: photo URLs before saving to DB — real URLs come from Supabase storage
      const draft = { ...invoice, photos: [], referenceNumber, status: "draft" as const, createdBy: user?.id, updatedAt: new Date().toISOString() };
      
      if (isEditMode) {
        await updateInvoice(invoice.id, draft);
      } else {
        await addInvoice(draft);
      }

      // Upload photo files to Supabase storage
      await uploadPendingPhotos(invoice.id);

      toast.success(isEditMode ? "Invoice updated and saved as draft." : "Invoice saved as draft.");
      navigate("/billing");
    } catch (err: any) {
      console.error("Failed to save draft:", err);
      toast.error(err?.message || "Failed to save invoice. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // SUBMIT FOR APPROVAL — with proper async/await and error handling
  // ============================================================
  const handleSubmitForApproval = async () => {
    setIsSaving(true);
    try {
      const defaultCode = invoice.clientName.split(/\s+/).slice(0, 3).map(w => w[0] || "").join("").toUpperCase();
      const referenceNumber = defaultCode ? generateReferenceNumber(defaultCode) : invoice.referenceNumber;
      // Strip local blob: photo URLs before saving to DB — real URLs come from Supabase storage
      const pendingInvoice = { ...invoice, photos: [], referenceNumber, status: "pending_approval" as const, createdBy: user?.id, updatedAt: new Date().toISOString() };
      
      if (isEditMode) {
        await updateInvoice(invoice.id, pendingInvoice);
      } else {
        await addInvoice(pendingInvoice);
      }

      // Upload photo files to Supabase storage
      await uploadPendingPhotos(invoice.id);
      
      addNotification({
        type: "submission",
        title: "New Invoice Submitted",
        message: `Invoice ${pendingInvoice.invoiceNumber} submitted for ${pendingInvoice.clientName}.`,
        invoiceId: pendingInvoice.id,
        invoiceNumber: pendingInvoice.invoiceNumber,
        fromUser: user?.name,
        fromRole: "Billing Officer",
        targetRole: "certification_officer",
      });

      toast.success("Invoice submitted for certification!");
      navigate("/billing");
    } catch (err: any) {
      console.error("Failed to submit invoice:", err);
      toast.error(err?.message || "Failed to submit invoice. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden">
      {/* ===== TOP BAR ===== */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={() => navigate("/billing")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate">{isEditMode ? "Edit Invoice" : "New Invoice"}</h1>
            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden lg:flex"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSaveConfirm(true)} disabled={isSaving}>
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save Draft</span>
          </Button>
          <Button variant="gold" size="sm" onClick={() => {
            const validationErrors = validateInvoice(invoice, photoUrls);
            if (Object.keys(validationErrors).length > 0) {
              setErrors(validationErrors);
              toast.error("Please fix validation errors before submitting.");
              return;
            }
            setErrors({});
            setShowSubmitConfirm(true);
          }} disabled={isSaving}>
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Submit for Certification</span>
            <span className="sm:hidden">Submit</span>
          </Button>
        </div>
      </div>

      {/* ===== MAIN SPLIT VIEW ===== */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT: FORM — Full width on mobile, split on desktop */}
        <div className={`${showPreview ? "w-full lg:w-[45%]" : "w-full max-w-3xl mx-auto"} overflow-y-auto border-r border-gray-200 bg-gray-50`}>
          <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
            
            {/* Rejection Note Warning */}
            {invoice.status === "rejected" && invoice.rejectionNote && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-red-900 text-sm">Certification Revision Required</h3>
                  <p className="text-sm text-red-700 mt-1">{invoice.rejectionNote}</p>
                </div>
              </div>
            )}

            {/* --- Section: Client Details --- */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-[#006400]" />
                <h3 className="font-bold text-gray-900 text-sm">Client Details</h3>
              </div>
              <div className="space-y-4">
                <FieldGroup label="Client / Company Name">
                  <Input
                    placeholder="e.g. United Bank For Africa (UBA) Plc"
                    value={invoice.clientName}
                    onChange={(e) => handleClientNameChange(e.target.value)}
                    className={errors.clientName ? "border-red-500" : ""}
                  />
                  <ErrorMsg error={errors.clientName} />
                </FieldGroup>
                <FieldGroup label="Client Address">
                  <Input
                    placeholder="e.g. 1, Simbiat Abiola Way, Ikeja"
                    value={invoice.clientAddress}
                    onChange={(e) => updateField("clientAddress", e.target.value)}
                    className={errors.clientAddress ? "border-red-500" : ""}
                  />
                  <ErrorMsg error={errors.clientAddress} />
                </FieldGroup>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup label="Phone">
                    <Input
                      type="tel"
                      placeholder="+234..."
                      value={invoice.clientPhone || ""}
                      onChange={(e) => updateField("clientPhone", e.target.value)}
                      className={errors.clientPhone ? "border-red-500" : ""}
                    />
                    <ErrorMsg error={errors.clientPhone} />
                  </FieldGroup>
                  <FieldGroup label="Email">
                    <Input
                      type="email"
                      placeholder="client@email.com"
                      value={invoice.clientEmail || ""}
                      onChange={(e) => updateField("clientEmail", e.target.value)}
                      className={errors.clientEmail ? "border-red-500" : ""}
                    />
                    <ErrorMsg error={errors.clientEmail} />
                  </FieldGroup>
                </div>
              </div>
            </div>

            {/* --- Section: Property Details --- */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-[#006400]" />
                <h3 className="font-bold text-gray-900 text-sm">Property Details</h3>
              </div>
              <div className="space-y-4">
                <FieldGroup label="Property Address">
                  <Input
                    placeholder="e.g. 1, Simbiat Abiola Way, Ikeja"
                    value={invoice.propertyAddress}
                    onChange={(e) => { updateField("propertyAddress", e.target.value); setGeocodeStatus("idle"); }}
                    onBlur={handlePropertyAddressBlur}
                    className={errors.propertyAddress ? "border-red-500" : ""}
                  />
                  <ErrorMsg error={errors.propertyAddress} />
                </FieldGroup>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup label="Local Government Area">
                    <Select
                      value={invoice.propertyLGA}
                      onChange={(e) => updateField("propertyLGA", e.target.value as LagosLGA)}
                    >
                      {LOCAL_GOVERNMENTS.map(lga => (
                        <option key={lga} value={lga}>{lga}</option>
                      ))}
                    </Select>
                    <ErrorMsg error={errors.propertyLGA} />
                  </FieldGroup>
                  <FieldGroup label="Building Use">
                    <Select
                      value={invoice.buildingUse}
                      onChange={(e) => updateField("buildingUse", e.target.value as BuildingUseType)}
                    >
                      {BUILDING_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup label="Longitude">
                    <Input
                      type="number"
                      step="any"
                      placeholder="3.3387..."
                      value={invoice.coordinates.longitude === 0 ? "" : invoice.coordinates.longitude}
                      onChange={(e) => { updateField("coordinates", { ...invoice.coordinates, longitude: parseFloat(e.target.value) || 0 }); setGeocodeStatus("idle"); }}
                    />
                  </FieldGroup>
                  <FieldGroup label="Latitude">
                    <Input
                      type="number"
                      step="any"
                      placeholder="6.5958..."
                      value={invoice.coordinates.latitude === 0 ? "" : invoice.coordinates.latitude}
                      onChange={(e) => { updateField("coordinates", { ...invoice.coordinates, latitude: parseFloat(e.target.value) || 0 }); setGeocodeStatus("idle"); }}
                    />
                  </FieldGroup>
                </div>
                {/* Geocode status feedback */}
                {isGeocoding && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="font-medium">Detecting coordinates from address...</span>
                  </div>
                )}
                {!isGeocoding && geocodeStatus === "found" && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="font-medium">📍 Coordinates auto-detected from address</span>
                  </div>
                )}
                {!isGeocoding && geocodeStatus === "not_found" && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium block">Could not detect coordinates automatically</span>
                      <span className="text-[10px] text-amber-600 mt-0.5 block">
                        Tip: Include area name, e.g. "25 Broad Street, Ikeja, Lagos" — or enter coordinates manually below.
                      </span>
                    </div>
                  </div>
                )}

                {/* Map Picker Toggle */}
                <button
                  type="button"
                  onClick={() => updateField("_showMap" as any, !(invoice as any)._showMap)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#006400] hover:text-[#005000] bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition-colors w-full justify-center"
                >
                  <Map className="w-3.5 h-3.5" /> {(invoice as any)._showMap ? "Hide Map" : "📍 Pick on Map / Verify Coordinates"}
                </button>
              </div>

              {/* Map Picker (lazy loaded) */}
              {(invoice as any)._showMap && (
                <Suspense fallback={
                  <div className="h-[200px] bg-gray-100 rounded-xl flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                }>
                  <MapPicker
                    latitude={invoice.coordinates.latitude}
                    longitude={invoice.coordinates.longitude}
                    onSelect={(lat, lng) => {
                      updateField("coordinates", { latitude: lat, longitude: lng });
                      setGeocodeStatus("found");
                      toast.success(`Coordinates set: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                    }}
                    onClose={() => updateField("_showMap" as any, false)}
                  />
                </Suspense>
              )}
            </div>

            {/* --- Section: Property Photos --- */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-4 h-4 text-[#006400]" />
                <h3 className="font-bold text-gray-900 text-sm">Property Photos (4 required)</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-xs text-gray-500 font-medium">Photo {i + 1}</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      ref={fileInputRefs[i]}
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(i, e.target.files[0])}
                    />
                    {photoUrls[i] ? (
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={photoUrls[i]} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handlePhotoRemove(i)}
                          className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRefs[i].current?.click()}
                        className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 hover:border-[#006400] hover:bg-green-50 flex flex-col items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-colors bg-gray-50"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                          <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-gray-500">Upload</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <ErrorMsg error={errors.photos} />
              <p className="text-[10px] text-gray-400 mt-3 text-center">
                Accepted: JPG, PNG, WebP — Max 5MB per photo — Max 4096×4096px
              </p>
            </div>

            {/* --- Section: Certificate & Codes --- */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-[#006400]" />
                <h3 className="font-bold text-gray-900 text-sm">Certificate & Revenue Codes</h3>
              </div>
              <div className="space-y-4">
                <FieldGroup label="Certificate Type">
                  <Select
                    value={invoice.certificateType}
                    onChange={(e) => handleCertTypeChange(e.target.value as CertificateType)}
                  >
                    {CERT_TYPES.map(ct => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </Select>
                </FieldGroup>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup label="Revenue Code">
                    <Input value={invoice.revenueCode} readOnly className="bg-gray-50 font-mono font-bold" />
                  </FieldGroup>
                  <FieldGroup label="Agency Code">
                    <Input value={invoice.agencyCode} readOnly className="bg-gray-50 font-mono font-bold" />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup label="Issue Date">
                    <Input
                      type="date"
                      value={invoice.issueDate}
                      onChange={(e) => updateField("issueDate", e.target.value)}
                    />
                  </FieldGroup>
                  <FieldGroup label="Due Date">
                    <Input
                      type="date"
                      value={invoice.dueDate}
                      onChange={(e) => updateField("dueDate", e.target.value)}
                    />
                  </FieldGroup>
                </div>
              </div>
            </div>

            {/* --- Section: Line Items --- */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#006400]" />
                  <h3 className="font-bold text-gray-900 text-sm">Line Items</h3>
                </div>
                <Button variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="w-3 h-3" /> Add Item
                </Button>
              </div>

              {invoice.lineItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No line items yet</p>
                  <p className="text-xs mt-1">Click "Add Item" to start building the invoice</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoice.lineItems.map((item, idx) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 relative group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500">Item #{idx + 1}</span>
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Address/Description"
                          className="h-9 text-sm"
                          value={item.address}
                          onChange={(e) => updateLineItem(item.id, "address", e.target.value)}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Floors</label>
                            <Input
                              type="number"
                              min={1}
                              className="h-9 text-sm"
                              value={item.floor || ""}
                              onChange={(e) => updateLineItem(item.id, "floor", parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Price (₦)</label>
                            <Input
                              type="number"
                              className="h-9 text-sm"
                              value={item.price === 0 ? "" : item.price}
                              onChange={(e) => updateLineItem(item.id, "price", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Total (₦)</label>
                            <Input
                              readOnly
                              className="h-9 text-sm bg-green-50 font-bold text-[#006400] border-green-200 truncate"
                              value={`₦${formatNaira(item.total)}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Totals summary */}
                  <div className="bg-[#003200] rounded-lg p-4 mt-6 text-white">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-green-100">Total Due for Certification</span>
                      <span className="text-lg sm:text-xl lg:text-2xl font-black text-[#D4AF37] truncate ml-4">₦{formatNaira(invoice.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
              <ErrorMsg error={errors.lineItems} />
            </div>

            {/* --- Section: Notes --- */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm mb-6">
              <FieldGroup label="Additional Notes (Internal)">
                <Textarea
                  placeholder="Add any internal notes or details..."
                  value={invoice.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </FieldGroup>
            </div>

            {/* ===== MOBILE BOTTOM ACTION BAR ===== */}
            <div className="sm:hidden sticky bottom-0 bg-white border-t border-gray-200 -mx-4 px-4 py-3 flex gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowSaveConfirm(true)}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </Button>
              <Button
                variant="gold"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const validationErrors = validateInvoice(invoice, photoUrls);
                  if (Object.keys(validationErrors).length > 0) {
                    setErrors(validationErrors);
                    toast.error("Please fix validation errors.");
                    return;
                  }
                  setErrors({});
                  setShowSubmitConfirm(true);
                }}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit
              </Button>
            </div>

          </div>
        </div>

        {/* RIGHT: LIVE PREVIEW */}
        {showPreview && (
          <div className="hidden lg:block flex-1 overflow-y-auto bg-gray-100/50 p-6 min-h-0">
            <div className="sticky top-0 z-10 flex items-center justify-center mb-6">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-4 py-1.5 shadow-sm border border-gray-200">
                <Eye className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600 tracking-wide uppercase">Live PDF Preview</span>
              </div>
            </div>
            <div className="flex justify-center pb-20 w-full">
              <div className="shadow-2xl transform scale-[0.55] xl:scale-[0.65] 2xl:scale-[0.75] origin-top bg-white border border-gray-200 select-none">
                <InvoiceTemplate
                  invoice={invoice}
                  showStamp={false}
                  showSignature={false}
                  showQRCode={false}
                  showPayButton={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== CONFIRM MODALS ===== */}
      <ConfirmModal
        open={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={() => { setShowSaveConfirm(false); handleSaveDraft(); }}
        title="Save as Draft?"
        message="This invoice will be saved as a draft. You can continue editing it later from your dashboard."
        confirmText="Save Draft"
        variant="default"
        loading={isSaving}
      />

      <ConfirmModal
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => { setShowSubmitConfirm(false); handleSubmitForApproval(); }}
        title="Submit for Certification?"
        message={`This invoice (${invoice.invoiceNumber}) for ₦${formatNaira(invoice.totalAmount)} will be sent to the Certification Officer for review. You won't be able to edit it until it's approved or returned.`}
        confirmText="Submit Invoice"
        variant="warning"
        loading={isSaving}
      />
    </div>
  );
}
