"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { markNotificationAsRead, type getNotificationsPageData } from "@/app/actions";
import { UnifiedNotification } from "@/lib/unified-db";

type NotificationsInitialData = Awaited<ReturnType<typeof getNotificationsPageData>>;

export default function NotificationsList({ initialData }: { initialData: NotificationsInitialData }) {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>(initialData.notifications);

  useEffect(() => {
    setNotifications(initialData.notifications);
  }, [initialData]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Mark all read in UI and trigger sequentially
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => markNotificationAsRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Notification Center</h2>
          <p className="text-sm text-neutral-500">Budget alerts, group activity, and payment updates.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
          >
            <Check size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list logs */}
      <div className="panel-card divide-y divide-neutral-100 dark:divide-neutral-800">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center">
            <Bell size={28} className="text-neutral-300 dark:text-neutral-700 mb-2" />
            No notifications on record.
          </div>
        ) : (
          notifications.map((n) => {
            const isWarning = n.type.includes("WARNING") || n.type.includes("EXCEEDED");
            return (
              <div
                key={n.id}
                className={cn(
                  "p-5 flex items-start justify-between gap-4 transition-colors",
                  !n.isRead && "bg-neutral-50/50 dark:bg-neutral-900/20"
                )}
              >
                <div className="flex gap-3.5">
                  <div className="mt-0.5">
                    {isWarning ? (
                      <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 flex items-center justify-center">
                        <ShieldAlert size={14} />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{n.title}</h4>
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[9px] text-neutral-400 font-mono">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    title="Mark as read"
                    className="p-1 rounded-md border border-black/[0.04] dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
