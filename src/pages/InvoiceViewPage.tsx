// ============================================================
// InvoiceViewPage.tsx — View a single invoice + workflow
// ============================================================

import { useParams, useNavigate } from "react-router-dom";
import InvoiceWorkflow from "@/components/invoice/InvoiceWorkflow";
import { useInvoiceStore } from "@/lib/invoice-store";
import type { InvoiceData } from "@/lib/types";

export default function InvoiceViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice, updateInvoice } = useInvoiceStore();

  const invoice = getInvoice(id || "");

  if (!invoice) {
    return <div className="p-10 text-center text-gray-500">Invoice not found.</div>;
  }

  const handleUpdate = (updatedInvoice: InvoiceData) => {
    // InvoiceWorkflow passes a full invoice object — extract only changed fields
    const { id, ...updates } = updatedInvoice;
    updateInvoice(invoice.id, updates);
  };

  return (
    <InvoiceWorkflow
      invoice={invoice}
      onUpdateInvoice={handleUpdate}
    />
  );
}
