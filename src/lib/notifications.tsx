// ============================================================
// notifications.tsx — Role-scoped notification system
// ============================================================
// Each notification targets a specific role so billing and
// certification officers see ONLY their own notifications.
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export type NotificationType = "approval" | "rejection" | "submission" | "payment" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  invoiceId?: string;
  invoiceNumber?: string;
  read: boolean;
  createdAt: string;
  fromUser?: string;
  fromRole?: string;
  /** Which role should see this notification */
  targetRole: "billing_officer" | "certification_officer" | "all";
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
});

// Initial demo notifications — properly targeted to roles
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "submission",
    title: "New Invoice Submitted",
    message: "Invoice INV-UBA-20260313-002 has been submitted for your review.",
    invoiceId: "inv-002",
    invoiceNumber: "INV-UBA-20260313-002",
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    fromUser: "Adeyemi Ogunlade",
    fromRole: "Billing Officer",
    targetRole: "certification_officer",
  },
  {
    id: "n2",
    type: "approval",
    title: "Invoice Approved ✅",
    message: "Invoice INV-UBA-20260313-001 for United Bank For Africa has been approved and is ready to send to the client.",
    invoiceId: "inv-001",
    invoiceNumber: "INV-UBA-20260313-001",
    read: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    fromUser: "Arc. Bolatito Mustapha",
    fromRole: "Certification Officer",
    targetRole: "billing_officer",
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [allNotifications, setAllNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem("lasbca_notifications_v2");
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const persist = (items: Notification[]) => {
    localStorage.setItem("lasbca_notifications_v2", JSON.stringify(items));
  };

  const addNotification = useCallback((n: Omit<Notification, "id" | "read" | "createdAt">) => {
    const newN: Notification = {
      ...n,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setAllNotifications(prev => {
      const updated = [newN, ...prev];
      persist(updated);
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAllNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      persist(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setAllNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      persist(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setAllNotifications([]);
    persist([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications: allNotifications,
      unreadCount: 0, // placeholder — computed in hook
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Returns notifications filtered to the current user's role.
 * Billing officers only see billing-targeted notifications.
 * Certification officers only see cert-targeted notifications.
 */
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  const { user } = useAuth();

  const userRole = user?.role;

  // Filter notifications to only show those targeted at the current user's role
  const filtered = ctx.notifications.filter(n => {
    if (n.targetRole === "all") return true;
    return n.targetRole === userRole;
  });

  const unreadCount = filtered.filter(n => !n.read).length;

  return {
    notifications: filtered,
    unreadCount,
    addNotification: ctx.addNotification,
    markAsRead: ctx.markAsRead,
    markAllAsRead: ctx.markAllAsRead,
    clearAll: ctx.clearAll,
  };
}
