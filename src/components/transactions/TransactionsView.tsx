"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Loader2,
  ArrowDownToLine,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { toast, toastError } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FieldLabel } from "@/components/ui/field-label";
import { AppDialog } from "@/components/ui/app-dialog";
import { Textarea } from "@/components/ui/textarea";
import { fieldInputClass } from "@/components/ui/app-styles";
import { formatPaymentMode, ACCOUNT_TYPE_OPTIONS } from "@/lib/account-labels";
import { getCategoryIcon } from "@/lib/category-icons";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  bulkUpdateTransactions,
  uploadReceipt,
  type getTransactionsPageData,
} from "@/app/actions";
import {
  UnifiedTransaction,
  UnifiedAccount,
  UnifiedCategory,
  UnifiedIncomeSource,
} from "@/lib/unified-db";

const EMPTY_FORM = {
  amount: "",
  type: "EXPENSE",
  accountId: "",
  categoryId: "",
  incomeSourceId: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
  tagsInput: "",
  transferToAccountId: "",
};

type TransactionsInitialData = Awaited<ReturnType<typeof getTransactionsPageData>>;

export default function TransactionsView({ initialData }: { initialData: TransactionsInitialData }) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>(initialData.transactions);
  const [accounts, setAccounts] = useState<UnifiedAccount[]>(initialData.accounts);
  const [categories, setCategories] = useState<UnifiedCategory[]>(initialData.categories);
  const [incomeSources, setIncomeSources] = useState<UnifiedIncomeSource[]>(initialData.incomeSources);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedAccount, setSelectedAccount] = useState("ALL");
  const [selectedDateRange, setSelectedDateRange] = useState("ALL");

  // Grouping & Accordion State
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const toggleYear = (key: string) => setExpandedYears(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleMonth = (key: string) => setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleWeek = (key: string) => setExpandedWeeks(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleDate = (key: string) => setExpandedDates(prev => ({ ...prev, [key]: !prev[key] }));

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<UnifiedTransaction | null>(null);
  const [previewTx, setPreviewTx] = useState<UnifiedTransaction | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);



  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelectionMode = selectedIds.size > 0;
  const [bulkCategorizing, setBulkCategorizing] = useState(false);
  const [bulkCatId, setBulkCatId] = useState("");
  const [bulkIncSrcId, setBulkIncSrcId] = useState("");

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Form state
  const [txForm, setTxForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTransactions(initialData.transactions);
    setAccounts(initialData.accounts);
    setCategories(initialData.categories);
    setIncomeSources(initialData.incomeSources);
    setIsLoading(false);
  }, [initialData]);

  const openAddModal = () => {
    setEditingTx(null);
    setTxForm({ ...EMPTY_FORM, accountId: accounts[0]?.id || "", date: new Date().toISOString().split("T")[0] });
    setUploadedUrl(null);
    setShowModal(true);
  };

  const openEditModal = (tx: UnifiedTransaction) => {
    setEditingTx(tx);
    setTxForm({
      amount: String(tx.amount),
      type: tx.type,
      accountId: tx.accountId,
      categoryId: tx.categoryId || "",
      incomeSourceId: tx.incomeSourceId || "",
      description: tx.description,
      date: tx.date.split("T")[0],
      notes: tx.notes || "",
      tagsInput: tx.tags.join(", "),
      transferToAccountId: tx.transferToAccountId || "",
    });
    setUploadedUrl(tx.receiptUrl || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTx(null);
    setUploadedUrl(null);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadReceipt(formData);
      setUploadedUrl(result.url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload file";
      alert(message);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} transactions?`)) return;
    try {
      setIsLoading(true);
      await bulkDeleteTransactions(Array.from(selectedIds));
      toast.success(`Deleted ${selectedIds.size} transactions.`);
      setTransactions(prev => prev.filter(t => !selectedIds.has(t.id)));
      clearSelection();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCategorize = async (isInc: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      setIsLoading(true);
      const data = isInc ? { incomeSourceId: bulkIncSrcId } : { categoryId: bulkCatId };
      await bulkUpdateTransactions(Array.from(selectedIds), data);
      toast.success(`Categorized ${selectedIds.size} transactions.`);
      
      setTransactions(prev => prev.map(t => {
        if (selectedIds.has(t.id)) {
          return { ...t, ...(isInc ? { incomeSourceId: bulkIncSrcId } : { categoryId: bulkCatId }) };
        }
        return t;
      }));
      clearSelection();
      setBulkCategorizing(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getMerchantLogo = (description: string) => {
    const d = description.toLowerCase();
    if (d.includes("amazon") || d.includes("amzn")) return "amazon.in";
    if (d.includes("zomato")) return "zomato.com";
    if (d.includes("swiggy")) return "swiggy.com";
    if (d.includes("netflix")) return "netflix.com";
    if (d.includes("uber")) return "uber.com";
    if (d.includes("ola")) return "olacabs.com";
    if (d.includes("spotify")) return "spotify.com";
    if (d.includes("bookmyshow")) return "bookmyshow.com";
    if (d.includes("flipkart")) return "flipkart.com";
    if (d.includes("myntra")) return "myntra.com";
    if (d.includes("airtel")) return "airtel.in";
    if (d.includes("jio")) return "jio.com";
    if (d.includes("blinkit")) return "blinkit.com";
    if (d.includes("zepto")) return "zeptonow.com";
    if (d.includes("starbucks")) return "starbucks.in";
    if (d.includes("mcdonald") || d.includes("mc donald")) return "mcdonalds.com";
    if (d.includes("irctc")) return "irctc.co.in";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.accountId) return;
    setSubmitting(true);
    try {
      const tags = txForm.tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const commonData = {
        accountId: txForm.accountId,
        type: txForm.type,
        amount: Number(txForm.amount),
        date: new Date(txForm.date).toISOString(),
        description: txForm.description || txForm.type,
        notes: txForm.notes || undefined,
        tags,
        categoryId: txForm.type === "EXPENSE" ? txForm.categoryId || undefined : undefined,
        incomeSourceId: txForm.type === "INCOME" ? txForm.incomeSourceId || undefined : undefined,
        transferToAccountId: txForm.type === "TRANSFER" ? txForm.transferToAccountId || undefined : undefined,
        receiptUrl: uploadedUrl || undefined,
      };

      if (editingTx) {
        await updateTransaction(editingTx.id, commonData);
        toast.success("Transaction updated");
      } else {
        await createTransaction({ ...commonData, scope: "PERSONAL" });
        toast.success("Transaction recorded");
      }

      closeModal();
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to save transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (txId: string) => {
    if (confirmDeleteId !== txId) {
      setConfirmDeleteId(txId);
      return;
    }
    setDeletingId(txId);
    setConfirmDeleteId(null);
    try {
      await deleteTransaction(txId);
      toast.success("Transaction deleted");
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to delete transaction");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter Logic
  const filteredTxs = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(search.toLowerCase())) ||
      tx.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesType = selectedType === "ALL" || tx.type === selectedType;
    const matchesCategory = selectedCategory === "ALL" || tx.categoryId === selectedCategory;
    const matchesAccount = selectedAccount === "ALL" || tx.accountId === selectedAccount;
    let matchesDate = true;
    if (selectedDateRange !== "ALL") {
      const txDate = new Date(tx.date);
      const now = new Date();
      if (selectedDateRange === "WEEK") {
        const d = new Date(); d.setDate(now.getDate() - 7); matchesDate = txDate >= d;
      } else if (selectedDateRange === "MONTH") {
        const d = new Date(); d.setMonth(now.getMonth() - 1); matchesDate = txDate >= d;
      } else if (selectedDateRange === "YEAR") {
        const d = new Date(); d.setFullYear(now.getFullYear() - 1); matchesDate = txDate >= d;
      }
    }
    return matchesSearch && matchesType && matchesCategory && matchesAccount && matchesDate;
  });

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    filteredTxs.forEach(t => {
      if (t.type === "EXPENSE") {
        const d = t.date.split("T")[0];
        days[d] = (days[d] || 0) + Number(t.amount);
      }
    });
    return Object.entries(days).sort().map(([date, amount]) => ({
      date: date.split("-").slice(1).join("/"),
      amount
    }));
  }, [filteredTxs]);

  // Helper to get week of month (1-5)
  const getWeekOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil((date.getDate() + firstDay) / 7);
  };

  // Interfaces to fix `any` types
  interface DateNode { dateKey: string; label: string; totalIncome: number; totalExpense: number; txs: UnifiedTransaction[]; }
  interface WeekNode { weekKey: string; label: string; totalIncome: number; totalExpense: number; dates: Map<string, DateNode>; datesList?: DateNode[]; }
  interface MonthNode { monthKey: string; label: string; totalIncome: number; totalExpense: number; weeks: Map<string, WeekNode>; weeksList?: WeekNode[]; }
  interface YearNode { year: string; label: string; totalIncome: number; totalExpense: number; months: Map<string, MonthNode>; monthsList?: MonthNode[]; }

  const groupedTxs = useMemo(() => {
    // Structure: Year -> Month -> Week -> Date -> txs
    const yearMap = new Map<string, YearNode>();
    
    filteredTxs.forEach(tx => {
      const d = new Date(tx.date);
      const year = d.getFullYear().toString();
      const monthStr = d.toLocaleString("en-US", { month: "long" });
      const monthKey = `${year}-${d.getMonth()}`;
      const weekNum = getWeekOfMonth(d);
      const weekKey = `${monthKey}-W${weekNum}`;
      const dateKey = tx.date.split("T")[0];
      
      const isIncome = tx.type === "INCOME" || tx.type === "REFUND";
      const amt = Number(tx.amount);

      if (!yearMap.has(year)) {
        yearMap.set(year, { year, label: year, totalIncome: 0, totalExpense: 0, months: new Map() });
      }
      const yNode = yearMap.get(year)!;
      if (isIncome) {
        yNode.totalIncome += amt;
      } else if (tx.type === "EXPENSE") {
        yNode.totalExpense += amt;
      }

      if (!yNode.months.has(monthKey)) {
        yNode.months.set(monthKey, { monthKey, label: monthStr, totalIncome: 0, totalExpense: 0, weeks: new Map() });
      }
      const mNode = yNode.months.get(monthKey)!;
      if (isIncome) {
        mNode.totalIncome += amt;
      } else if (tx.type === "EXPENSE") {
        mNode.totalExpense += amt;
      }

      if (!mNode.weeks.has(weekKey)) {
        mNode.weeks.set(weekKey, { weekKey, label: `Week ${weekNum}`, totalIncome: 0, totalExpense: 0, dates: new Map() });
      }
      const wNode = mNode.weeks.get(weekKey)!;
      if (isIncome) {
        wNode.totalIncome += amt;
      } else if (tx.type === "EXPENSE") {
        wNode.totalExpense += amt;
      }

      if (!wNode.dates.has(dateKey)) {
        wNode.dates.set(dateKey, { dateKey, label: d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }), totalIncome: 0, totalExpense: 0, txs: [] });
      }
      const dNode = wNode.dates.get(dateKey)!;
      if (isIncome) {
        dNode.totalIncome += amt;
      } else if (tx.type === "EXPENSE") {
        dNode.totalExpense += amt;
      }
      
      dNode.txs.push(tx);
    });

    // Sort descending
    const result: YearNode[] = [];
    const sortedYears = Array.from(yearMap.values()).sort((a, b) => Number(b.year) - Number(a.year));
    for (const yNode of sortedYears) {
      yNode.monthsList = Array.from(yNode.months.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      for (const mNode of yNode.monthsList) {
        mNode.weeksList = Array.from(mNode.weeks.values()).sort((a, b) => b.weekKey.localeCompare(a.weekKey));
        for (const wNode of mNode.weeksList) {
          wNode.datesList = Array.from(wNode.dates.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
        }
      }
      result.push(yNode);
    }
    return result;
  }, [filteredTxs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Transactions</h2>
          <p className="text-sm text-neutral-500">All your income and spending in one place.</p>
        </div>
        <Button onClick={openAddModal} variant="cta" className="self-start">
          <Plus size={14} />
          Record Transaction
        </Button>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-[#111113] rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search description, notes, or tags..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              className="pl-9 pr-4"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 border border-black/[0.04] dark:border-neutral-800 p-1 rounded-lg shrink-0">
            {[{ id: "ALL", label: "All" }, { id: "WEEK", label: "Week" }, { id: "MONTH", label: "Month" }, { id: "YEAR", label: "Year" }].map((d) => (
              <Button
                key={d.id}
                type="button"
                variant="unstyled"
                onClick={() => { setSelectedDateRange(d.id); }}
                className={cn(
                  "px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors",
                  selectedDateRange === d.id
                    ? "bg-[#09090b] text-white dark:bg-[#fafafa] dark:text-black"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                )}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <FieldLabel className="text-[9px]">Type</FieldLabel>
            <NativeSelect value={selectedType} onChange={(e) => { setSelectedType(e.target.value); }} className="mt-1 py-1.5 px-2.5 text-xs">
              <option value="ALL">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
            </NativeSelect>
          </div>
          <div>
            <FieldLabel className="text-[9px]">Category</FieldLabel>
            <NativeSelect value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); }} className="mt-1 py-1.5 px-2.5 text-xs">
              <option value="ALL">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </NativeSelect>
          </div>
          <div>
            <FieldLabel className="text-[9px]">Account</FieldLabel>
            <NativeSelect value={selectedAccount} onChange={(e) => { setSelectedAccount(e.target.value); }} className="mt-1 py-1.5 px-2.5 text-xs">
              <option value="ALL">All Accounts</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* Sparkline Spending Pulse */}
      {chartData.length > 1 && (
        <div className="bg-white dark:bg-[#111113] rounded-xl border border-black/[0.04] dark:border-white/[0.04] p-4 h-36 flex flex-col justify-end overflow-hidden relative group shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Spending Pulse</p>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip
                cursor={{ stroke: 'rgba(16, 185, 129, 0.4)', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-[#1c1c1f] backdrop-blur-md border border-neutral-200 dark:border-white/10 px-3 py-2 rounded-xl shadow-xl flex items-center gap-3">
                        <div>
                          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">{payload[0].payload.date}</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAmount)"
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="panel-card overflow-hidden">
        <div className="bg-white dark:bg-[#111113] rounded-xl overflow-hidden border border-black/[0.04] dark:border-white/[0.04]">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : groupedTxs.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-400 mb-4">
                <FileText size={28} />
              </div>
              <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">No transactions found</p>
              <p className="text-sm text-neutral-500 mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {groupedTxs.map((yNode) => (
                <div key={yNode.year} className="flex flex-col">
                  {/* Year Header */}
                  <div 
                    className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 bg-neutral-100 dark:bg-neutral-900 border-b border-black/[0.04] dark:border-white/[0.04] cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => toggleYear(yNode.year)}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight size={16} className={cn("text-neutral-500 transition-transform duration-200", expandedYears[yNode.year] && "rotate-90")} />
                      <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">{yNode.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {yNode.totalIncome > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <span className="text-[10px] font-bold tracking-wider opacity-80 uppercase">In</span>
                          <span className="text-xs font-semibold">+₹{yNode.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                      )}
                      {yNode.totalExpense > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          <span className="text-[10px] font-bold tracking-wider opacity-80 uppercase">Out</span>
                          <span className="text-xs font-semibold">−₹{yNode.totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {expandedYears[yNode.year] && (
                    <div className="flex flex-col pl-4 border-l-2 border-black/[0.02] dark:border-white/[0.02]">
                      {yNode.monthsList?.map((mNode) => (
                        <div key={mNode.monthKey} className="flex flex-col border-b border-black/[0.04] dark:border-white/[0.04] last:border-none">
                          {/* Month Header */}
                          <div 
                            className="sticky top-[49px] z-30 flex items-center justify-between px-5 py-2.5 bg-neutral-50 dark:bg-[#151517] cursor-pointer hover:bg-neutral-100 dark:hover:bg-[#1a1a1c] transition-colors"
                            onClick={() => toggleMonth(mNode.monthKey)}
                          >
                            <div className="flex items-center gap-3">
                              <ChevronRight size={14} className={cn("text-neutral-400 transition-transform duration-200", expandedMonths[mNode.monthKey] && "rotate-90")} />
                              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{mNode.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {mNode.totalIncome > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 backdrop-blur-sm shadow-sm">
                                  <span className="text-[10px] font-bold tracking-widest opacity-70 uppercase">IN</span>
                                  <span className="text-xs font-bold">+₹{mNode.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                </div>
                              )}
                              {mNode.totalExpense > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-500/10 border border-neutral-500/20 text-neutral-700 dark:text-neutral-300 backdrop-blur-sm shadow-sm">
                                  <span className="text-[10px] font-bold tracking-widest opacity-70 uppercase">OUT</span>
                                  <span className="text-xs font-bold">−₹{mNode.totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {expandedMonths[mNode.monthKey] && (
                            <div className="flex flex-col pl-4 border-l-2 border-black/[0.02] dark:border-white/[0.02]">
                              {mNode.weeksList?.map((wNode) => (
                                <div key={wNode.weekKey} className="flex flex-col">
                                  {/* Week Header */}
                                  <div 
                                    className="sticky top-[93px] z-20 flex items-center justify-between px-5 py-2.5 bg-neutral-50/95 dark:bg-[#161618]/95 backdrop-blur-md border-t border-b border-black/[0.04] dark:border-white/[0.04] cursor-pointer hover:bg-neutral-100 dark:hover:bg-[#1a1a1c] transition-colors"
                                    onClick={() => toggleWeek(wNode.weekKey)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <ChevronRight size={12} className={cn("text-neutral-400 transition-transform duration-200", expandedWeeks[wNode.weekKey] && "rotate-90")} />
                                      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">{wNode.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {wNode.totalIncome > 0 && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                          <span className="text-[9px] font-bold tracking-widest opacity-70 uppercase">IN</span>
                                          <span className="text-[11px] font-bold">+₹{wNode.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                      )}
                                      {wNode.totalExpense > 0 && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-500/10 border border-neutral-500/20 text-neutral-600 dark:text-neutral-300">
                                          <span className="text-[9px] font-bold tracking-widest opacity-70 uppercase">OUT</span>
                                          <span className="text-[11px] font-bold">−₹{wNode.totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {expandedWeeks[wNode.weekKey] && (
                                    <div className="flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                                      {wNode.datesList?.map((dNode) => {
                                        const isCollapsed = !expandedDates[dNode.dateKey];
                                        return (
                                          <div key={dNode.dateKey} className="flex flex-col">
                                            {/* Date Header */}
                                            <div 
                                              className="flex items-center justify-between px-6 py-3 bg-[#fafafa] dark:bg-[#131315] border-b border-black/[0.03] dark:border-white/[0.03] cursor-pointer hover:bg-white dark:hover:bg-[#18181a] transition-colors"
                                              onClick={() => toggleDate(dNode.dateKey)}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-widest">
                                                  {dNode.label}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {dNode.totalIncome > 0 && (
                                                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    <span className="text-[9px] font-bold tracking-widest opacity-70 uppercase">IN</span>
                                                    <span className="text-[11px] font-bold">+₹{dNode.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                                  </div>
                                                )}
                                                {dNode.totalExpense > 0 && (
                                                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-500/5 border border-neutral-500/10 text-neutral-600 dark:text-neutral-400">
                                                    <span className="text-[9px] font-bold tracking-widest opacity-70 uppercase">OUT</span>
                                                    <span className="text-[11px] font-bold">−₹{dNode.totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {/* Transactions */}
                                            {!isCollapsed && dNode.txs.map((tx: any) => {
                                              const acc = accounts.find((a) => a.id === tx.accountId);
                                              const cat = categories.find((c) => c.id === tx.categoryId);
                                              const inc = incomeSources.find((s) => s.id === tx.incomeSourceId);
                                              const isDeleting = deletingId === tx.id;
                                              const isConfirming = confirmDeleteId === tx.id;
                                              const isIncome = tx.type === "INCOME" || tx.type === "REFUND";
                                              const formattedAmount = `₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

                                              return (
                                                <div 
                                                  key={tx.id} 
                                                  className={cn(
                                                    "group/item flex items-center p-4 pl-10 hover:bg-neutral-50/80 dark:hover:bg-[#1a1a1c] transition-colors relative cursor-pointer",
                                                    selectedIds.has(tx.id) && "bg-blue-50/50 dark:bg-blue-900/10"
                                                  )}
                                                  onClick={() => isSelectionMode ? toggleSelection(tx.id) : setPreviewTx(tx)}
                                                >
                                                  {/* Selection Checkbox */}
                                                  <div 
                                                    className={cn(
                                                      "absolute left-3 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all z-10 shadow-sm",
                                                      isSelectionMode || selectedIds.has(tx.id) ? "opacity-100" : "opacity-0 group-hover/item:opacity-100",
                                                      selectedIds.has(tx.id) ? "bg-blue-600 border-blue-600 text-white" : "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-[#111] hover:border-blue-500"
                                                    )}
                                                    onClick={(e) => toggleSelection(tx.id, e)}
                                                  >
                                                    {selectedIds.has(tx.id) && <Check size={12} strokeWidth={3} />}
                                                  </div>

                                                  <motion.div 
                                                    drag="x"
                                                    dragConstraints={{ left: 0, right: 0 }}
                                                    dragElastic={0.05}
                                                    onDragEnd={(e, info) => {
                                                      if (info.offset.x > 70) toggleSelection(tx.id);
                                                      else if (info.offset.x < -70) setConfirmDeleteId(tx.id);
                                                    }}
                                                    className="flex-1 flex items-center min-w-0 bg-transparent"
                                                  >
                                                    {/* Icon or Logo */}
                                                    <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center border border-black/[0.04] dark:border-white/[0.04] overflow-hidden" style={{ backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.1)' : cat ? `${cat.color}15` : 'rgba(163, 163, 163, 0.1)', color: isIncome ? '#10b981' : cat ? cat.color : '#a3a3a3' }}>
                                                      {(() => {
                                                        const domain = getMerchantLogo(tx.description);
                                                        if (domain) {
                                                          return <img src={`https://logo.clearbit.com/${domain}?size=32`} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover" alt="" />;
                                                        }
                                                        return isIncome ? <ArrowDownToLine size={14} /> : getCategoryIcon(cat?.name, 14);
                                                      })()}
                                                    </div>
                                                  
                                                  {/* Title & Details */}
                                                  <div className="ml-4 flex-1 min-w-0 flex flex-col justify-center">
                                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{tx.description}</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                                                      <span className={cn(
                                                        "font-medium px-1.5 py-0.5 rounded text-[9px]",
                                                        isIncome ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                        : tx.type === "EXPENSE" ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                                                        : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                                      )}>
                                                        {tx.type}
                                                      </span>
                                                      <span className="font-medium text-neutral-600 dark:text-neutral-400 truncate hidden sm:inline-block max-w-[120px]">
                                                        {acc?.name || "—"}
                                                      </span>
                                                      {cat && <span className="hidden sm:inline-block">· {cat.name}</span>}
                                                      {inc && <span className="hidden sm:inline-block">· {inc.name}</span>}
                                                      {!cat && !inc && (tx.categoryId || tx.incomeSourceId) && <span className="hidden sm:inline-block">· Miscellaneous</span>}
                                                    </div>
                                                  </div>

                                                  {/* Amount & Actions */}
                                                  <div className="shrink-0 flex flex-col items-end justify-center min-w-[100px] pl-4">
                                                    <span className={cn(
                                                      "text-[15px] font-bold font-mono tracking-tight whitespace-nowrap",
                                                      isIncome ? "text-emerald-500 dark:text-emerald-400" : "text-neutral-900 dark:text-white"
                                                    )}>
                                                      {isIncome ? "+" : "−"}{formattedAmount}
                                                    </span>
                                                    
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity pl-2 pointer-events-auto">
                                                      {isConfirming ? (
                                                        <>
                                                          <span className="text-[10px] text-rose-500 font-semibold mr-1">Sure?</span>
                                                          <Button
                                                            type="button"
                                                            variant="destructive-sm"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                                                            className="w-8 h-8 rounded flex items-center justify-center shadow-sm"
                                                          >
                                                            <Check size={14} />
                                                          </Button>
                                                          <Button
                                                            type="button"
                                                            variant="unstyled"
                                                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                                            className="w-8 h-8 rounded flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 transition-colors shadow-sm"
                                                          >
                                                            <X size={14} />
                                                          </Button>
                                                        </>
                                                      ) : (
                                                        <>
                                                          <Button
                                                            type="button"
                                                            variant="unstyled"
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(tx); }}
                                                            className="w-8 h-8 rounded flex items-center justify-center bg-white dark:bg-[#1a1a1c] border border-black/[0.06] dark:border-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                                                          >
                                                            <Pencil size={13} />
                                                          </Button>
                                                          <Button
                                                            type="button"
                                                            variant="unstyled"
                                                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(tx.id); }}
                                                            className="w-8 h-8 rounded flex items-center justify-center bg-white dark:bg-[#1a1a1c] border border-black/[0.06] dark:border-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm"
                                                            disabled={isDeleting}
                                                          >
                                                            {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                                          </Button>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                </motion.div>
                                              </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AppDialog
        open={!!previewTx}
        onOpenChange={(open) => { if (!open) setPreviewTx(null); }}
        title="Transaction Details"
      >
        {previewTx && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] pb-4">
              <div>
                <h3 className="text-xl font-bold">{previewTx.description}</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  {new Date(previewTx.date).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest",
                (previewTx.type === "INCOME" || previewTx.type === "REFUND") ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : previewTx.type === "EXPENSE" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
              )}>
                {previewTx.type}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Amount</span>
                <p className={cn(
                  "text-2xl font-bold font-mono tracking-tight",
                  (previewTx.type === "INCOME" || previewTx.type === "REFUND") ? "text-emerald-500 dark:text-emerald-400" : "text-neutral-900 dark:text-white"
                )}>
                  {(previewTx.type === "INCOME" || previewTx.type === "REFUND") ? "+" : "−"}₹{Number(previewTx.amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Account</span>
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {accounts.find(a => a.id === previewTx.accountId)?.name || "—"}
                </p>
              </div>
            </div>

            {(previewTx.categoryId || previewTx.tags.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {previewTx.categoryId && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Category</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categories.find(c => c.id === previewTx.categoryId)?.color }} />
                      <span className="text-sm font-semibold">{categories.find(c => c.id === previewTx.categoryId)?.name}</span>
                    </div>
                  </div>
                )}
                {previewTx.tags.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Tags</span>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {previewTx.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {previewTx.notes && (
              <div className="space-y-1 bg-neutral-50 dark:bg-[#111113] p-3 rounded-lg border border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Notes</span>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">{previewTx.notes}</p>
              </div>
            )}

            {previewTx.receiptUrl && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Receipt / Attachment</span>
                <a 
                  href={previewTx.receiptUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-2 p-3 rounded-lg border border-black/[0.04] dark:border-white/[0.04] hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">View Receipt Document</p>
                    <p className="text-xs text-neutral-500">Opens in a new tab</p>
                  </div>
                </a>
              </div>
            )}
            
            <div className="flex gap-3 justify-end pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
              <Button type="button" variant="outline-app" onClick={() => { setPreviewTx(null); openEditModal(previewTx); }}>
                <Pencil size={14} className="mr-2" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </AppDialog>
      <AppDialog
        open={showModal}
        onOpenChange={(open) => { if (open) setShowModal(true); else closeModal(); }}
        title={editingTx ? "Edit Transaction" : "Record Transaction"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {["EXPENSE", "INCOME", "TRANSFER"].map((type) => (
              <Button
                key={type}
                type="button"
                variant={txForm.type === type ? "toggle-active" : "toggle-inactive"}
                className={cn("w-full", editingTx && txForm.type !== type && "opacity-40 cursor-not-allowed")}
                onClick={() => !editingTx && setTxForm((prev) => ({ ...prev, type }))}
              >
                {type}
              </Button>
            ))}
          </div>
          {editingTx && <p className="text-[10px] text-neutral-400">Transaction type cannot be changed after creation.</p>}

          <div className="space-y-1.5">
            <FieldLabel>Amount (INR)</FieldLabel>
            <Input
              type="number"
              required
              placeholder="0.00"
              value={txForm.amount}
              onChange={(e) => setTxForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Paid from (account)</FieldLabel>
            <NativeSelect
              required
              value={txForm.accountId}
              onChange={(e) => setTxForm((prev) => ({ ...prev, accountId: e.target.value }))}
            >
              {accounts.length === 0 ? (
                <option value="">No accounts — create one first</option>
              ) : (
                accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {formatPaymentMode(a.type)} (₹{a.balance.toLocaleString('en-IN')})
                  </option>
                ))
              )}
            </NativeSelect>
            {txForm.accountId && (
              <p className="text-[10px] text-neutral-500">
                Payment method: {formatPaymentMode(accounts.find((a) => a.id === txForm.accountId)?.type)}
              </p>
            )}
          </div>

          {txForm.type === "TRANSFER" && (
            <div className="space-y-1.5">
              <FieldLabel>Transfer to</FieldLabel>
              {accounts.filter((a) => a.id !== txForm.accountId).length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 py-2">
                  Add another account to transfer money between accounts.
                </p>
              ) : (
                <NativeSelect
                  required
                  value={txForm.transferToAccountId}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, transferToAccountId: e.target.value }))}
                >
                  <option value="">Choose destination account</option>
                  {accounts.filter((a) => a.id !== txForm.accountId).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {formatPaymentMode(a.type)}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </div>
          )}

          {txForm.type === "EXPENSE" && (
            <div className="space-y-1.5">
              <FieldLabel>Category</FieldLabel>
              <NativeSelect
                value={txForm.categoryId}
                onChange={(e) => setTxForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">No Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
            </div>
          )}

          {txForm.type === "INCOME" && (
            <div className="space-y-1.5">
              <FieldLabel>Income Source</FieldLabel>
              <NativeSelect
                value={txForm.incomeSourceId}
                onChange={(e) => setTxForm((prev) => ({ ...prev, incomeSourceId: e.target.value }))}
              >
                <option value="">No Source</option>
                {incomeSources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </NativeSelect>
            </div>
          )}

          <div className="space-y-1.5">
            <FieldLabel>Description</FieldLabel>
            <Input
              type="text"
              placeholder="e.g. Uber Ride, Client Invoice"
              value={txForm.description}
              onChange={(e) => setTxForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Date</FieldLabel>
              <Input
                type="date"
                value={txForm.date}
                onChange={(e) => setTxForm((prev) => ({ ...prev, date: e.target.value }))}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Tags</FieldLabel>
              <Input
                type="text"
                placeholder="travel, food..."
                value={txForm.tagsInput}
                onChange={(e) => setTxForm((prev) => ({ ...prev, tagsInput: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Notes</FieldLabel>
            <Textarea
              placeholder="Additional details..."
              value={txForm.notes}
              onChange={(e) => setTxForm((prev) => ({ ...prev, notes: e.target.value }))}
              className={cn(fieldInputClass, "h-16 resize-none")}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Receipt Attachment</FieldLabel>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*,application/pdf" onChange={handleReceiptUpload} className="hidden" id="receipt-file-input" />
              <label htmlFor="receipt-file-input" className="px-3 py-2 border border-black/[0.04] dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold cursor-pointer">
                {uploadingReceipt ? "Uploading…" : "Choose File"}
              </label>
              {uploadedUrl && <span className="text-[10px] text-emerald-500 font-medium">✓ Uploaded</span>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="cancel" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="submit" disabled={submitting} className="disabled:opacity-60">
              {submitting && <Loader2 size={12} className="animate-spin" />}
              {editingTx ? "Save Changes" : "Save Transaction"}
            </Button>
          </div>
        </form>
      </AppDialog>

      {/* Smart Bulk Action Bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 bg-neutral-900/90 dark:bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-[90%] max-w-[500px] overflow-hidden"
          >
            <div className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-blue-500 text-white text-[11px] font-bold">
              {selectedIds.size}
            </div>
            <span className="text-sm font-semibold text-white mr-2 whitespace-nowrap">Selected</span>
            
            <div className="w-px h-6 bg-white/20 mx-1 shrink-0" />
            
            {bulkCategorizing ? (
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full">
                <NativeSelect
                  value={bulkCatId}
                  onChange={(e) => setBulkCatId(e.target.value)}
                  className="bg-white/10 text-white border-white/20 min-w-[120px]"
                >
                  <option value="">Category...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </NativeSelect>
                <NativeSelect
                  value={bulkIncSrcId}
                  onChange={(e) => setBulkIncSrcId(e.target.value)}
                  className="bg-white/10 text-white border-white/20 min-w-[120px]"
                >
                  <option value="">Source...</option>
                  {incomeSources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </NativeSelect>
                <Button variant="submit" size="sm" onClick={() => handleBulkCategorize(!!bulkIncSrcId)}>Apply</Button>
                <Button variant="unstyled" className="text-white opacity-70 hover:opacity-100 shrink-0" onClick={() => setBulkCategorizing(false)}>
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full">
                <Button variant="unstyled" className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap" onClick={() => setBulkCategorizing(true)}>
                  Categorize
                </Button>
                <Button variant="unstyled" className="text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap" onClick={handleBulkDelete}>
                  Delete
                </Button>
                <Button variant="unstyled" className="text-white/50 hover:text-white transition-colors ml-auto shrink-0" onClick={clearSelection}>
                  <X size={18} />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
