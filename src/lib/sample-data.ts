// ============================================================
// Sample invoice data for development/demo
// ============================================================

import type { InvoiceData } from "./types";

/** Sample UBA invoice matching the uploaded template exactly */
export const SAMPLE_UBA_INVOICE: InvoiceData = {
  id: "inv-001",
  invoiceNumber: "INV-UBA-20260313-001",
  referenceNumber: "INV-UBA-20260313-001",
  status: "approved",

  issueDate: "2026-03-13",
  dueDate: "2026-04-13",

  clientName: "United Bank For Africa (UBA) Plc",
  clientAddress: "1, Simbiat Abiola Way, Ikeja",
  clientPhone: "+234-1-280-8822",
  clientEmail: "donghinny91@gmail.com",

  propertyAddress: "1, Simbiat Abiola Way, Ikeja",
  propertyLGA: "Ikeja",
  buildingUse: "Commercial",
  coordinates: {
    longitude: 6.595837836231696,
    latitude: 3.338749213550662,
  },
  photos: [
    { id: "p1", url: "/sample/photo1.jpg", position: 1 },
    { id: "p2", url: "/sample/photo2.jpg", position: 2 },
    { id: "p3", url: "/sample/photo3.jpg", position: 3 },
    { id: "p4", url: "/sample/photo4.jpg", position: 4 },
  ],

  certificateType: "completion_fitness",
  certificateTitle: "CERTIFICATE FOR COMPLETION AND FITNESS FOR HABITATION",

  revenueCode: "4020167",
  agencyCode: "7740103",

  lineItems: [
    {
      id: "li-001",
      address: "1, Simbiat Abiola Way, Ikeja",
      floor: 5,
      price: 2000000,
      total: 10000000,
    },
  ],
  subtotal: 10000000,
  totalAmount: 10000000,

  createdBy: "billing-officer-001",
  approvedBy: "auth-officer-001",
  approvedAt: "2026-03-13T10:00:00Z",

  createdAt: "2026-03-13T09:00:00Z",
  updatedAt: "2026-03-13T10:00:00Z",
};

/** Multiple sample invoices for the dashboard */
export const SAMPLE_INVOICES: InvoiceData[] = [
  SAMPLE_UBA_INVOICE,
  {
    ...SAMPLE_UBA_INVOICE,
    id: "inv-002",
    invoiceNumber: "INV-UBA-20260313-002",
    referenceNumber: "INV-UBA-20260313-002",
    status: "draft",
    propertyAddress: "22 Allen Avenue, Ikeja",
    lineItems: [
      {
        id: "li-002",
        address: "22 Allen Avenue, Ikeja",
        floor: 3,
        price: 2000000,
        total: 6000000,
      },
    ],
    subtotal: 6000000,
    totalAmount: 6000000,
    approvedBy: undefined,
    approvedAt: undefined,
  },
  {
    ...SAMPLE_UBA_INVOICE,
    id: "inv-003",
    invoiceNumber: "INV-UBA-20260313-003",
    referenceNumber: "INV-UBA-20260313-003",
    status: "sent",
    propertyAddress: "57 Marina, Lagos Island",
    propertyLGA: "Lagos Island",
    lineItems: [
      {
        id: "li-003",
        address: "57 Marina, Lagos Island",
        floor: 8,
        price: 3000000,
        total: 24000000,
      },
    ],
    subtotal: 24000000,
    totalAmount: 24000000,
    sentAt: "2026-03-14T08:00:00Z",
  },
  {
    ...SAMPLE_UBA_INVOICE,
    id: "inv-004",
    invoiceNumber: "INV-UBA-20260313-004",
    referenceNumber: "INV-UBA-20260313-004",
    status: "paid",
    propertyAddress: "15 Ozumba Mbadiwe Avenue, VI",
    propertyLGA: "Eti-Osa",
    lineItems: [
      {
        id: "li-004",
        address: "15 Ozumba Mbadiwe Avenue, VI",
        floor: 12,
        price: 2500000,
        total: 30000000,
      },
    ],
    subtotal: 30000000,
    totalAmount: 30000000,
    paidAt: "2026-03-20T14:30:00Z",
    paystackReference: "PSK-UBA-20260320-001",
  },
];
