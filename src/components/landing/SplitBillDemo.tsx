"use client";

import React, { useState } from "react";
import { Users, Receipt, ArrowRight } from "lucide-react";

export default function SplitBillDemo() {
  const [amount, setAmount] = useState<number>(1200);
  const [friendsCount, setFriendsCount] = useState<number>(3);
  const totalPeople = friendsCount + 1; // You + friends
  
  const splitAmount = amount / totalPeople;

  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-[#111113] rounded-[2rem] border border-black/[0.06] dark:border-white/10 p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
          <Receipt size={24} />
        </div>
        <div>
          <h3 className="font-bold text-xl text-neutral-900 dark:text-white">Interactive Demo</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">See how easy it is to split a bill</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Total Bill Amount (₹)
          </label>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            ₹{amount.toLocaleString()}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Number of Friends
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={friendsCount}
              onChange={(e) => setFriendsCount(Number(e.target.value))}
              className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
              <Users size={16} className="text-neutral-500 dark:text-neutral-400" />
              <span className="font-bold">{friendsCount}</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-black/[0.06] dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Split equally among {totalPeople} people</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#1a1a1c] border border-neutral-100 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 font-semibold uppercase tracking-wider">Your Share</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">₹{splitAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-neutral-400 mt-2">Deducted from budget</p>
            </div>
            
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <ArrowRight size={48} />
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-semibold uppercase tracking-wider">Friends Owe You</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">₹{(amount - splitAmount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-blue-500/70 dark:text-blue-400/70 mt-2">Added to pending receivables</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
