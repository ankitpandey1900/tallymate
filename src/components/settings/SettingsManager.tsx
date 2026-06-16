"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Tag, Landmark, Plus, Check, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createCategory,
  createIncomeSource,
  type getSettingsPageData,
} from "@/app/actions";
import { UnifiedUser, UnifiedCategory, UnifiedIncomeSource } from "@/lib/unified-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field-label";

type SettingsInitialData = Awaited<ReturnType<typeof getSettingsPageData>>;

export default function SettingsManager({ initialData }: { initialData: SettingsInitialData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "categories" | "sources">("categories");
  const [currentUser, setCurrentUser] = useState<UnifiedUser | null>(initialData.user);
  const [categories, setCategories] = useState<UnifiedCategory[]>(initialData.categories);
  const [incomeSources, setIncomeSources] = useState<UnifiedIncomeSource[]>(initialData.incomeSources);

  // Forms
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#3B82F6");
  const [sourceName, setSourceName] = useState("");

  useEffect(() => {
    setCurrentUser(initialData.user);
    setCategories(initialData.categories);
    setIncomeSources(initialData.incomeSources);
  }, [initialData]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    try {
      await createCategory({ name: catName, color: catColor });
      setCatName("");
      router.refresh();
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
      router.refresh();
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
            <Button
              key={tab.id}
              type="button"
              variant={activeTab === tab.id ? "toggle-active" : "toggle-inactive"}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider text-left transition-all duration-150 justify-start h-auto",
                activeTab === tab.id
                  ? "bg-neutral-100 dark:bg-[#222226] text-neutral-900 dark:text-neutral-50 border-transparent dark:border-transparent"
                  : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#1c1c20] hover:text-neutral-800 dark:hover:text-neutral-200 border-transparent dark:border-transparent"
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </Button>
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
                  <FieldLabel>Category Name</FieldLabel>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Groceries, SaaS Subscriptions"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                  />
                </div>

                {/* Color swatches selector */}
                <div className="space-y-1.5">
                  <FieldLabel>Category Tag Color</FieldLabel>
                  <div className="flex items-center gap-2 flex-wrap">
                    {colorPresets.map((color) => (
                      <Button
                        key={color}
                        type="button"
                        variant="unstyled"
                        onClick={() => setCatColor(color)}
                        className="w-7 h-7 rounded-full flex items-center justify-center border border-black/10 transition-transform hover:scale-105"
                        style={{ backgroundColor: color }}
                      >
                        {catColor === color && <Check size={12} className="text-white" />}
                      </Button>
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

                <Button type="submit" variant="submit">
                  <Plus size={14} />
                  Create Category
                </Button>
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
                  <FieldLabel>Source Name</FieldLabel>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Consulting, Royalties, Business Dividends"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                  />
                </div>

                <Button type="submit" variant="submit">
                  <Plus size={14} />
                  Create Source
                </Button>
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
