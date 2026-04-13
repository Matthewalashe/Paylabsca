// ============================================================
// notifications.tsx — Supabase-backed notification system
// ============================================================

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

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

/** Convert DB row to Notification */
function dbToNotification(row: any): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message || "",
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    read: row.read,
    createdAt: row.created_at,
    fromUser: row.from_user,
    fromRole: row.from_role,
    targetRole: row.target_role || "all",
  };
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .or(`target_role.eq.${user.role},target_role.eq.all,target_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data.map(dbToNotification));
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, user, fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => { fetchNotifications(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, user, fetchNotifications]);

  const filtered = notifications;
  const unreadCount = filtered.filter(n => !n.read).length;

  const addNotification = useCallback(async (n: Omit<Notification, "id" | "read" | "createdAt">) => {
    const row = {
      type: n.type,
      title: n.title,
      message: n.message,
      invoice_id: n.invoiceId || null,
      invoice_number: n.invoiceNumber || null,
      target_role: n.targetRole,
      from_user: n.fromUser || null,
      from_role: n.fromRole || null,
    };

    const { error } = await supabase.from("notifications").insert(row);
    if (error) console.error("Failed to add notification:", error);
    // Realtime will handle the UI update
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications, user]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    const ids = notifications.map(n => n.id);
    if (ids.length === 0) return;
    await supabase.from("notifications").delete().in("id", ids);
    setNotifications([]);
  }, [notifications, user]);

  return (
    <NotificationContext.Provider value={{
      notifications: filtered,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
