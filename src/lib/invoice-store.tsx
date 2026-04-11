// ============================================================
// invoice-store.tsx — Shared invoice state (replaces Supabase)
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { InvoiceData } from "./types";
import { SAMPLE_INVOICES } from "./sample-data";

interface InvoiceStoreContextType {
  invoices: InvoiceData[];
  getInvoice: (id: string) => InvoiceData | undefined;
  addInvoice: (invoice: InvoiceData) => void;
  updateInvoice: (id: string, updates: Partial<InvoiceData>) => void;
  deleteInvoice: (id: string) => void;
}

const InvoiceStoreContext = createContext<InvoiceStoreContextType>({
  invoices: [],
  getInvoice: () => undefined,
  addInvoice: () => {},
  updateInvoice: () => {},
  deleteInvoice: () => {},
});

export function InvoiceStoreProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<InvoiceData[]>(() => {
    try {
      const saved = localStorage.getItem("lasbca_invoices");
      return saved ? JSON.parse(saved) : SAMPLE_INVOICES;
    } catch {
      return SAMPLE_INVOICES;
    }
  });

  const getInvoice = useCallback((id: string) => invoices.find(inv => inv.id === id), [invoices]);

  const addInvoice = useCallback((invoice: InvoiceData) => {
    setInvoices(prev => {
      const updated = [invoice, ...prev];
      localStorage.setItem("lasbca_invoices", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateInvoice = useCallback((id: string, updates: Partial<InvoiceData>) => {
    setInvoices(prev => {
      const updated = prev.map(inv =>
        inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv
      );
      localStorage.setItem("lasbca_invoices", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices(prev => {
      const updated = prev.filter(inv => inv.id !== id);
      localStorage.setItem("lasbca_invoices", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <InvoiceStoreContext.Provider value={{ invoices, getInvoice, addInvoice, updateInvoice, deleteInvoice }}>
      {children}
    </InvoiceStoreContext.Provider>
  );
}

export function useInvoiceStore() {
  return useContext(InvoiceStoreContext);
}
