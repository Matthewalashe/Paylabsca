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
  /** If true, hide the toolbar (used on the clean invoice page) */
  hideToolbar?: boolean;
}

/**
 * Recursively convert all oklch/oklab colors in computed styles to rgb
 * so html2canvas can parse them. Works by walking every element and
 * overriding color, background-color, border-color with rgb equivalents.
 */
function convertOklchToRgb(root: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;

  function toRgb(color: string): string {
    if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") return color;
    if (color.includes("oklch") || color.includes("oklab") || color.includes("color(")) {
      // Use canvas to convert to rgb
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
    const props = [
      "color", "background-color", "border-color",
      "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
      "outline-color", "text-decoration-color", "box-shadow",
    ];
    props.forEach((p) => {
      const val = cs.getPropertyValue(p);
      if (val && (val.includes("oklch") || val.includes("oklab") || val.includes("color("))) {
        htmlEl.style.setProperty(p, toRgb(val));
      }
    });
  });

  // Also the root itself
  const rootCs = getComputedStyle(root);
  ["color", "background-color"].forEach((p) => {
    const val = rootCs.getPropertyValue(p);
    if (val && (val.includes("oklch") || val.includes("oklab") || val.includes("color("))) {
      root.style.setProperty(p, toRgb(val));
    }
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
  const [scale, setScale] = useState(0.45);

  // Responsive scale calculation via ResizeObserver
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 16; // padding
    const invoiceWidth = 794; // .invoice-page = 210mm ≈ 794px
    const newScale = Math.min(1, containerWidth / invoiceWidth);
    setScale(newScale);
  }, []);

  useEffect(() => {
    updateScale();
    if (!containerRef.current) return;
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateScale]);

  // PDF Download
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const el = hiddenRef.current;
      if (!el) throw new Error("Render target missing");

      // Position off-screen but visible (display:block) for html2canvas
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

      // Wait for images to load
      await new Promise((r) => setTimeout(r, 800));

      // Convert oklch colors to rgb so html2canvas can parse them
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

      // Hide again
      el.style.cssText = "display: none;";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

      // Save via blob (mobile-compatible)
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
      // Fallback: open print dialog
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const invoiceHeight = 1123; // 297mm ≈ 1123px

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

      {/* Scaled Preview Container */}
      <div
        ref={containerRef}
        className="bg-gray-200 rounded-2xl border border-gray-300 overflow-hidden p-2 sm:p-3 lg:p-4"
      >
        <div
          style={{
            width: 794,
            height: invoiceHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            marginBottom: invoiceHeight * (scale - 1),
            marginRight: 794 * (scale - 1),
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

      {/* Hidden off-screen full-size render target for PDF */}
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
