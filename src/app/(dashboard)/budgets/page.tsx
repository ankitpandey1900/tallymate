import React from "react";
import BudgetsManager from "@/components/budgets/BudgetsManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Budgets Planning - Tallymate",
  description: "Set and track category, monthly, and group spending budgets with dynamic alert notifications.",
};

export default function BudgetsPage() {
  return <BudgetsManager />;
}
