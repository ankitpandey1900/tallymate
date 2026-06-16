"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Loader2,
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
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Ledger Books</h2>
          <p className="text-sm text-neutral-500">View, edit, and audit all transaction logs.</p>
        </div>
        <Button onClick={openAddModal} variant="cta" className="self-start">
          <Plus size={14} />
          Record Transaction
        </Button>
      </div>

      {/* Filter panel */}
      <div className="panel-card p-4 space-y-3">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-black/[0.04] dark:border-neutral-800 text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                <th className="p-4">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Type</th>
                <th className="p-4 hidden sm:table-cell">Account</th>
                <th className="p-4 hidden md:table-cell">Category</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-400 mx-auto" />
                  </td>
                </tr>
              ) : paginatedTxs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    No transactions found matching active filters.
                  </td>
                </tr>
              ) : (
                paginatedTxs.map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const isDeleting = deletingId === tx.id;
                  const isConfirming = confirmDeleteId === tx.id;
                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 group">
                      <td className="p-4 font-mono text-neutral-400 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-medium max-w-[180px]">
                        <p className="truncate">{tx.description}</p>
                        {tx.notes && <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{tx.notes}</p>}
                        {tx.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {tx.tags.slice(0, 2).map((t) => (
                              <span key={t} className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[8px] font-bold text-neutral-500 uppercase tracking-wider">{t}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                          tx.type === "INCOME" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                          : tx.type === "EXPENSE" ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-950/20"
                        )}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-500 font-medium hidden sm:table-cell">{acc?.name || "—"}</td>
                      <td className="p-4 hidden md:table-cell">
                        {cat ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span>{cat.name}</span>
                          </div>
                        ) : tx.receiptUrl ? (
                          <a href={tx.receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900">
                            <FileText size={12} /> View
                          </a>
                        ) : <span className="text-neutral-400">—</span>}
                      </td>
                      <td className={cn("p-4 text-right font-bold font-mono text-sm whitespace-nowrap",
                        tx.type === "INCOME" || tx.type === "REFUND" ? "text-emerald-500" : "text-neutral-900 dark:text-neutral-100"
                      )}>
                        {tx.type === "INCOME" || tx.type === "REFUND" ? "+" : "−"}₹{Number(tx.amount).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          {isConfirming ? (
                            <>
                              <span className="text-[10px] text-red-500 font-semibold mr-1 hidden sm:inline">Delete?</span>
                              <Button
                                type="button"
                                variant="destructive-sm"
                                onClick={() => handleDelete(tx.id)}
                                className="transition-colors"
                                title="Confirm delete"
                              >
                                <Check size={12} />
                              </Button>
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                title="Cancel"
                              >
                                <X size={12} />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => openEditModal(tx)}
                                className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all"
                                title="Edit transaction"
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => handleDelete(tx.id)}
                                disabled={isDeleting}
                                className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 transition-all disabled:opacity-50"
                                title="Delete transaction"
                              >
                                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
        open={showModal}
        onOpenChange={(open) => { if (open) setShowModal(true); else closeModal(); }}
        title={editingTx ? "Edit Transaction" : "Record Transaction"}
        className="relative max-h-[90vh] overflow-y-auto"
      >
        <Button
          type="button"
          variant="unstyled"
          onClick={closeModal}
          className="absolute right-6 top-6 p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
        >
          <X size={16} />
        </Button>

        <form onSubmit={handleSubmit} className="space-y-3">
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
              <FieldLabel>Financial Account</FieldLabel>
              <NativeSelect
                required
                value={txForm.accountId}
                onChange={(e) => setTxForm((prev) => ({ ...prev, accountId: e.target.value }))}
              >
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} (₹{a.balance.toLocaleString()})</option>)}
              </NativeSelect>
            </div>
          )}

          {txForm.type === "TRANSFER" && !editingTx && (
            <div className="space-y-1.5">
              <FieldLabel>Target Account</FieldLabel>
              <NativeSelect
                required
                value={txForm.transferToAccountId}
                onChange={(e) => setTxForm((prev) => ({ ...prev, transferToAccountId: e.target.value }))}
              >
                <option value="" disabled>Select Target Account</option>
                {accounts.filter((a) => a.id !== txForm.accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </NativeSelect>
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

          <div className="flex items-center justify-end gap-2 pt-2">
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
