import React from "react";
import { getCalendarPageData } from "@/app/actions";
import CalendarView from "@/components/calendar/CalendarView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar | Tallymate",
  description: "View your expenses on a calendar grid.",
};

export default async function CalendarPage() {
  const data = await getCalendarPageData(); 

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Calendar</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Track your daily spending and income.</p>
      </div>
      <CalendarView 
        transactions={data.transactions}
        categories={data.categories}
        incomeSources={data.incomeSources}
      />
    </div>
  );
}

// Triggering TS refresh
