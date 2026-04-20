// ============================================================
// InvoiceTemplate.tsx — Pixel-perfect match to uploaded design
// ============================================================
// Layout (top to bottom):
//   1. Header: Lagos coat of arms (left) + title + LASBCA logo (right) + "INVOICE"
//   2. Pink-bordered section: 4-photo collage, coordinates, address
//   3. Bill To + Date + Reference
//   4. Red-dashed: Certificate title
//   5. Red-bordered table: ADDRESS | FLOOR | PRICE | TOTAL
//   6. Subtotal + Total Due (green bar)
//   7. "Instant e-payment Method" + Revenue/Agency codes
//   8. Stamp + Signature + QR + Pay button
//   9. Footer disclaimer
// ============================================================

import { format } from "date-fns";
import type { InvoiceData } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
// Public directory images — served at root URL by Vite
const lasbcaLogo = "/lasbca-logo.png";
const coatOfArms = "/lagos-coat-of-arms.png";
const stampImageFallback = "/stamp.png";
const signatureImageFallback = "/signature.png";
import { useCertAssets } from "@/lib/cert-assets";

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  showStamp?: boolean;       // Only show after authorization
  showSignature?: boolean;   // Only show after authorization
  showQRCode?: boolean;      // Only show after sent status
  showPayButton?: boolean;   // Only show in client-facing view
  stampUrl?: string | null;  // Overrides context stamp
  signatureUrl?: string | null; // Overrides context signature
  className?: string;
}

export default function InvoiceTemplate({
  invoice,
  showStamp = false,
  showSignature = false,
  showQRCode = true,
  showPayButton = true,
  stampUrl: propsStampUrl = null,
  signatureUrl: propsSignatureUrl = null,
  className = "",
}: InvoiceTemplateProps) {
  const { stampUrl: ctxStampUrl, signatureUrl: ctxSignatureUrl } = useCertAssets();
  const stampUrl = propsStampUrl || ctxStampUrl;
  const signatureUrl = propsSignatureUrl || ctxSignatureUrl;
  const actualStamp = stampUrl || stampImageFallback;
  const actualSignature = signatureUrl || signatureImageFallback;
  const paymentUrl = `${window.location.origin}/pay/${invoice.id}`;
  const formattedDate = (() => {
    try {
      const d = new Date(invoice.issueDate);
      const day = d.getDate();
      const suffix = day === 1 || day === 21 || day === 31 ? "st"
        : day === 2 || day === 22 ? "nd"
        : day === 3 || day === 23 ? "rd" : "th";
      return `${day}${suffix} ${format(d, "MMMM, yyyy")}`;
    } catch {
      return invoice.issueDate;
    }
  })();

  // Placeholder photos for demo (colored rectangles if no real photos)
  const photoPlaceholders = [
    "bg-gradient-to-br from-gray-400 to-gray-600",
    "bg-gradient-to-br from-gray-500 to-gray-700",
    "bg-gradient-to-br from-gray-400 to-gray-500",
    "bg-gradient-to-br from-gray-500 to-gray-600",
  ];

  return (
    <div className={`invoice-page bg-white relative ${className}`} id="invoice-content">
      {/* ===== WATERMARK BACKGROUND ===== */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center"
        aria-hidden="true"
      >
        <img src={lasbcaLogo} alt="" className="w-[400px] h-[400px] object-contain" />
      </div>

      <div className="relative z-10">
        {/* ===== 1. HEADER ===== */}
        <div className="flex items-start justify-between mb-2">
          {/* Lagos Coat of Arms */}
          <div className="flex-shrink-0">
            <img
              src={coatOfArms}
              alt="Lagos State Government Coat of Arms"
              className="w-[70px] h-[80px] object-contain"
            />
          </div>

          {/* Center title */}
          <div className="text-center flex-1 px-4">
            <h1 className="text-[15px] font-extrabold text-black tracking-wide uppercase">
              Lagos State Government
            </h1>
            <h2 className="text-[13px] font-bold text-black uppercase mt-0.5">
              Lagos State Building Control Agency
            </h2>
            <p className="text-[12px] font-bold text-black">(LASBCA)</p>
          </div>

          {/* LASBCA Logo */}
          <div className="flex-shrink-0">
            <img
              src={lasbcaLogo}
              alt="LASBCA Logo"
              className="w-[72px] h-[72px] object-contain rounded-full"
            />
          </div>
        </div>

        {/* INVOICE title — right-aligned, bold, large */}
        <div className="text-right mb-3">
          <h3 className="text-[32px] font-black text-black tracking-tight uppercase">
            INVOICE
          </h3>
        </div>

        {/* ===== 2. PINK-BORDERED SECTION: Photos + Location ===== */}
        <div className="invoice-pink-border mb-3">
          {/* 4-Photo Collage Grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {[0, 1, 2, 3].map((i) => {
              const photo = invoice.photos[i];
              return (
                <div
                  key={i}
                  className={`aspect-[4/3] rounded overflow-hidden border border-gray-200 ${
                    !photo?.url ? photoPlaceholders[i] : ""
                  }`}
                >
                  {photo?.url ? (
                    <img
                      src={photo.url}
                      alt={`Property photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/60 text-xs">
                      Photo {i + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Location Coordinates + Address */}
          <div className="flex justify-between text-[11px] mb-2">
            <div>
              <p className="font-bold text-black">Location Coordinates:</p>
              <p className="text-gray-700">
                Longitude: {invoice.coordinates.longitude}
              </p>
              <p className="text-gray-700">
                Latitude: {invoice.coordinates.latitude}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-black">Location Address:</p>
              <p className="text-gray-700">{invoice.propertyAddress}</p>
            </div>
          </div>
        </div>

        {/* ===== 3. BILL TO + DATE + REF ===== */}
        <div className="flex justify-between items-start mb-3 text-[12px]">
          <div>
            <p>
              <span className="font-bold text-black">BILL TO:</span>
            </p>
            <p className="text-gray-800">{invoice.clientName}</p>
            <p className="text-gray-800">{invoice.clientAddress}</p>
          </div>
          <div className="text-right">
            <p>
              <span className="font-bold text-black">Date: </span>
              <span>{formattedDate}</span>
            </p>
            <p>
              <span className="font-bold text-black">Ref: </span>
              <span className="text-gray-700">{invoice.referenceNumber}</span>
            </p>
          </div>
        </div>

        {/* ===== 4. CERTIFICATE TITLE (red dashed border) ===== */}
        <div className="invoice-red-dashed mb-4 text-center">
          <h4 className="text-[18px] font-extrabold text-black leading-tight tracking-tight">
            RE: {invoice.certificateTitle}
          </h4>
        </div>

        {/* ===== 5. LINE ITEMS TABLE (red-bordered) ===== */}
        <div className="mb-3">
          <table className="w-full border-collapse text-[12px]">
            {/* Red header */}
            <thead>
              <tr className="invoice-table-header">
                <th className="border border-red-800 px-3 py-2 text-left w-[40%]">Address</th>
                <th className="border border-red-800 px-3 py-2 text-center w-[15%]">Floor</th>
                <th className="border border-red-800 px-3 py-2 text-right w-[22%]">Price</th>
                <th className="border border-red-800 px-3 py-2 text-right w-[23%]">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-red-200">
                  <td className="border border-red-200 px-3 py-3 text-gray-800">
                    {item.address}
                  </td>
                  <td className="border border-red-200 px-3 py-3 text-center font-semibold">
                    {item.floor}
                  </td>
                  <td className="border border-red-200 px-3 py-3 text-right text-gray-800">
                    {formatNaira(item.price)}
                  </td>
                  <td className="border border-red-200 px-3 py-3 text-right font-semibold">
                    {formatNaira(item.total)}
                  </td>
                </tr>
              ))}

              {/* Empty padding rows if fewer than 2 items */}
              {invoice.lineItems.length < 2 && (
                <tr>
                  <td className="border border-red-200 px-3 py-6" colSpan={4}></td>
                </tr>
              )}

              {/* Subtotal row */}
              <tr className="border-t-2 border-red-300">
                <td className="px-3 py-2 text-gray-600 italic" colSpan={3}>
                  Subtotal
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {formatNaira(invoice.subtotal)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== 6. TOTAL DUE — Green Bar ===== */}
          <div className="invoice-total-bar flex justify-between items-center mt-1">
            <span className="text-[16px] font-bold">Total Due</span>
            <span className="text-[24px] font-black tracking-tight">
              ₦{formatNaira(invoice.totalAmount)}
            </span>
          </div>
        </div>

        {/* ===== 7. INSTANT E-PAYMENT + CODES ===== */}
        <div className="mb-2">
          <h5 className="text-[16px] font-bold text-black mb-1">
            Instant e-payment Method
          </h5>
          <div className="flex gap-6 text-[12px]">
            <div>
              <p className="text-red-600 font-bold italic">Revenue Code:</p>
              <p className="text-[20px] font-bold text-black">{invoice.revenueCode}</p>
            </div>
            <div>
              <p className="text-red-600 font-bold italic">Agency Code:</p>
              <p className="text-[20px] font-bold text-black">{invoice.agencyCode}</p>
            </div>
          </div>
        </div>

        {/* ===== 8. STAMP + SIGNATURE + QR + PAY BUTTON ===== */}
        <div className="flex justify-between items-end mb-3 mt-2">
          {/* Left: Stamp + Signature + Officer info */}
          <div className="relative w-[58%]">
            {/* Signature */}
            {showSignature && (
              <div className="mb-0">
                <img
                  src={actualSignature}
                  alt="Signature"
                  className="h-[80px] w-auto object-contain -mb-1"
                />
              </div>
            )}

            {/* Stamp overlay — larger and more prominent */}
            {showStamp && (
              <div className="absolute -top-4 right-0 z-20">
                <img
                  src={actualStamp}
                  alt="LASBCA Certification Department Stamp"
                  className="w-[170px] h-[170px] object-contain stamp-image opacity-90"
                  style={{ transform: "rotate(-5deg)" }}
                />
              </div>
            )}

            {/* Officer details */}
            <div className="text-[12px] mt-2">
              <div className="w-[180px] border-t border-gray-400 mb-1" />
              <p className="font-bold text-black text-[14px]">Arc. Bolatito Mustapha</p>
              <p className="text-gray-700 italic text-[11px]">Director, Building Certification Department</p>
              <p className="text-gray-700 text-[11px]">
                <span className="font-bold">For:</span> The General Manager (LASBCA)
              </p>
            </div>
          </div>

          {/* Right: QR Code + Pay Button */}
          <div className="w-[38%] flex flex-col items-center">
            {showQRCode && (
              <div className="flex flex-col items-center">
                <div className="bg-white p-2 border-2 border-gray-300 rounded-md shadow-sm">
                  <QRCodeSVG value={paymentUrl} size={130} level="M" />
                </div>
                <p className="text-[10px] font-bold text-gray-600 mt-2 uppercase tracking-wider text-center">
                  Scan to Verify<br />& Pay Online
                </p>
              </div>
            )}

            {showPayButton && (
              <div className="mt-2 text-center">
                <a
                  href={paymentUrl}
                  className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] px-5 py-2.5 rounded transition-colors cursor-pointer shadow-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Or Click HERE to<br />pay instantly
                </a>
                <p className="text-[14px] font-semibold italic text-gray-600 mt-1">
                  Thank you!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ===== 9. FOOTER DISCLAIMER ===== */}
        <div className="border-t border-gray-200 pt-2 mt-4">
          <p className="text-[11px] text-red-600 italic font-semibold text-center">
            This invoice is generated from the LASBCA Automatic Payment and Billing System
          </p>
        </div>
      </div>
    </div>
  );
}
