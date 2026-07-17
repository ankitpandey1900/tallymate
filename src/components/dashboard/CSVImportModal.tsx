"use client";

import React, { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { FieldLabel } from "@/components/ui/field-label";
import { UnifiedAccount, UnifiedCategory, UnifiedIncomeSource } from "@/lib/unified-db";
import { bulkCreateTransactions, parsePDFStatement } from "@/app/actions";
import { toast, toastError } from "@/lib/toast";
import { UploadCloud, AlertCircle, X, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: UnifiedAccount[];
  categories: UnifiedCategory[];
  incomeSources: UnifiedIncomeSource[];
  importRules: any[];
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
}

export function CSVImportModal({ open, onOpenChange, accounts, categories, incomeSources, importRules }: CSVImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferKeywords, setTransferKeywords] = useState("self, credit card, transfer");

  // Keep selectedAccountId in sync if accounts change (e.g. account deleted and recreated)
  useEffect(() => {
    if (!accounts.find(a => a.id === selectedAccountId)) {
      setSelectedAccountId(accounts[0]?.id || "");
    }
  }, [accounts, selectedAccountId]);

  // Do not default to the first category/income source for generic imports
  const defaultExpenseCategory = undefined;
  const defaultIncomeSource = undefined;

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setError(null);
    setIsSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isSubmitting) return; // Prevent closing while submitting
    if (!newOpen) resetState();
    onOpenChange(newOpen);
  };

  const processFile = async (file: File) => {
    setFile(file);
    setError(null);

    // If it's a PDF, send it to the server
    if (file.name.toLowerCase().endsWith('.pdf')) {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const parsedTxs = await parsePDFStatement(formData);
        
        if (parsedTxs.length === 0) {
          setError("Could not find any valid transactions in this PDF. Note: This experimental feature only works on unlocked PDFs with standard table layouts.");
        } else {
          setParsedData(parsedTxs);
        }
      } catch (err: any) {
        setError(err.message || "Failed to parse PDF on the server.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    // Otherwise, assume CSV and parse locally
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        
        if (rows.length === 0) {
          setError("The CSV file is empty.");
          return;
        }

        // Scan the first 30 rows to find the headers
        let headerRowIdx = -1;
        let dateColIdx = -1;
        let descColIdx = -1;
        let amountColIdx = -1;
        let debitColIdx = -1;
        let creditColIdx = -1;

        for (let i = 0; i < Math.min(rows.length, 30); i++) {
          const row = rows[i].map(c => String(c).toLowerCase().trim());
          
          const dIdx = row.findIndex(c => c === "date" || c === "transaction date" || c === "value date" || c === "time" || c.includes("date") || c.includes("posted"));
          const descIdx = row.findIndex(c => c.includes("description") || c.includes("narration") || c.includes("details") || c.includes("particulars") || c.includes("notes") || c.includes("merchant") || c.includes("payee"));

          const aIdx = row.findIndex(c => c === "amount" || c === "value" || c === "transaction amount");
          const dbIdx = row.findIndex(c => c.includes("debit") || c.includes("withdrawal"));
          const crIdx = row.findIndex(c => c.includes("credit") || c.includes("deposit"));

          if (dIdx !== -1 && descIdx !== -1) {
            headerRowIdx = i;
            dateColIdx = dIdx;
            descColIdx = descIdx;
            amountColIdx = aIdx;
            debitColIdx = dbIdx;
            creditColIdx = crIdx;
            break;
          }
        }

        if (headerRowIdx === -1) {
          setError(`Could not find a valid header row containing Date and Description in the first 30 lines. Found: ${rows[0].join(", ")}`);
          return;
        }

        const parsedTxs: ParsedTransaction[] = [];

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          const rawDate = row[dateColIdx];
          const rawDesc = row[descColIdx];
          
          if (!rawDate || rawDate.trim() === "") continue;

          let cleanAmount = NaN;
          let isIncome = false;
          
          if (amountColIdx !== -1 && row[amountColIdx]) {
            const num = parseFloat(row[amountColIdx].toString().replace(/[^0-9.-]+/g, ""));
            if (!isNaN(num) && Math.abs(num) < 10000000) {
               cleanAmount = Math.abs(num);
               isIncome = num > 0;
            }
          } else {
            const dbStr = debitColIdx !== -1 ? String(row[debitColIdx]).trim() : "";
            const crStr = creditColIdx !== -1 ? String(row[creditColIdx]).trim() : "";
            
            const dbAmt = dbStr && dbStr !== "-" && !/[a-zA-Z]/.test(dbStr) ? parseFloat(dbStr.replace(/[^0-9.-]+/g, "")) : NaN;
            const crAmt = crStr && crStr !== "-" && !/[a-zA-Z]/.test(crStr) ? parseFloat(crStr.replace(/[^0-9.-]+/g, "")) : NaN;
            
            if (!isNaN(crAmt) && crAmt > 0 && crAmt < 10000000) {
               cleanAmount = crAmt;
               isIncome = true;
            } else if (!isNaN(dbAmt) && dbAmt > 0 && dbAmt < 10000000) {
               cleanAmount = dbAmt;
               isIncome = false;
            }
          }

          if (isNaN(cleanAmount) || cleanAmount === 0) continue;

          // Try to format date to ISO
          let parsedDate = new Date(rawDate);
        
          // Handle DD-MM-YYYY or DD/MM/YYYY which is common in Indian banks (e.g. Kotak)
          if (rawDate && (rawDate.includes("-") || rawDate.includes("/"))) {
            const parts = rawDate.split(/[-/]/);
            if (parts.length === 3) {
              const part0 = parseInt(parts[0], 10);
              const part1 = parseInt(parts[1], 10);
              const part2 = parseInt(parts[2], 10);
              
              if (part1 <= 12 && part0 <= 31 && part2 > 2000) {
                parsedDate = new Date(part2, part1 - 1, part0);
              }
            }
          }
          
          if (isNaN(parsedDate.getTime())) parsedDate = new Date();

          const type = isIncome ? "INCOME" : "EXPENSE";
          
          const y = parsedDate.getFullYear();
          const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const d = String(parsedDate.getDate()).padStart(2, '0');
          
          parsedTxs.push({
            date: `${y}-${m}-${d}`,
            description: rawDesc ? String(rawDesc).trim() : "Unknown Transaction",
            amount: cleanAmount,
            type
          });
        }

        if (parsedTxs.length === 0) {
          setError("Could not find any valid transactions in this file. Please check the amount formatting.");
          return;
        }

        setParsedData(parsedTxs);
      },
      error: (err) => {
        setError("Error parsing CSV: " + err.message);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0 || !selectedAccountId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = parsedData.map(tx => {
        // Clean up ugly bank/UPI descriptions to make them beautiful and human-readable
        // Advanced Universal Bank Description Cleaner
        let finalDescription = tx.description;
        
        const cleanBankDescription = (desc: string) => {
          const cleaned = desc.trim();
          
          // POS handling is somewhat unique
          if (cleaned.toUpperCase().startsWith("POS ") || cleaned.toUpperCase().startsWith("POS/")) {
            const starIdx = cleaned.indexOf("*");
            if (starIdx !== -1) {
              return cleaned.substring(starIdx + 1).trim();
            } else {
              const parts = cleaned.split(" ");
              return parts.length > 2 ? parts.slice(2).join(" ").trim() : cleaned;
            }
          }
          
          const junkRegex = /\b(UPI|NEFT|IMPS|RTGS|DR|CR|P2A|P2M|BIL|INB|IFT|ACH|ECS|CHQ|TXN|REF|WDL|PUR|INF|REV|CMS|POS|IB|MB|MMT)\b/gi;
          const name = cleaned.replace(junkRegex, '');
          
          const tokens = name.split(/[\/\-\*\s,]+/).filter(t => {
            const token = t.trim();
            if (token.length === 0) return false;
            if (/^\d+$/.test(token)) return false;
            if (/^[A-Z0-9]{6,25}$/i.test(token) && /\d/.test(token)) return false;
            return true;
          });
          
          if (tokens.length > 0) {
             return tokens.join(' ').replace(/\s+/g, ' ').trim();
          }
          
          return cleaned; // Fallback
        };

        finalDescription = cleanBankDescription(finalDescription);
        
        // Convert TO TITLE CASE (e.g., "HOTEL AMANTRAN" -> "Hotel Amantran")
        finalDescription = finalDescription.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ').trim();

        let currentType = tx.type;
        let matchedCategoryId: string | undefined = defaultExpenseCategory;
        let matchedIncomeId: string | undefined = defaultIncomeSource;

        const descLower = finalDescription.toLowerCase();

        // 1. Check Custom Import Rules FIRST
        const matchedRule = importRules?.find(rule => 
          rule.type === currentType && descLower.includes(rule.matchKeyword.toLowerCase())
        );

        if (matchedRule) {
          if (currentType === "EXPENSE" && matchedRule.categoryId) {
            matchedCategoryId = matchedRule.categoryId;
          } else if (currentType === "INCOME" && matchedRule.incomeSourceId) {
            matchedIncomeId = matchedRule.incomeSourceId;
          }
        }

        // 2. Fallback to AI / Fuzzy Matching
        if (currentType === "EXPENSE" && !matchedRule) {
          const desc = descLower;
          const categoryMatch = categories.find(c => {
            const catName = c.name.toLowerCase();
            if (catName.includes("food") || catName.includes("dining") || catName.includes("eat")) {
                if (descLower.includes("swiggy") || descLower.includes("zomato") || descLower.includes("restaurant") || descLower.includes("hotel") || descLower.includes("cafe") || descLower.includes("food") || descLower.includes("mess") || descLower.includes("dhaba") || descLower.includes("bakery") || descLower.includes("sweets")) return true;
            }
            if (catName.includes("grocer") || catName.includes("mart") || catName.includes("blinkit") || catName.includes("zepto")) {
                if (desc.includes("grocery") || desc.includes("kirana") || desc.includes("supermarket") || desc.includes("mart") || desc.includes("dairy") || desc.includes("dmart") || desc.includes("blinkit") || desc.includes("zepto") || desc.includes("instamart") || desc.includes("bigbasket")) return true;
            }
            if (catName.includes("health") || catName.includes("medic") || catName.includes("pharm")) {
                if (desc.includes("medical") || desc.includes("pharmacy") || desc.includes("hospital") || desc.includes("clinic") || desc.includes("apollo") || desc.includes("medplus")) return true;
            }
            if (catName.includes("transport") || catName.includes("travel") || catName.includes("commute")) {
                if (desc.includes("uber") || desc.includes("ola") || desc.includes("petrol") || desc.includes("fuel") || desc.includes("irctc") || desc.includes("rapido") || desc.includes("auto") || desc.includes("metro") || desc.includes("railway") || desc.includes("train") || desc.includes("bus") || desc.includes("mira bhayander") || desc.includes("ticket") || desc.includes("flight")) return true;
            }
            if (catName.includes("shop") || catName.includes("clothing")) {
                if (desc.includes("amazon") || desc.includes("flipkart") || desc.includes("myntra") || desc.includes("paytm") || desc.includes("ajio") || desc.includes("meesho")) return true;
            }
            if (catName.includes("utilit") || catName.includes("bill") || catName.includes("recharge")) {
                if (desc.includes("recharge") || desc.includes("jio") || desc.includes("airtel") || desc.includes("electricity") || desc.includes("bill") || desc.includes("bescom") || desc.includes("bsnl")) return true;
            }
            if (catName.includes("entertain") || catName.includes("fun") || catName.includes("movie")) {
                if (desc.includes("netflix") || desc.includes("spotify") || desc.includes("bookmyshow") || desc.includes("movie") || desc.includes("prime") || desc.includes("hotstar")) return true;
            }
            if (catName.includes("rent") || catName.includes("home")) {
                if (desc.includes("rent") || desc.includes("deposit") || desc.includes("maintenance")) return true;
            }
            // Exact match fallback
            return desc.includes(catName);
          });
          
          if (categoryMatch) {
            matchedCategoryId = categoryMatch.id;
          } else {
             matchedCategoryId = undefined;
          }
        } else if (currentType === "INCOME" && !matchedIncomeId) {
          const desc = descLower;
          const incomeMatch = incomeSources.find(s => {
            const srcName = s.name.toLowerCase();
            if (srcName.includes("salary") || srcName.includes("pay") || srcName.includes("wage")) {
              if (desc.includes("salary") || desc.includes("payroll") || desc.includes("stipend") || desc.includes("bonus")) return true;
            }
            if (srcName.includes("interest") || srcName.includes("dividend") || srcName.includes("return")) {
              if (desc.includes("interest") || desc.includes("int.pd") || desc.includes("dividend") || desc.includes("fd ")) return true;
            }
            if (srcName.includes("cashback") || srcName.includes("reward") || srcName.includes("refund")) {
              if (desc.includes("cashback") || desc.includes("reward") || desc.includes("refund") || desc.includes("reversal") || desc.includes("promo")) return true;
            }
            if (srcName.includes("freelance") || srcName.includes("business") || srcName.includes("client")) {
              if (desc.includes("upwork") || desc.includes("fiverr") || desc.includes("payout") || desc.includes("settlement")) return true;
            }
            // Exact match fallback
            return desc.includes(srcName);
          });
          if (incomeMatch) {
            matchedIncomeId = incomeMatch.id;
          }
        }

        // 3. Detect internal transfers
        if (transferKeywords.trim()) {
            const keywords = transferKeywords.split(",").map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
            if (keywords.some(k => descLower.includes(k))) {
              currentType = "TRANSFER";
              matchedCategoryId = undefined;
              matchedIncomeId = undefined;
            }
        }

        return {
          accountId: selectedAccountId,
          type: currentType,
          scope: "PERSONAL" as const,
          amount: tx.amount,
          date: tx.date,
          description: finalDescription,
          tags: ["Imported"],
          categoryId: currentType === "EXPENSE" ? matchedCategoryId : undefined,
          incomeSourceId: currentType === "INCOME" ? matchedIncomeId : undefined,
        };
      });

      await bulkCreateTransactions(payload);
      
      toast.success(`Successfully imported ${parsedData.length} transactions!`);
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to import transactions");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDialog open={open} onOpenChange={handleOpenChange} title="Import CSV Transactions">
      <div className="space-y-5">
        <div className="space-y-1.5">
          <FieldLabel>Select Account</FieldLabel>
          <NativeSelect
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            disabled={isSubmitting}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency} {acc.balance.toLocaleString('en-IN')})
              </option>
            ))}
          </NativeSelect>
        </div>

        {!file ? (
          <div 
            className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-10 h-10 text-neutral-400 mb-3" />
            <h3 className="text-sm font-semibold mb-1">Click to upload Statement</h3>
            <p className="text-xs text-neutral-500 max-w-[250px]">
              Accepts .csv or .pdf (experimental).
            </p>
            <input 
              type="file" 
              accept=".csv,.pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {isSubmitting && parsedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-3 border border-neutral-200 dark:border-neutral-800 rounded-md">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <p className="text-sm text-neutral-500">Parsing document securely on server...</p>
              </div>
            ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="truncate text-sm font-medium">{file.name}</div>
              </div>
              <button 
                onClick={() => resetState()} 
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-md"
                disabled={isSubmitting}
              >
                <X size={16} />
              </button>
            </div>

            {error ? (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-4 w-full">
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Found {parsedData.length} valid transactions ready to import.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
                      <FieldLabel className="text-blue-900 dark:text-blue-100">Identify Internal Transfers</FieldLabel>
                      <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 pb-1">
                        Transactions matching these keywords will be marked as &quot;TRANSFER&quot; instead of Income/Expense so they don&apos;t inflate your yearly totals.
                      </p>
                      <Input 
                        value={transferKeywords} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                           setTransferKeywords(e.target.value);
                           // Re-process the file to apply new keywords immediately
                           if (file) processFile(file);
                        }}
                        placeholder="e.g. self, credit card, your name"
                        className="bg-white/50 dark:bg-black/20"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border border-black/[0.04] dark:border-white/[0.04] rounded-xl overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-neutral-50 dark:bg-neutral-900 sticky top-0 border-b border-neutral-100 dark:border-neutral-800">
                        <tr>
                          <th className="p-2 font-medium">Date</th>
                          <th className="p-2 font-medium">Description</th>
                          <th className="p-2 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {parsedData.slice(0, 50).map((tx, i) => (
                          <tr key={i}>
                            <td className="p-2 text-neutral-500 whitespace-nowrap">{tx.date}</td>
                            <td className="p-2 truncate max-w-[150px]">{tx.description}</td>
                            <td className={`p-2 text-right font-medium whitespace-nowrap ${tx.type === "INCOME" ? "text-emerald-500" : tx.type === "TRANSFER" ? "text-blue-500" : ""}`}>
                              {tx.type === "INCOME" ? "+" : tx.type === "TRANSFER" ? "⇄" : "-"}₹{tx.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {parsedData.length > 50 && (
                  <p className="text-xs text-center text-neutral-500 italic">Showing first 50 rows</p>
                )}
              </div>
            )}
            </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="cancel" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="submit" 
            onClick={handleImport} 
            disabled={!file || !!error || parsedData.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Importing..." : `Import ${parsedData.length || ""} Transactions`}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
}
