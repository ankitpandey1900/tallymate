import React from "react";
import DashboardDashboard from "@/components/dashboard/DashboardDashboard";
import { Metadata } from "next";
import { getDashboardData } from "@/app/actions";

export const metadata: Metadata = {
  title: "Dashboard - Tallymate",
  description: "Track your income, expenses, budgets, savings goals and split group bills.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ timeframe?: string }>;
}) {
  const params = await searchParams;
  const timeframe = (params.timeframe as "weekly" | "monthly" | "quarterly" | "yearly") || "monthly";
  const initialData = await getDashboardData(timeframe);
  return <DashboardDashboard initialData={initialData} timeframe={timeframe} />;
}
