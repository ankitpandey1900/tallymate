"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User, Tag, Landmark, Plus, Check, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCurrentUser,
  getCategories,
  getIncomeSources,
  createCategory,
  createIncomeSource,
} from "@/app/actions";
import { UnifiedUser, UnifiedCategory, UnifiedIncomeSource } from "@/lib/unified-db";

export default function SettingsManager() {
  const [activeTab, setActiveTab] = useState<"profile" | "categories" | "sources">("categories");
  const [currentUser, setCurrentUser] = useState<UnifiedUser | null>(null);
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [incomeSources, setIncomeSources] = useState<UnifiedIncomeSource[]>([]);

  // Forms
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#3B82F6");
  const [sourceName, setSourceName] = useState("");

  const loadData = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      setCurrentUser(u);
      const cats = await getCategories();
      setCategories(cats);
      const srcs = await getIncomeSources();
      setIncomeSources(srcs);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    try {
      await createCategory({ name: catName, color: catColor });
      setCatName("");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName) return;

    try {
      await createIncomeSource({ name: sourceName });
      setSourceName("");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const colorPresets = [
    "#EF4444", // Red
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#6B7280", // Gray
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Side Tabs Navigation */}
      <div className="md:col-span-1 space-y-1">
        {[
          { id: "categories" as const, label: "Custom Categories", icon: Tag },
          { id: "sources" as const, label: "Income Sources", icon: Landmark },
          { id: "profile" as const, label: "Account Profile", icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider text-left transition-all duration-150",
                activeTab === tab.id
                  ? "bg-neutral-100 dark:bg-[#222226] text-neutral-900 dark:text-neutral-50"
                  : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#1c1c20] hover:text-neutral-800 dark:hover:text-neutral-200"
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main forms section */}
      <div className="md:col-span-3 space-y-6">
        {/* Custom Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="panel-card p-5 space-y-4">
              <h3 className="text-sm font-semibold">Add Custom Expense Category</h3>
              <form onSubmit={handleAddCategory} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Groceries, SaaS Subscriptions"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                  />
                </div>

                {/* Color swatches selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Category Tag Color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCatColor(color)}
                        className="w-7 h-7 rounded-full flex items-center justify-center border border-black/10 transition-transform hover:scale-105"
                        style={{ backgroundColor: color }}
                      >
                        {catColor === color && <Check size={12} className="text-white" />}
                      </button>
                    ))}
                    {/* Custom input color tag */}
                    <div className="relative w-7 h-7 rounded-full border border-black/10 overflow-hidden">
                      <input
                        type="color"
                        value={catColor}
                        onChange={(e) => setCatColor(e.target.value)}
                        className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-125"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 bg-[#09090b] dark:bg-[#fafafa] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-md text-xs font-semibold shadow-xs"
                >
                  <Plus size={14} />
                  Create Category
                </button>
              </form>
            </div>

            {/* Pre-existing list */}
            <div className="panel-card p-5 space-y-4">
              <h3 className="text-xs uppercase font-bold tracking-wider text-neutral-400">Existing Categories</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2.5 p-3 rounded-lg border border-neutral-250 dark:border-neutral-800"
                  >
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-xs font-medium truncate">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Custom Income Sources Tab */}
        {activeTab === "sources" && (
          <div className="space-y-6">
            <div className="panel-card p-5 space-y-4">
              <h3 className="text-sm font-semibold">Add Custom Income Source</h3>
              <form onSubmit={handleAddSource} className="space-y-3 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Source Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Consulting, Royalties, Business Dividends"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 bg-[#09090b] dark:bg-[#fafafa] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-md text-xs font-semibold shadow-xs"
                >
                  <Plus size={14} />
                  Create Source
                </button>
              </form>
            </div>

            {/* List */}
            <div className="panel-card p-5 space-y-4">
              <h3 className="text-xs uppercase font-bold tracking-wider text-neutral-400">Existing Income Sources</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {incomeSources.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg border border-neutral-250 dark:border-neutral-800 text-xs font-medium truncate"
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Profile Details Tab */}
        {activeTab === "profile" && (
          <div className="panel-card p-6 space-y-6">
            <div className="space-y-1 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-semibold tracking-tight">Account Profile</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage your personal account details.</p>
            </div>

            {currentUser ? (
              <div className="space-y-5 max-w-md">
                <div className="space-y-1.5">
                  <label>Registered Email</label>
                  <div className="px-3 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-900 border border-black/[0.04] dark:border-neutral-800 rounded-md text-neutral-800 dark:text-neutral-200">
                    {currentUser.email}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label>Display Name</label>
                  <div className="px-3 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-900 border border-black/[0.04] dark:border-neutral-800 rounded-md text-neutral-800 dark:text-neutral-200">
                    {currentUser.name || "—"}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                  <label>Subscription Plan</label>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-black/[0.04] dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">All Features Active</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Full access to Tallymate</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                      <Shield size={9} />
                      Active
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-neutral-400">Loading profile data...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
