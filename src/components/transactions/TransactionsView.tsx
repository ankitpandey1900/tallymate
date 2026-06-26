"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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

  // Filtering
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedAccount, setSelectedAccount] = useState("ALL");
  const [selectedDateRange, setSelectedDateRange] = useState("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<UnifiedTransaction | null>(null);
  const [previewTx, setPreviewTx] = useState<UnifiedTransaction | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Grouping state
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  const toggleDateGroup = (date: string) => {
    setCollapsedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const totalItems = filteredTxs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedTxs = filteredTxs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const groupedTxs = useMemo(() => {
    const groups = new Map<string, {
      date: string;
      txs: UnifiedTransaction[];
      totalIncome: number;
      totalExpense: number;
    }>();
    
    paginatedTxs.forEach(tx => {
      const dateStr = tx.date.split("T")[0];
      if (!groups.has(dateStr)) {
        groups.set(dateStr, { date: dateStr, txs: [], totalIncome: 0, totalExpense: 0 });
      }
      const g = groups.get(dateStr)!;
      g.txs.push(tx);
      if (tx.type === "INCOME" || tx.type === "REFUND") {
        g.totalIncome += Number(tx.amount);
      } else if (tx.type === "EXPENSE") {
        g.totalExpense += Number(tx.amount);
      }
    });

    return Array.from(groups.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [paginatedTxs]);

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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 border border-black/[0.04] dark:border-neutral-800 p-1 rounded-lg shrink-0">
            {[{ id: "ALL", label: "All" }, { id: "WEEK", label: "Week" }, { id: "MONTH", label: "Month" }, { id: "YEAR", label: "Year" }].map((d) => (
              <Button
                key={d.id}
                type="button"
                variant="unstyled"
                onClick={() => { setSelectedDateRange(d.id); setPage(1); }}
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
            <NativeSelect value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setPage(1); }} className="mt-1 py-1.5 px-2.5 text-xs">
              <option value="ALL">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
            </NativeSelect>
          </div>
          <div>
            <FieldLabel className="text-[9px]">Category</FieldLabel>
            <NativeSelect value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }} className="mt-1 py-1.5 px-2.5 text-xs">
              <option value="ALL">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </NativeSelect>
          </div>
          <div>
            <FieldLabel className="text-[9px]">Account</FieldLabel>
            <NativeSelect value={selectedAccount} onChange={(e) => { setSelectedAccount(e.target.value); setPage(1); }} className="mt-1 py-1.5 px-2.5 text-xs">
              <option value="ALL">All Accounts</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </NativeSelect>
          </div>
        </div>
      </div>

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
              {groupedTxs.map((group) => {
                const groupDate = new Date(group.date);
                const displayDate = groupDate.toLocaleDateString("en-US", { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
                const isCollapsed = collapsedDates[group.date];
                
                return (
                  <div key={group.date} className="flex flex-col">
                    {/* Sticky Date Header */}
                    <div 
                      className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-white dark:bg-[#111113] border-b border-black/[0.04] dark:border-white/[0.04] cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#1a1a1c] transition-colors"
                      onClick={() => toggleDateGroup(group.date)}
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown 
                          size={14} 
                          className={cn("text-neutral-400 transition-transform duration-200", isCollapsed && "-rotate-90")} 
                        />
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {displayDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-medium">
                        {group.totalIncome > 0 && <span className="text-emerald-600 dark:text-emerald-500">+₹{group.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>}
                        {group.totalExpense > 0 && <span className="text-neutral-500 dark:text-neutral-400">−₹{group.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>}
                      </div>
                    </div>

                    {/* Transactions for this date */}
                    {!isCollapsed && (
                      <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                        {group.txs.map((tx) => {
                          const acc = accounts.find((a) => a.id === tx.accountId);
                          const cat = categories.find((c) => c.id === tx.categoryId);
                          const isDeleting = deletingId === tx.id;
                          const isConfirming = confirmDeleteId === tx.id;
                          
                          const isIncome = tx.type === "INCOME" || tx.type === "REFUND";
                          const formattedAmount = `₹${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

                          return (
                            <div 
                              key={tx.id} 
                              className="group/item flex items-center p-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors relative cursor-pointer"
                              onClick={() => setPreviewTx(tx)}
                            >
                              {/* Icon */}
                              <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center border border-black/[0.04] dark:border-white/[0.04]" style={{ backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.1)' : cat ? `${cat.color}15` : 'rgba(163, 163, 163, 0.1)', color: isIncome ? '#10b981' : cat ? cat.color : '#a3a3a3' }}>
                                {isIncome ? <ArrowDownToLine size={18} /> : getCategoryIcon(cat?.name, 18)}
                              </div>
                              
                              {/* Title & Details */}
                              <div className="ml-4 flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-[15px] font-semibold text-neutral-900 dark:text-white truncate">{tx.description}</p>
                                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                                  <span className={cn(
                                    "font-medium px-2 py-0.5 rounded-full text-[10px]",
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
                                </div>
                              </div>

                              {/* Amount & Actions */}
                              <div className="shrink-0 flex flex-col items-end justify-center min-w-[100px] pl-4">
                                <span className={cn(
                                  "text-[16px] font-bold font-mono tracking-tight whitespace-nowrap",
                                  isIncome ? "text-emerald-500 dark:text-emerald-400" : "text-neutral-900 dark:text-white"
                                )}>
                                  {isIncome ? "+" : "−"}{formattedAmount}
                                </span>
                                
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity bg-white dark:bg-[#111113] pl-2">
                                  {isConfirming ? (
                                    <>
                                      <span className="text-[10px] text-rose-500 font-semibold mr-1">Sure?</span>
                                      <Button
                                        type="button"
                                        variant="destructive-sm"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                                        title="Confirm delete"
                                      >
                                        <Check size={14} />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="unstyled"
                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                                        title="Cancel"
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
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm border border-neutral-200 dark:border-neutral-800"
                                        title="Edit transaction"
                                      >
                                        <Pencil size={14} />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="unstyled"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                                        disabled={isDeleting}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shadow-sm border border-neutral-200 dark:border-neutral-800 disabled:opacity-50"
                                        title="Delete transaction"
                                      >
                                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="h-12 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-4 bg-neutral-50/20 dark:bg-neutral-900/10">
          <span className="text-[10px] font-mono text-neutral-400">
            {totalItems === 0 ? "0 items" : `${(page - 1) * itemsPerPage + 1}–${Math.min(page * itemsPerPage, totalItems)} of ${totalItems}`}
          </span>
          <div className="flex items-center gap-1">
            <Button type="button" variant="unstyled" onClick={() => setPage(page - 1)} disabled={page === 1} className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-850 disabled:opacity-40">
              <ChevronLeft size={16} />
            </Button>
            <span className="text-xs font-semibold px-2">{page} / {totalPages}</span>
            <Button type="button" variant="unstyled" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-850 disabled:opacity-40">
              <ChevronRight size={16} />
            </Button>
          </div>
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
                  {(previewTx.type === "INCOME" || previewTx.type === "REFUND") ? "+" : "−"}₹{Number(previewTx.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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

          {!editingTx && (
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
                      {a.name} · {formatPaymentMode(a.type)} (₹{a.balance.toLocaleString()})
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
          )}

          {txForm.type === "TRANSFER" && !editingTx && (
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
    </div>
  );
}
