import React from "react";
import ReportsView from "@/components/reports/ReportsView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Reports - Tallymate",
  description: "Generate and review income vs expense audits, burn rate averages, daily spending category trends, and download standard CSV logs.",
};

export default function ReportsPage() {
  return <ReportsView />;
}
