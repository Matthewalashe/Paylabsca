// ============================================================
// RevenueCodesPage.tsx — Reference table for all codes & LGA rates
// ============================================================

import { REVENUE_CODES } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Building2 } from "lucide-react";

const LGA_RATES = [
  { lga: "Agege", code: "7740101", residential: 150000, commercial: 500000 },
  { lga: "Ajeromi-Ifelodun", code: "7740102", residential: 150000, commercial: 500000 },
  { lga: "Alimosho", code: "7740103", residential: 200000, commercial: 750000 },
  { lga: "Amuwo-Odofin", code: "7740104", residential: 250000, commercial: 1000000 },
  { lga: "Apapa", code: "7740105", residential: 300000, commercial: 1500000 },
  { lga: "Badagry", code: "7740106", residential: 150000, commercial: 500000 },
  { lga: "Epe", code: "7740107", residential: 150000, commercial: 500000 },
  { lga: "Eti-Osa", code: "7740108", residential: 500000, commercial: 2500000 },
  { lga: "Ibeju-Lekki", code: "7740109", residential: 300000, commercial: 1000000 },
  { lga: "Ifako-Ijaiye", code: "7740110", residential: 150000, commercial: 500000 },
  { lga: "Ikeja", code: "7740111", residential: 350000, commercial: 1500000 },
  { lga: "Ikorodu", code: "7740112", residential: 200000, commercial: 750000 },
  { lga: "Kosofe", code: "7740113", residential: 200000, commercial: 750000 },
  { lga: "Lagos Island", code: "7740114", residential: 500000, commercial: 3000000 },
  { lga: "Lagos Mainland", code: "7740115", residential: 300000, commercial: 1500000 },
  { lga: "Mushin", code: "7740116", residential: 150000, commercial: 500000 },
  { lga: "Ojo", code: "7740117", residential: 150000, commercial: 500000 },
  { lga: "Oshodi-Isolo", code: "7740118", residential: 250000, commercial: 1000000 },
  { lga: "Shomolu", code: "7740119", residential: 200000, commercial: 750000 },
  { lga: "Surulere", code: "7740120", residential: 300000, commercial: 1500000 },
];

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG").format(n);
}

export default function RevenueCodesPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Revenue Codes & LGA Rates</h1>
        <p className="text-sm text-gray-500 mt-0.5">Official statutory codes for LASBCA billing</p>
      </div>

      {/* Revenue Codes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#006400]" />
          <h2 className="font-bold text-gray-900">Revenue Codes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
              </tr>
            </thead>
            <tbody>
              {REVENUE_CODES.map(rc => (
                <tr key={rc.code} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-[#006400]">{rc.code}</td>
                  <td className="px-4 py-3 text-gray-700">{rc.description}</td>
                  <td className="px-4 py-3">
                    <Badge variant={rc.category === "certification" ? "approved" : rc.category === "penalty" ? "rejected" : "default"}>
                      {rc.category}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LGA Rates */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#006400]" />
          <h2 className="font-bold text-gray-900">LGA Rate Schedule (20 LGAs)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">LGA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Agency Code</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Residential (₦)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Commercial (₦)</th>
              </tr>
            </thead>
            <tbody>
              {LGA_RATES.map(rate => (
                <tr key={rate.lga} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{rate.lga}</td>
                  <td className="px-4 py-3 font-mono text-sm text-[#006400] font-bold">{rate.code}</td>
                  <td className="px-4 py-3 text-right text-gray-700">₦{formatNaira(rate.residential)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">₦{formatNaira(rate.commercial)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
