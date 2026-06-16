import React from "react";
import SettingsManager from "@/components/settings/SettingsManager";
import { getSettingsPageData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings Configuration - Tallymate",
  description: "Configure custom categories, custom income sources, profiles and settings.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const initialData = await getSettingsPageData();
  return <SettingsManager initialData={initialData} />;
}
