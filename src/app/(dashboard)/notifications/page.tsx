import React from "react";
import NotificationsList from "@/components/notifications/NotificationsList";
import { getNotificationsPageData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications Center - Tallymate",
  description: "Review your notification logs, budget alerts, and bill split settlement requests.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const initialData = await getNotificationsPageData();
  return <NotificationsList initialData={initialData} />;
}
