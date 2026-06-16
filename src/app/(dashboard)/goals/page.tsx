import React from "react";
import GoalsManager from "@/components/goals/GoalsManager";
import { getGoalsPageData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Savings Goals - Tallymate",
  description: "Set and track progress for financial targets, emergency funds, and vacation plans.",
};

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const initialData = await getGoalsPageData();
  return <GoalsManager initialData={initialData} />;
}
