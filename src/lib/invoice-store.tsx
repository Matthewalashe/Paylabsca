// ============================================================
// invoice-store.tsx — Supabase-backed invoice state
// ============================================================

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { InvoiceData } from "./types";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

/**
 * Get a working URL for a storage file.
 * Tries getPublicUrl first (works if bucket is public).
 * Falls back to createSignedUrl (works if bucket is private).
 */
async function getStorageUrl(bucket: string, path: string): Promise<string> {
  // Try public URL first (fastest, no expiry)
  const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(path);
  if (pubData?.publicUrl) {
    // Add cache-buster only once per session to avoid excessive re-fetching
    return pubData.publicUrl;
  }
  // Fallback: signed URL valid for 1 hour
  const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return signedData?.signedUrl || "";
}

interface InvoiceStoreContextType {
  invoices: InvoiceData[];
  isLoading: boolean;
  getInvoice: (id: string) => InvoiceData | undefined;
  addInvoice: (invoice: InvoiceData) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<InvoiceData>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  uploadPhoto: (invoiceId: string, file: File, position: 1 | 2 | 3 | 4, caption?: string) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
}

const InvoiceStoreContext = createContext<InvoiceStoreContextType>({
  invoices: [],
  isLoading: true,
  getInvoice: () => undefined,
  addInvoice: async () => {},
  updateInvoice: async () => {},
  deleteInvoice: async () => {},
  refresh: async () => {},
  uploadPhoto: async () => {},
  deletePhoto: async () => {},
});

/** Convert DB row to InvoiceData */
function dbToInvoice(row: any): InvoiceData {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    referenceNumber: row.reference_number || "",
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    clientName: row.client_name || "",
    clientAddress: row.client_address || "",
    clientPhone: row.client_phone || "",
    clientEmail: row.client_email || "",
    propertyAddress: row.property_address || "",
    propertyLGA: row.property_lga || "Ikeja",
    buildingUse: row.building_use || "Commercial",
    coordinates: row.coordinates || { latitude: 0, longitude: 0 },
    photos: [], // loaded separately from invoice_photos table
    certificateType: row.certificate_type || "completion_fitness",
    certificateTitle: row.certificate_title || "",
    revenueCode: row.revenue_code || "",
    agencyCode: row.agency_code || "",
    lineItems: row.line_items || [],
    subtotal: Number(row.subtotal) || 0,
    totalAmount: Number(row.total_amount) || 0,
    createdBy: row.created_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    sentAt: row.sent_at,
    paidAt: row.paid_at,
    notes: row.notes,
    rejectionNote: row.rejection_note,
    paystackReference: row.payment_reference,
    paymentLink: row.payment_link,
    createdByName: row.creator?.name || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Convert InvoiceData to DB row */
function invoiceToDb(inv: InvoiceData) {
  return {
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    reference_number: inv.referenceNumber,
    status: inv.status,
    issue_date: inv.issueDate,
    due_date: inv.dueDate,
    client_name: inv.clientName,
    client_address: inv.clientAddress,
    client_phone: inv.clientPhone,
    client_email: inv.clientEmail,
    property_address: inv.propertyAddress,
    property_lga: inv.propertyLGA,
    building_use: inv.buildingUse,
    coordinates: inv.coordinates,
    certificate_type: inv.certificateType,
    certificate_title: inv.certificateTitle,
    revenue_code: inv.revenueCode,
    agency_code: inv.agencyCode,
    line_items: inv.lineItems,
    subtotal: inv.subtotal,
    total_amount: inv.totalAmount,
    created_by: inv.createdBy || undefined,
    approved_by: inv.approvedBy || undefined,
    approved_at: inv.approvedAt || undefined,
    sent_at: inv.sentAt || undefined,
    paid_at: inv.paidAt || undefined,
    notes: inv.notes,
    rejection_note: inv.rejectionNote,
    payment_reference: inv.paystackReference,
    payment_link: inv.paymentLink,
  };
}

export function InvoiceStoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch invoices — billing officers see only their own, cert officers see all
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);

    let query = supabase
      .from("invoices")
      .select(`
        *,
        invoice_photos (
          id, storage_path, position, caption
        ),
        creator:profiles!invoices_created_by_fkey (
          name
        )
      `)
      .order("created_at", { ascending: false });

    // Dashboard isolation: billing officers only see their own invoices
    if (user?.role === "billing_officer" && user?.id) {
      query = query.eq("created_by", user.id);
    }

    // Certification officers should never see draft invoices
    if (user?.role === "certification_officer") {
      query = query.neq("status", "draft");
    }

    const { data, error } = await query;

    if (!error && data) {
      const mappedInvoices = await Promise.all(data.map(async (row: any) => {
        const inv = dbToInvoice(row);
        const photoRows = row.invoice_photos || [];
        photoRows.sort((a: any, b: any) => a.position - b.position);
        inv.photos = await Promise.all(
          photoRows.map(async (p: any) => {
            const url = await getStorageUrl("invoice-photos", p.storage_path);
            return {
              id: p.id,
              url,
              position: p.position as any,
              caption: p.caption || ""
            };
          })
        );
        return inv;
      }));
      setInvoices(mappedInvoices);
    }
    setIsLoading(false);
  }, [user?.id, user?.role]);

  // Load invoices when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices();
    } else {
      setInvoices([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchInvoices]);

  // Realtime subscription
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel("invoices-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => { fetchInvoices(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, fetchInvoices]);

  const getInvoice = useCallback(
    (id: string) => invoices.find(inv => inv.id === id),
    [invoices]
  );

  const addInvoice = useCallback(async (invoice: InvoiceData) => {
    const row = invoiceToDb(invoice);
    const { error } = await supabase.from("invoices").insert(row);
    if (error) {
      console.error("Failed to add invoice:", error);
      throw error;
    }
    // Optimistic update
    setInvoices(prev => [invoice, ...prev]);
  }, []);

  const updateInvoice = useCallback(async (id: string, updates: Partial<InvoiceData>) => {
    // Convert updates to DB format
    const dbUpdates: Record<string, any> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
    if (updates.clientAddress !== undefined) dbUpdates.client_address = updates.clientAddress;
    if (updates.clientPhone !== undefined) dbUpdates.client_phone = updates.clientPhone;
    if (updates.clientEmail !== undefined) dbUpdates.client_email = updates.clientEmail;
    if (updates.propertyAddress !== undefined) dbUpdates.property_address = updates.propertyAddress;
    if (updates.propertyLGA !== undefined) dbUpdates.property_lga = updates.propertyLGA;
    if (updates.buildingUse !== undefined) dbUpdates.building_use = updates.buildingUse;
    if (updates.coordinates !== undefined) dbUpdates.coordinates = updates.coordinates;
    if (updates.certificateType !== undefined) dbUpdates.certificate_type = updates.certificateType;
    if (updates.certificateTitle !== undefined) dbUpdates.certificate_title = updates.certificateTitle;
    if (updates.revenueCode !== undefined) dbUpdates.revenue_code = updates.revenueCode;
    if (updates.agencyCode !== undefined) dbUpdates.agency_code = updates.agencyCode;
    if (updates.lineItems !== undefined) dbUpdates.line_items = updates.lineItems;
    if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
    if (updates.approvedBy !== undefined) dbUpdates.approved_by = updates.approvedBy;
    if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt;
    if (updates.sentAt !== undefined) dbUpdates.sent_at = updates.sentAt;
    if (updates.paidAt !== undefined) dbUpdates.paid_at = updates.paidAt;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.rejectionNote !== undefined) dbUpdates.rejection_note = updates.rejectionNote;
    if (updates.referenceNumber !== undefined) dbUpdates.reference_number = updates.referenceNumber;
    if (updates.invoiceNumber !== undefined) dbUpdates.invoice_number = updates.invoiceNumber;
    if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.paystackReference !== undefined) dbUpdates.payment_reference = updates.paystackReference;
    if (updates.paymentLink !== undefined) dbUpdates.payment_link = updates.paymentLink;

    const { error } = await supabase.from("invoices").update(dbUpdates).eq("id", id);
    if (error) {
      console.error("Failed to update invoice:", error);
      throw error;
    }
    // Optimistic update
    setInvoices(prev =>
      prev.map(inv => inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv)
    );
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete invoice:", error);
      throw error;
    }
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  }, []);

  const uploadPhoto = useCallback(async (invoiceId: string, file: File, position: 1 | 2 | 3 | 4, caption?: string) => {
    const filePath = `${invoiceId}/photo-${position}-${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from("invoice-photos").upload(filePath, file);
    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase.from("invoice_photos").insert({
      invoice_id: invoiceId,
      storage_path: filePath,
      position,
      caption
    });
    if (dbError) throw dbError;
    
    // Refresh to get the new photo injected
    await fetchInvoices();
  }, [fetchInvoices]);

  const deletePhoto = useCallback(async (photoId: string) => {
    // We should first get the path, then delete from storage.
    const { data } = await supabase.from("invoice_photos").select("storage_path").eq("id", photoId).single();
    if (data) {
      await supabase.storage.from("invoice-photos").remove([data.storage_path]);
    }
    await supabase.from("invoice_photos").delete().eq("id", photoId);
    
    await fetchInvoices();
  }, [fetchInvoices]);

  return (
    <InvoiceStoreContext.Provider value={{
      invoices, isLoading, getInvoice,
      addInvoice, updateInvoice, deleteInvoice,
      refresh: fetchInvoices,
      uploadPhoto, deletePhoto
    }}>
      {children}
    </InvoiceStoreContext.Provider>
  );
}

export function useInvoiceStore() {
  return useContext(InvoiceStoreContext);
}
