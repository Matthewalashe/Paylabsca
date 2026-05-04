# LASBCA Automated Billing & Certification System

![LASBCA Logo](./public/lasbca-logo.png)

## About The Project

The **LASBCA Automated Billing & Certification System** is the official, secure billing and payment tracking platform for the Lagos State Building Control Agency (LASBCA). 

It is designed to modernize the invoicing process, enabling officers to generate, approve, and track bills while providing clients with a seamless, mobile-optimized online payment portal. The system enforces strict role-based data isolation, manages certification assets (stamps and signatures), and integrates with the LIRS/Credo payment gateway for automated revenue collection.

## Key Features

### 🏢 Role-Based Dashboards
- **Certification Officers (Admins):** Review and approve invoices, manage user accounts, oversee agency financial records, and securely store digital stamps/signatures.
- **Billing Officers:** Create invoices, attach site photos, submit bills for approval, and track payment status.

### 💳 Modern Client Payment Portal
- Responsive, mobile-first payment pages designed for easy access on any device.
- Direct integration with **Credo Gateway (eTranzact)** for processing payments.
- Secure, tokenless public invoice viewing with downloadable PDFs.

### 📄 Automated Workflows
- **Approval System:** Draft invoices must be reviewed and stamped by a Certification Officer before they can be sent to clients.
- **Client Communication:** One-click delivery of invoices via **WhatsApp** and **Email** (powered by EmailJS).
- **PDF Generation:** On-the-fly rendering of A4-formatted, official LASBCA invoices with embedded QR codes, photos, and authorization stamps.

### 🔒 Enterprise-Grade Security
- **Supabase Backend:** PostgreSQL database secured with strict Row Level Security (RLS) policies.
- **Edge Functions:** Server-side payment verification and webhook processing to prevent client-side bypasses.
- **Isolated Storage:** Secure buckets for managing both public site photos and restricted certification assets.

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS v4, Vite
- **Backend as a Service:** Supabase (Database, Auth, Storage, Edge Functions, Realtime)
- **PDF Generation:** html2canvas, jsPDF
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Deployment:** Vercel

## Environment Variables

To run this project locally, create a `.env` file in the root directory and configure the following variables:

```env
# EmailJS (For sending client invoices)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# Credo Payment Gateway
VITE_CREDO_PUBLIC_KEY=your_credo_public_key

# Supabase (Backend)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

*Note: Server-side secrets (like the `SUPABASE_SERVICE_ROLE_KEY` and `CREDO_SECRET_KEY`) should only be configured in your Supabase Edge Functions environment and Vercel settings, never in the frontend `.env`.*

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Matthewalashe/Paylabsca.git
   cd Paylabsca
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Security 

This system employs a multi-layered security architecture:
- **Authentication:** JWT-based sessions managed by Supabase Auth.
- **Authorization:** PostgreSQL Row Level Security (RLS) ensures officers can only interact with their designated data.
- **Payments:** The Credo webhook edge function securely verifies all transactions server-side, ensuring payment receipts cannot be spoofed from the client.

## License

Copyright © Lagos State Building Control Agency (LASBCA). All rights reserved.
