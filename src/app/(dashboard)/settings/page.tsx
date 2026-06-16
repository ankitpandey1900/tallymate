import React from "react";
import SettingsManager from "@/components/settings/SettingsManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings Configuration - Tallymate",
  description: "Configure custom categories, custom income sources, profiles and settings.",
};

export default function SettingsPage() {
  return <SettingsManager />;
}
