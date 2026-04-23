// ============================================================
// LASBCA Invoice Type Definitions
// ============================================================

/** All 20 Local Government Areas in Lagos State */
export type LagosLGA =
  | "Agege" | "Ajeromi-Ifelodun" | "Alimosho" | "Amuwo-Odofin"
  | "Apapa" | "Badagry" | "Epe" | "Eti-Osa"
  | "Ibeju-Lekki" | "Ifako-Ijaiye" | "Ikeja" | "Ikorodu"
  | "Kosofe" | "Lagos Island" | "Lagos Mainland" | "Mushin"
  | "Ojo" | "Oshodi-Isolo" | "Shomolu" | "Surulere";

export const LOCAL_GOVERNMENTS: LagosLGA[] = [
  "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa",
  "Badagry", "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye",
  "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland",
  "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"
];

/** Invoice workflow status */
export type InvoiceStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "paid"
  | "overdue"
  | "rejected"
  | "cancelled";

/** Building use type */
export type BuildingUseType = "Residential" | "Commercial" | "Industrial" | "Mixed-Use" | "Institutional";

/** Certificate type */
export type CertificateType =
  | "completion_fitness"
  | "building_plan"
  | "penalty"
  | "registration"
  | "renewal";

/** Single floor/line item on an invoice */
export interface InvoiceLineItem {
  id: string;
  address: string;
  floor: number;
  price: number;
  total: number;
}

/** Property photo (up to 4) */
export interface PropertyPhoto {
  id: string;
  url: string;           // URL or base64 data URI
  position: 1 | 2 | 3 | 4;
  caption?: string;
}

/** Location coordinates */
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/** Full invoice data */
export interface InvoiceData {
  // Identity
  id: string;
  invoiceNumber: string;
  referenceNumber: string;
  status: InvoiceStatus;

  // Dates
  issueDate: string;       // ISO date
  dueDate: string;         // ISO date

  // Client
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  clientEmail?: string;

  // Property
  propertyAddress: string;
  propertyLGA: LagosLGA;
  buildingUse: BuildingUseType;
  coordinates: GeoCoordinates;
  photos: PropertyPhoto[];

  // Certificate
  certificateType: CertificateType;
  certificateTitle: string;      // e.g. "CERTIFICATE FOR COMPLETION AND FITNESS FOR HABITATION"

  // Statutory codes
  revenueCode: string;           // e.g. "4020167"
  agencyCode: string;            // e.g. "7740103"

  // Line items (floor-by-floor)
  lineItems: InvoiceLineItem[];
  subtotal: number;
  totalAmount: number;

  // Workflow
  createdBy?: string;            // user ID
  createdByName?: string;        // billing officer name (joined from profiles)
  approvedBy?: string;           // user ID
  approvedAt?: string;           // ISO datetime
  sentAt?: string;               // ISO datetime
  paidAt?: string;               // ISO datetime

  // Payment
  paystackReference?: string;
  paymentLink?: string;
  qrCodeUrl?: string;

  // Metadata
  notes?: string;
  rejectionNote?: string;
  createdAt: string;
  updatedAt: string;

  // LIRS Integration
  lirs_receipt_id?: string;     // UUID of generated revenue receipt
  lirs_payer_id?: string;       // Assigned LIRS payer ID (e.g. "C-1234567")
}

/** Revenue codes */
export const REVENUE_CODES = [
  { code: "4020167", description: "Stage Certification Fees (Certificate of Completion & Fitness for Habitation)", category: "certification" },
  { code: "4020167A", description: "Stage Certification Fees (Additional)", category: "certification" },
  { code: "4020004", description: "Fees on Building Plans", category: "fees" },
  { code: "4020005", description: "Penal Fees on Building Plans", category: "penalty" },
  { code: "4060021", description: "Unsealing / Penalty Fees", category: "penalty" },
  { code: "4020047", description: "Registration Fees", category: "registration" },
  { code: "4020083", description: "Annual Renewal Fees", category: "renewal" },
  { code: "4020277", description: "Application Processing Fee", category: "fees" },
] as const;

/** Format Naira currency */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Generate invoice number */
export function generateInvoiceNumber(clientPrefix: string = "INV"): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  const seq = Math.floor(Math.random() * 999).toString().padStart(3, "0");
  return `${clientPrefix}-${dateStr}-${seq}`;
}

/** Generate reference number */
export function generateReferenceNumber(clientCode: string): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  const seq = Math.floor(Math.random() * 999).toString().padStart(3, "0");
  return `INV-${clientCode}-${dateStr}-${seq}`;
}

/** Create a blank invoice */
export function createBlankInvoice(): InvoiceData {
  const now = new Date().toISOString();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    id: crypto.randomUUID(),
    invoiceNumber: generateInvoiceNumber(),
    referenceNumber: "",
    status: "draft",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: dueDate.toISOString().split("T")[0],
    clientName: "",
    clientAddress: "",
    propertyAddress: "",
    propertyLGA: "Ikeja",
    buildingUse: "Commercial",
    coordinates: { latitude: 0, longitude: 0 },
    photos: [],
    certificateType: "completion_fitness",
    certificateTitle: "CERTIFICATE FOR COMPLETION AND FITNESS FOR HABITATION",
    revenueCode: "4020167",
    agencyCode: "7740103",
    lineItems: [],
    subtotal: 0,
    totalAmount: 0,
    createdAt: now,
    updatedAt: now,
  };
}
