import type { InvoiceData } from "./types";

export type ValidationErrors = Partial<Record<keyof InvoiceData | "photos" | "lineItems", string>>;

export function validateInvoice(invoice: InvoiceData, photoUrls: string[]): ValidationErrors {
  const errors: ValidationErrors = {};

  // Client Details
  if (!invoice.clientName || invoice.clientName.trim().length < 3) {
    errors.clientName = "Client name must be at least 3 characters";
  }
  if (!invoice.clientAddress || invoice.clientAddress.trim().length < 5) {
    errors.clientAddress = "Client address is required";
  }
  if (!invoice.clientPhone || !/^\+?[0-9]{10,15}$/.test(invoice.clientPhone.replace(/\s+/g, ""))) {
    errors.clientPhone = "Valid phone number is required";
  }
  if (!invoice.clientEmail || !/^\S+@\S+\.\S+$/.test(invoice.clientEmail)) {
    errors.clientEmail = "Valid email address is required";
  }

  // Property Details
  if (!invoice.propertyAddress || invoice.propertyAddress.trim().length < 5) {
    errors.propertyAddress = "Property address is required";
  }
  if (!invoice.propertyLGA) {
    errors.propertyLGA = "LGA selection is required";
  }

  // Photos (at least 4 valid URLs)
  const validPhotos = photoUrls.filter(url => url.trim().length > 0);
  if (validPhotos.length < 4) {
    errors.photos = "All 4 property photos are required";
  }

  // Line Items
  const validItems = invoice.lineItems.filter(item => item.address.trim() && item.total > 0);
  if (validItems.length === 0) {
    errors.lineItems = "At least one valid line item with an amount greater than 0 is required";
  }

  return errors;
}
