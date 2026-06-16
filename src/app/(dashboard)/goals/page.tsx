import React from "react";
import GoalsManager from "@/components/goals/GoalsManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Savings Goals - Tallymate",
  description: "Set and track progress for financial targets, emergency funds, and vacation plans.",
};

export default function GoalsPage() {
  return <GoalsManager />;
}
