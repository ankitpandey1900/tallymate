"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Tag, Landmark, Plus, Check, Shield, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast, toastError } from "@/lib/toast";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
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

  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#3B82F6");
  const [sourceName, setSourceName] = useState("");

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatColor, setEditCatColor] = useState("#3B82F6");
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState<string | null>(null);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);

  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editSourceName, setEditSourceName] = useState("");
  const [confirmDeleteSourceId, setConfirmDeleteSourceId] = useState<string | null>(null);
  const [savingSourceId, setSavingSourceId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(initialData.user);
    setCategories(initialData.categories);
    setIncomeSources(initialData.incomeSources);
  }, [initialData]);

  const colorPresets = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#6B7280",
  ];

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await createCategory({ name: catName.trim(), color: catColor });
      setCatName("");
      toast.success("Category created");
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to create category");
    }
  };

  const startEditCategory = (c: UnifiedCategory) => {
    setEditingCategoryId(c.id);
    setEditCatName(c.name);
    setEditCatColor(c.color);
    setConfirmDeleteCategoryId(null);
  };

  const handleSaveCategory = async (categoryId: string) => {
    if (!editCatName.trim()) return;
    setSavingCategoryId(categoryId);
    try {
      await updateCategory(categoryId, { name: editCatName.trim(), color: editCatColor });
      setEditingCategoryId(null);
      toast.success("Category updated");
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to update category");
    } finally {
      setSavingCategoryId(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirmDeleteCategoryId !== categoryId) {
      setConfirmDeleteCategoryId(categoryId);
      setEditingCategoryId(null);
      return;
    }
    setSavingCategoryId(categoryId);
    try {
      await deleteCategory(categoryId);
      setConfirmDeleteCategoryId(null);
      toast.success("Category deleted");
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to delete category");
    } finally {
      setSavingCategoryId(null);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim()) return;
    try {
      await createIncomeSource({ name: sourceName.trim() });
      setSourceName("");
      toast.success("Income source created");
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to create income source");
    }
  };

  const startEditSource = (s: UnifiedIncomeSource) => {
    setEditingSourceId(s.id);
    setEditSourceName(s.name);
    setConfirmDeleteSourceId(null);
  };

  const handleSaveSource = async (sourceId: string) => {
    if (!editSourceName.trim()) return;
    setSavingSourceId(sourceId);
    try {
      await updateIncomeSource(sourceId, { name: editSourceName.trim() });
      setEditingSourceId(null);
      toast.success("Income source updated");
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to update income source");
    } finally {
      setSavingSourceId(null);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (confirmDeleteSourceId !== sourceId) {
      setConfirmDeleteSourceId(sourceId);
      setEditingSourceId(null);
      return;
    }
    setSavingSourceId(sourceId);
    try {
      await deleteIncomeSource(sourceId);
      setConfirmDeleteSourceId(null);
      toast.success("Income source deleted");
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to delete income source");
    } finally {
      setSavingSourceId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-neutral-500">Categories, income sources, and your profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-1">
          {[
            { id: "categories" as const, label: "Categories", icon: Tag },
            { id: "sources" as const, label: "Income Sources", icon: Landmark },
            { id: "profile" as const, label: "Profile", icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                type="button"
                variant={activeTab === tab.id ? "toggle-active" : "toggle-inactive"}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold text-left transition-all duration-150 justify-start h-auto normal-case tracking-normal",
                  activeTab === tab.id
                    ? "bg-neutral-100 dark:bg-[#222226] text-neutral-900 dark:text-neutral-50"
                    : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#1c1c20]"
                )}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="md:col-span-3 space-y-6">
          {activeTab === "categories" && (
            <div className="space-y-6">
              <div className="panel-card p-5 space-y-4">
                <h3 className="text-sm font-semibold">Add expense category</h3>
                <form onSubmit={handleAddCategory} className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <FieldLabel>Category name</FieldLabel>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Groceries, Subscriptions"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Color</FieldLabel>
                    <div className="flex items-center gap-2 flex-wrap">
                      {colorPresets.map((color) => (
                        <Button
                          key={color}
                          type="button"
                          variant="unstyled"
                          onClick={() => setCatColor(color)}
                          className="w-7 h-7 rounded-full flex items-center justify-center border border-black/10"
                          style={{ backgroundColor: color }}
                        >
                          {catColor === color && <Check size={12} className="text-white" />}
                        </Button>
                      ))}
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
                    Add category
                  </Button>
                </form>
              </div>

              <div className="panel-card p-5 space-y-4">
                <h3 className="text-sm font-semibold">Your categories</h3>
                <p className="text-xs text-neutral-500">Tap edit to rename or change color. Delete removes the category from future use.</p>
                <div className="space-y-2">
                  {categories.map((c) => {
                    const isEditing = editingCategoryId === c.id;
                    const isConfirmingDelete = confirmDeleteCategoryId === c.id;
                    const isBusy = savingCategoryId === c.id;

                    if (isEditing) {
                      return (
                        <div key={c.id} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-3">
                          <Input
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            className="text-sm"
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            {colorPresets.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setEditCatColor(color)}
                                className="w-6 h-6 rounded-full border border-black/10"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                            <input
                              type="color"
                              value={editCatColor}
                              onChange={(e) => setEditCatColor(e.target.value)}
                              className="w-6 h-6 rounded cursor-pointer"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="submit"
                              onClick={() => handleSaveCategory(c.id)}
                              disabled={isBusy}
                              className="text-xs py-1.5"
                            >
                              {isBusy ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                            </Button>
                            <Button
                              type="button"
                              variant="cancel"
                              onClick={() => setEditingCategoryId(null)}
                              className="text-xs py-1.5"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="text-sm font-medium truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isConfirmingDelete ? (
                            <>
                              <Button
                                type="button"
                                variant="destructive-sm"
                                onClick={() => handleDeleteCategory(c.id)}
                                disabled={isBusy}
                              >
                                {isBusy ? <Loader2 size={11} className="animate-spin" /> : "Delete?"}
                              </Button>
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => setConfirmDeleteCategoryId(null)}
                                className="p-1.5 text-xs"
                              >
                                No
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => startEditCategory(c)}
                                className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                                title="Edit category"
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => handleDeleteCategory(c.id)}
                                disabled={isBusy}
                                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500"
                                title="Delete category"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "sources" && (
            <div className="space-y-6">
              <div className="panel-card p-5 space-y-4">
                <h3 className="text-sm font-semibold">Add income source</h3>
                <form onSubmit={handleAddSource} className="space-y-3 max-w-md">
                  <div className="space-y-1.5">
                    <FieldLabel>Source name</FieldLabel>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Salary, Freelancing"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="submit">
                    <Plus size={14} />
                    Add source
                  </Button>
                </form>
              </div>

              <div className="panel-card p-5 space-y-4">
                <h3 className="text-sm font-semibold">Your income sources</h3>
                <div className="space-y-2">
                  {incomeSources.map((s) => {
                    const isEditing = editingSourceId === s.id;
                    const isConfirmingDelete = confirmDeleteSourceId === s.id;
                    const isBusy = savingSourceId === s.id;

                    if (isEditing) {
                      return (
                        <div key={s.id} className="flex gap-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                          <Input
                            value={editSourceName}
                            onChange={(e) => setEditSourceName(e.target.value)}
                            className="text-sm flex-1"
                          />
                          <Button
                            type="button"
                            variant="submit"
                            onClick={() => handleSaveSource(s.id)}
                            disabled={isBusy}
                            className="text-xs"
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="cancel"
                            onClick={() => setEditingSourceId(null)}
                            className="text-xs"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800"
                      >
                        <span className="text-sm font-medium">{s.name}</span>
                        <div className="flex items-center gap-1">
                          {isConfirmingDelete ? (
                            <>
                              <Button
                                type="button"
                                variant="destructive-sm"
                                onClick={() => handleDeleteSource(s.id)}
                                disabled={isBusy}
                              >
                                Delete?
                              </Button>
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => setConfirmDeleteSourceId(null)}
                                className="p-1.5 text-xs"
                              >
                                No
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => startEditSource(s)}
                                className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => handleDeleteSource(s.id)}
                                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="panel-card p-6 space-y-6">
              <div className="space-y-1 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-base font-semibold tracking-tight">Your profile</h3>
                <p className="text-xs text-neutral-500">Account details from sign-in.</p>
              </div>

              {currentUser ? (
                <div className="space-y-5 max-w-md">
                  <div className="space-y-1.5">
                    <FieldLabel>Email</FieldLabel>
                    <div className="px-3 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-900 border border-black/[0.04] dark:border-neutral-800 rounded-md">
                      {currentUser.email}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Name</FieldLabel>
                    <div className="px-3 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-900 border border-black/[0.04] dark:border-neutral-800 rounded-md">
                      {currentUser.name || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 pt-2">
                    <Shield size={14} />
                    <span>Password and Google sign-in are managed on the login page.</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">Loading profile…</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
