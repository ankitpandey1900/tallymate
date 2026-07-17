"use client";

import React, { useState, useMemo } from "react";
import { UnifiedTransaction, UnifiedCategory, UnifiedIncomeSource } from "@/lib/unified-db";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/category-icons";

interface CalendarViewProps {
  transactions: UnifiedTransaction[];
  categories: UnifiedCategory[];
  incomeSources: UnifiedIncomeSource[];
}

export default function CalendarView({ transactions, categories, incomeSources }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday
  const blanks = Array.from({ length: startDayOfWeek });

  // Map transactions to days
  const txByDay = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; txs: UnifiedTransaction[] }>();
    
    transactions.forEach(tx => {
      // Date in ISO format like 2026-06-08T00:00:00
      const d = new Date(tx.date);
      const dateKey = format(d, 'yyyy-MM-dd');
      
      if (!map.has(dateKey)) {
        map.set(dateKey, { income: 0, expense: 0, txs: [] });
      }
      const dayData = map.get(dateKey)!;
      dayData.txs.push(tx);
      
      if (tx.type === "INCOME") dayData.income += Number(tx.amount);
      if (tx.type === "EXPENSE") dayData.expense += Number(tx.amount);
    });
    return map;
  }, [transactions]);

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedDayData = selectedDateKey ? txByDay.get(selectedDateKey) : null;
  const selectedTransactions = selectedDayData?.txs || [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-white dark:bg-[#141416] border border-black/[0.04] dark:border-white/[0.04] rounded-[24px] shadow-sm p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight">{format(currentDate, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
              Today
            </button>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-1 sm:p-2 text-center text-[9px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1 sm:mb-2">
              {day}
            </div>
          ))}
          
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[60px] sm:min-h-[100px] rounded-xl sm:rounded-2xl bg-neutral-50/50 dark:bg-[#1a1a1c]/50" />
          ))}
          
          {daysInMonth.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = txByDay.get(dateKey);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={dateKey}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "min-h-[60px] sm:min-h-[100px] p-1 sm:p-2.5 relative cursor-pointer rounded-xl sm:rounded-2xl flex flex-col justify-between border transition-colors",
                  isSelected 
                    ? "bg-blue-50 dark:bg-blue-900/10 border-blue-500 z-10" 
                    : "bg-white dark:bg-[#141416] border-black/[0.04] dark:border-white/[0.04] hover:border-black/10 dark:hover:border-white/10 hover:bg-neutral-50 dark:hover:bg-[#1a1a1c]"
                )}
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-1 sm:gap-0">
                  <span className={cn(
                    "w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-colors",
                    isToday ? "bg-black dark:bg-white text-white dark:text-black shadow-sm" : isSelected ? "bg-blue-500 text-white" : "text-neutral-700 dark:text-neutral-300 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayData && dayData.txs.length > 0 && (
                    <span className="hidden sm:inline-block text-[9px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full ring-1 ring-black/5 dark:ring-white/5">
                      {dayData.txs.length}
                    </span>
                  )}
                </div>
                
                {dayData && (
                  <div className="mt-1 flex flex-col gap-0.5 sm:gap-1 items-center sm:items-stretch">
                    {dayData.income > 0 && (
                      <div className="w-1.5 h-1.5 sm:w-auto sm:h-auto rounded-full sm:rounded-md bg-emerald-500 sm:bg-emerald-50 sm:dark:bg-emerald-500/10 sm:px-1.5 sm:py-0.5 sm:truncate sm:border sm:border-emerald-100 sm:dark:border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 text-center sm:text-left">
                        <span className="hidden sm:inline">+₹{dayData.income.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {dayData.expense > 0 && (
                      <div className="w-1.5 h-1.5 sm:w-auto sm:h-auto rounded-full sm:rounded-md bg-rose-500 sm:bg-rose-50 sm:dark:bg-rose-500/10 sm:px-1.5 sm:py-0.5 sm:truncate sm:border sm:border-rose-100 sm:dark:border-rose-500/20 text-[10px] font-bold text-rose-600 dark:text-rose-400 text-center sm:text-left">
                        <span className="hidden sm:inline">-₹{dayData.expense.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Panel for Selected Date */}
      <div className="lg:w-80 shrink-0 flex flex-col gap-4">
        {selectedDate ? (
          <div className="bg-white dark:bg-[#141416] border border-black/[0.04] dark:border-white/[0.04] rounded-[24px] shadow-sm p-6 sticky top-20 flex flex-col h-full max-h-[calc(100vh-6rem)]">
            <div className="mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-black">
                  {format(selectedDate, "d")}
                </span>
                {format(selectedDate, "MMMM yyyy")}
              </h3>
              
              {selectedDayData && (selectedDayData.income > 0 || selectedDayData.expense > 0) && (
                <div className="flex items-center gap-3">
                  {selectedDayData.income > 0 && (
                    <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-0.5">Income</p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">+₹{selectedDayData.income.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                  {selectedDayData.expense > 0 && (
                    <div className="flex-1 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-rose-600/70 dark:text-rose-400/70 uppercase tracking-wider mb-0.5">Expense</p>
                      <p className="text-sm font-black text-rose-600 dark:text-rose-400">-₹{selectedDayData.expense.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="overflow-y-auto pr-2 -mr-2 space-y-3 flex-1 custom-scrollbar">
              {selectedTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-neutral-400 space-y-3">
                  <div className="w-12 h-12 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center">
                    <Check size={20} className="text-neutral-300 dark:text-neutral-600" />
                  </div>
                  <p className="text-sm">No transactions on this date.</p>
                </div>
              ) : (
                selectedTransactions.map(tx => {
                  const isIncome = tx.type === "INCOME";
                  const isTransfer = tx.type === "TRANSFER";
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const inc = incomeSources.find(s => s.id === tx.incomeSourceId);
                  
                  return (
                    <div key={tx.id} className="group flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#1a1a1c] border border-transparent hover:border-black/5 dark:hover:border-white/5 hover:bg-white dark:hover:bg-[#202022] hover:shadow-sm transition-all cursor-default">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                        style={{
                          backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.1)' : isTransfer ? 'rgba(59, 130, 246, 0.1)' : cat ? `${cat.color}15` : 'rgba(163, 163, 163, 0.1)',
                          color: isIncome ? '#10b981' : isTransfer ? '#3b82f6' : cat ? cat.color : '#a3a3a3'
                        }}
                      >
                        {getCategoryIcon(cat?.name || inc?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tx.description}</p>
                        <p className="text-[11px] font-medium text-neutral-500 truncate mt-0.5">{cat?.name || inc?.name || (isTransfer ? "Internal Transfer" : "Miscellaneous")}</p>
                      </div>
                      <div className={cn(
                        "text-sm font-black shrink-0 tabular-nums",
                        isIncome ? "text-emerald-600 dark:text-emerald-500" : isTransfer ? "text-blue-600 dark:text-blue-400" : "text-neutral-900 dark:text-neutral-100"
                      )}>
                        {isIncome ? '+' : isTransfer ? '⇄' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="bg-neutral-50 dark:bg-[#1a1a1c] border border-dashed border-neutral-200 dark:border-neutral-800 rounded-[24px] p-6 flex flex-col items-center justify-center text-center h-64 sticky top-20">
            <div className="w-14 h-14 rounded-full bg-white dark:bg-[#141416] shadow-sm flex items-center justify-center mb-4 text-neutral-300 dark:text-neutral-700">
              <Check size={28} />
            </div>
            <p className="text-sm font-medium text-neutral-500">Select a date on the calendar to view its transactions.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Triggering TS refresh
