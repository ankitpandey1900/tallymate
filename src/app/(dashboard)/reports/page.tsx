import React from "react";
import ReportsView from "@/components/reports/ReportsView";
import { getReportsPageData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Reports - Tallymate",
  description: "Charts, trends, and CSV exports to review your income, spending, and habits.",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const initialData = await getReportsPageData("monthly");
  return <ReportsView initialData={initialData} />;
}
