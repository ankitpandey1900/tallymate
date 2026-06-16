import React from "react";
import ReportsView from "@/components/reports/ReportsView";
import { getReportsPageData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Reports - Tallymate",
  description: "Generate and review income vs expense audits, burn rate averages, daily spending category trends, and download standard CSV logs.",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const initialData = await getReportsPageData("monthly");
  return <ReportsView initialData={initialData} />;
}
