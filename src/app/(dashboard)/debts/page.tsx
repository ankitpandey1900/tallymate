import React from "react";
import DebtTrackerView from "@/components/debts/DebtTrackerView";
import { getDebtTrackerData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debt Tracker - Tallymate",
  description: "Track what you owe and what others owe you across all shared groups.",
};

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const initialData = await getDebtTrackerData();
  return <DebtTrackerView initialData={initialData} />;
}
