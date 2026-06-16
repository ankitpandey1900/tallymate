import React from "react";
import NotificationsList from "@/components/notifications/NotificationsList";
import { getNotificationsPageData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications Center - Tallymate",
  description: "Budget alerts, group updates, and payment reminders in one place.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const initialData = await getNotificationsPageData();
  return <NotificationsList initialData={initialData} />;
}
