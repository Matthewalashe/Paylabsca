// ============================================================
// InvoicePreviewPanel.tsx — Reusable scaled invoice preview
// with working PDF download
// ============================================================

import { useRef, useState, useEffect, useCallback } from "react";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import type { InvoiceData } from "@/lib/types";
import { Loader2, Download, Printer } from "lucide-react";

interface InvoicePreviewPanelProps {
  invoice: InvoiceData;
  stampUrl?: string | null;
  signatureUrl?: string | null;
  className?: string;
  hideToolbar?: boolean;
}

/**
 * Convert oklch/oklab/color() values to rgb so html2canvas can parse them.
 */
function convertOklchToRgb(root: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;

  function toRgb(color: string): string {
    if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") return color;
    if (color.includes("oklch") || color.includes("oklab") || color.includes("color(")) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return a < 255 ? `rgba(${r},${g},${b},${(a / 255).toFixed(3)})` : `rgb(${r},${g},${b})`;
    }
    return color;
  }

  const els = root.querySelectorAll("*");
  els.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const cs = getComputedStyle(htmlEl);
    ["color", "background-color", "border-color",
      "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
      "outline-color", "text-decoration-color",
    ].forEach((p) => {
      const val = cs.getPropertyValue(p);
      if (val && (val.includes("oklch") || val.includes("oklab") || val.includes("color("))) {
        htmlEl.style.setProperty(p, toRgb(val));
      }
    });
  });
}

export default function InvoicePreviewPanel({
  invoice,
  stampUrl = null,
  signatureUrl = null,
  className = "",
  hideToolbar = false,
}: InvoicePreviewPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const hiddenRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.45);
  const [contentHeight, setContentHeight] = useState(1123);

  // Measure the actual invoice content height
  const measureInvoice = useCallback(() => {
    if (!invoiceRef.current) return;
    const h = invoiceRef.current.scrollHeight;
    if (h > 0) setContentHeight(h);
  }, []);

  // Responsive scale via ResizeObserver
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const pad = 16; // p-2 = 8px each side
    const containerWidth = containerRef.current.clientWidth - pad;
    const invoiceWidth = 794; // .invoice-page = 210mm
    setScale(Math.min(1, containerWidth / invoiceWidth));
  }, []);

  useEffect(() => {
    updateScale();
    measureInvoice();

    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      updateScale();
      measureInvoice();
    });
    observer.observe(containerRef.current);
    if (invoiceRef.current) observer.observe(invoiceRef.current);
    return () => observer.disconnect();
  }, [updateScale, measureInvoice]);

  // Re-measure after images load
  useEffect(() => {
    const timer = setTimeout(measureInvoice, 1500);
    return () => clearTimeout(timer);
  }, [measureInvoice, invoice]);

  // PDF Download
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const el = hiddenRef.current;
      if (!el) throw new Error("Render target missing");

      el.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        z-index: -9999;
        opacity: 1;
        pointer-events: none;
        display: block;
        background: white;
      `;

      await new Promise((r) => setTimeout(r, 800));
      convertOklchToRgb(el);

      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: el.scrollWidth,
        height: el.scrollHeight,
      });

      el.style.cssText = "display: none;";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

      const blob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${invoice.invoiceNumber || "LASBCA-Invoice"}.pdf`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error("PDF generation error:", err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  // Compute the visible dimensions after scaling
  const scaledWidth = 794 * scale;
  const scaledHeight = contentHeight * scale;

  return (
    <div className={className}>
      {/* Toolbar */}
      {!hideToolbar && (
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
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
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
      )}

      {/* Scaled Preview — container sizes itself to the SCALED dimensions */}
      <div
        ref={containerRef}
        className="bg-gray-200 rounded-2xl border border-gray-300 overflow-hidden"
        style={{ padding: 8 }}
      >
        {/* This wrapper is sized to the exact scaled content dimensions,
            centering the invoice within the container */}
        <div
          className="mx-auto"
          style={{
            width: scaledWidth,
            height: scaledHeight,
            overflow: "hidden",
          }}
        >
          <div
            ref={invoiceRef}
            style={{
              width: 794,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
            }}
          >
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

      {/* Hidden full-size render target for PDF */}
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
