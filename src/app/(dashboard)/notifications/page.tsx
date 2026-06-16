import React from "react";
import NotificationsList from "@/components/notifications/NotificationsList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications Center - Tallymate",
  description: "Review your notification logs, budget alerts, and bill split settlement requests.",
};

export default function NotificationsPage() {
  return <NotificationsList />;
}
