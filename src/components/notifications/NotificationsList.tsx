"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, CheckCircle2, ShieldAlert, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { markNotificationAsRead, clearAllNotifications, type getNotificationsPageData } from "@/app/actions";
import { UnifiedNotification } from "@/lib/unified-db";

type NotificationsInitialData = Awaited<ReturnType<typeof getNotificationsPageData>>;

export default function NotificationsList({ initialData }: { initialData: NotificationsInitialData }) {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>(initialData.notifications);
  const [isClearing, setIsClearing] = useState(false);

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
  
  const handleClearAll = async () => {
    try {
      setIsClearing(true);
      await clearAllNotifications();
      setNotifications([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearing(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Notification Center</h2>
          <p className="text-[13px] text-neutral-500 mt-1">Budget alerts, group activity, and payment updates.</p>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 pb-0.5"
            >
              <Check size={14} />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="text-[12px] font-medium text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 pb-0.5"
            >
              {isClearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notifications list logs */}
      <div className="panel-card overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center mb-3">
              <Bell size={20} className="text-neutral-300 dark:text-neutral-600" />
            </div>
            You&apos;re all caught up!
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
            {notifications.map((n) => {
              const isWarning = n.type.includes("WARNING") || n.type.includes("EXCEEDED");
              return (
                <div
                  key={n.id}
                  className={cn(
                    "p-5 flex items-start gap-4 transition-colors relative group",
                    !n.isRead ? "bg-indigo-50/30 dark:bg-indigo-500/[0.03]" : "hover:bg-neutral-50/50 dark:hover:bg-white/[0.01]"
                  )}
                >
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-r-full" />
                  )}
                  
                  <div className="shrink-0 mt-0.5">
                    {isWarning ? (
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", !n.isRead ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500")}>
                        <ShieldAlert size={14} />
                      </div>
                    ) : (
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", !n.isRead ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500")}>
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={cn("text-sm truncate", !n.isRead ? "font-bold text-neutral-900 dark:text-white" : "font-semibold text-neutral-700 dark:text-neutral-300")}>{n.title}</h4>
                      <span className="text-[10px] font-medium text-neutral-400 shrink-0">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className={cn("text-[13px] leading-relaxed", !n.isRead ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-500 dark:text-neutral-500")}>
                      {n.message}
                    </p>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="absolute right-4 top-5 opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-all"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
