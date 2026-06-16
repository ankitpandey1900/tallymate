import React from "react";
import BudgetsManager from "@/components/budgets/BudgetsManager";
import { getBudgetsPageData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Budgets Planning - Tallymate",
  description: "Set and track category, monthly, and group spending budgets with dynamic alert notifications.",
};

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const initialData = await getBudgetsPageData();
  return <BudgetsManager initialData={initialData} />;
}
