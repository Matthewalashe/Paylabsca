// ============================================================
// NotificationsPage.tsx — Notification center / inbox
// ============================================================

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/notifications";
import {
  Bell, CheckCircle, XCircle, AlertCircle, FileText,
  Check, Trash2, Clock,
} from "lucide-react";

const TYPE_CONFIG = {
  approval: { icon: CheckCircle, color: "bg-green-100 text-green-600", label: "Approved" },
  rejection: { icon: XCircle, color: "bg-red-100 text-red-600", label: "Rejected" },
  submission: { icon: Clock, color: "bg-amber-100 text-amber-600", label: "Submitted" },
  payment: { icon: FileText, color: "bg-blue-100 text-blue-600", label: "Payment" },
  info: { icon: Bell, color: "bg-gray-100 text-gray-600", label: "Info" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotifications();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification(s)` : "All caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4" /> Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={clearAll}>
              <Trash2 className="w-4 h-4" /> Clear All
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-lg">No notifications</p>
          <p className="text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const config = TYPE_CONFIG[n.type];
            const Icon = config.icon;

            return (
              <div
                key={n.id}
                className={`bg-white rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md ${
                  n.read ? "border-gray-100" : "border-l-4 border-l-[#006400] border-gray-200 bg-green-50/30"
                }`}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color.split(" ")[0]}`}>
                    <Icon className={`w-5 h-5 ${config.color.split(" ")[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`text-sm ${n.read ? "font-medium text-gray-700" : "font-bold text-gray-900"}`}>
                        {n.title}
                      </h3>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#006400]" />}
                    </div>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                      {n.fromUser && (
                        <span className="text-xs text-gray-400">From: {n.fromUser}</span>
                      )}
                      {n.invoiceId && (
                        <Link to={`/invoices/${n.invoiceId}`} className="text-xs text-[#006400] font-semibold hover:underline" onClick={e => e.stopPropagation()}>
                          View Invoice →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
