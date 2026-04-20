// ============================================================
// InvoicePreviewPanel.tsx — Reusable scaled invoice preview
// with working PDF download via hidden full-size render
// ============================================================
// Used on both PaymentPage and InvoicePublicPage.
// Desktop: shows the standard scaled preview
// Mobile: shows a smaller scaled preview that fits the viewport
// ============================================================

import { useRef, useState } from "react";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import type { InvoiceData } from "@/lib/types";
import { Loader2, Download, Printer } from "lucide-react";

interface InvoicePreviewPanelProps {
  invoice: InvoiceData;
  stampUrl?: string | null;
  signatureUrl?: string | null;
  /** Extra class on the outermost wrapper */
  className?: string;
}

export default function InvoicePreviewPanel({
  invoice,
  stampUrl = null,
  signatureUrl = null,
  className = "",
}: InvoicePreviewPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const hiddenRef = useRef<HTMLDivElement>(null);

  // ── PDF Download — renders a hidden full-size invoice, captures it ──
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const el = hiddenRef.current;
      if (!el) throw new Error("Render target missing");

      // Show the hidden element for capture
      el.style.display = "block";
      el.style.position = "fixed";
      el.style.left = "0";
      el.style.top = "0";
      el.style.zIndex = "-9999";
      el.style.opacity = "1";
      el.style.pointerEvents = "none";

      // Let images load
      await new Promise((r) => setTimeout(r, 600));

      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: el.scrollWidth,
        height: el.scrollHeight,
      });

      // Hide again immediately
      el.style.display = "none";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

      // Blob URL approach for mobile compatibility
      const blob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(blob);

      // Try new tab first (better UX on mobile), fallback to anchor
      const opened = window.open(blobUrl, "_blank");
      if (!opened) {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${invoice.invoiceNumber || "LASBCA-Invoice"}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Could not generate PDF. Please try using your browser's Print function instead.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 no-print">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Invoice Preview
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006400] hover:bg-[#005000] text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {isDownloading ? "Generating…" : "Download PDF"}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Scaled preview — 
           The .invoice-page renders at 794px (210mm).
           We use CSS transform to scale it down.
           The negative margin-bottom collapses the empty space left by the scale.
           
           Desktop (lg): scale 0.7  → visible width ~556px
           Tablet (sm):  scale 0.52 → visible width ~413px
           Mobile:       scale 0.42 → visible width ~334px (fits ~360px screens)
      */}
      <div className="bg-gray-200 rounded-2xl border border-gray-300 overflow-hidden">
        <div className="p-2 sm:p-3 lg:p-4 overflow-x-auto">
          <div
            className="origin-top-left"
            style={{
              width: "794px", /* matches .invoice-page 210mm */
              transform: "scale(var(--invoice-scale))",
              marginBottom: "calc(1123px * (var(--invoice-scale) - 1))",
              // @ts-ignore — CSS custom property set via inline style below
            } as React.CSSProperties}
          >
            <style>{`
              :root { --invoice-scale: 0.42; }
              @media (min-width: 640px) { :root { --invoice-scale: 0.52; } }
              @media (min-width: 1024px) { :root { --invoice-scale: 0.7; } }
              @media (min-width: 1280px) { :root { --invoice-scale: 0.78; } }
            `}</style>
            <InvoiceTemplate
              invoice={invoice}
              showStamp={true}
              showSignature={true}
              showQRCode={true}
              showPayButton={false}
              stampUrl={stampUrl}
              signatureUrl={signatureUrl}
            />
          </div>
        </div>
      </div>

      {/* Hidden full-size render target for PDF capture — never visible to user */}
      <div ref={hiddenRef} style={{ display: "none" }} aria-hidden="true">
        <InvoiceTemplate
          invoice={invoice}
          showStamp={true}
          showSignature={true}
          showQRCode={true}
          showPayButton={false}
          stampUrl={stampUrl}
          signatureUrl={signatureUrl}
        />
      </div>
    </div>
  );
}
