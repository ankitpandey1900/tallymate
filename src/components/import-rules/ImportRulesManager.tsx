"use client";

import React, { useState } from "react";
import { UnifiedCategory, UnifiedIncomeSource } from "@/lib/unified-db";
import { createImportRule, deleteImportRule } from "@/app/actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowRight, FileText, ChevronDown, ChevronUp, AlertCircle, Check } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import { getCategoryIcon } from "@/lib/category-icons";

interface ImportRulesManagerProps {
  initialData: {
    rules: any[];
    categories: UnifiedCategory[];
    incomeSources: UnifiedIncomeSource[];
  };
}

export default function ImportRulesManager({ initialData }: ImportRulesManagerProps) {
  const [rules, setRules] = useState(initialData.rules);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [categoryId, setCategoryId] = useState(initialData.categories[0]?.id || "");
  const [incomeSourceId, setIncomeSourceId] = useState(initialData.incomeSources[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for collapsible rule groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return toast.error("Keyword cannot be empty");
    setIsSubmitting(true);
    try {
      const newRule = await createImportRule({
        matchKeyword: keyword,
        type,
        categoryId: type === "EXPENSE" ? categoryId : undefined,
        incomeSourceId: type === "INCOME" ? incomeSourceId : undefined,
      });
      setRules([newRule, ...rules]);
      setKeyword("");
      toast.success("Rule added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      await deleteImportRule(id);
      setRules(rules.filter((r) => r.id !== id));
      toast.success("Rule deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete rule");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
          Auto-Categorization Rules
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Map specific senders, merchants, or keywords to categories automatically during CSV imports.
        </p>
      </div>

      <div className="bg-white dark:bg-[#141416] border border-black/[0.04] dark:border-white/[0.04] rounded-[24px] shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-neutral-400" />
          Create a New Rule
        </h2>
        
        <form onSubmit={handleAddRule} className="space-y-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-4 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 font-medium leading-normal">
            <span>If a transaction is an</span>
            
            <NativeSelect
              value={type}
              onChange={(e) => setType(e.target.value as "EXPENSE" | "INCOME")}
              className="text-lg sm:text-xl font-bold bg-neutral-100 dark:bg-[#1a1a1c] text-neutral-900 dark:text-neutral-100 border-none rounded-xl px-4 py-2 cursor-pointer shadow-sm hover:ring-2 ring-black/5 dark:ring-white/5 transition-all w-auto inline-block"
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </NativeSelect>
            
            <span>and the description contains</span>
            
            <input
              type="text"
              required
              placeholder="keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full sm:w-64 text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 border-b-2 border-dashed border-blue-200 dark:border-blue-900/50 bg-transparent px-2 py-1 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-blue-300 dark:placeholder:text-blue-900/50"
            />
            
            <span className="hidden sm:inline">,</span>
            
            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
              <span>categorize it as</span>
              
              {type === "EXPENSE" ? (
                <NativeSelect
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="text-lg sm:text-xl font-bold bg-neutral-100 dark:bg-[#1a1a1c] text-neutral-900 dark:text-neutral-100 border-none rounded-xl px-4 py-2 cursor-pointer shadow-sm hover:ring-2 ring-black/5 dark:ring-white/5 transition-all w-auto inline-block"
                >
                  {initialData.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </NativeSelect>
              ) : (
                <NativeSelect
                  value={incomeSourceId}
                  onChange={(e) => setIncomeSourceId(e.target.value)}
                  className="text-lg sm:text-xl font-bold bg-neutral-100 dark:bg-[#1a1a1c] text-neutral-900 dark:text-neutral-100 border-none rounded-xl px-4 py-2 cursor-pointer shadow-sm hover:ring-2 ring-black/5 dark:ring-white/5 transition-all w-auto inline-block"
                >
                  {initialData.incomeSources.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </NativeSelect>
              )}
            </div>
            <span className="hidden sm:inline">.</span>
          </div>

          {keyword.trim().length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">Live Match Preview</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Any future transaction containing &quot;<strong className="bg-blue-200/50 dark:bg-blue-800/50 px-1 rounded">{keyword}</strong>&quot; (not case-sensitive) will automatically be marked as <strong>{type === "EXPENSE" ? initialData.categories.find(c => c.id === categoryId)?.name : initialData.incomeSources.find(s => s.id === incomeSourceId)?.name}</strong>.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" variant="default" className="px-8 gap-2 rounded-xl h-12 text-base shadow-sm" disabled={isSubmitting || !keyword.trim()}>
              <Check size={18} /> Save Rule
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-[#141416] border border-black/[0.04] dark:border-white/[0.04] rounded-[24px] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#1a1a1c]/50">
          <h2 className="font-bold text-neutral-900 dark:text-neutral-100">Active Rules</h2>
        </div>
        {rules.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-neutral-900 dark:text-neutral-100 font-bold mb-2">No rules yet</h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-sm">
              Create rules above to automatically categorize your imported transactions.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {Object.values(
              rules.reduce((acc, rule: any) => {
                const isInc = rule.type === "INCOME";
                const cat: any = isInc
                  ? initialData.incomeSources.find((s) => s.id === rule.incomeSourceId)
                  : initialData.categories.find((c) => c.id === rule.categoryId);
                  
                const catName = cat?.name || "Unknown";
                const color = cat?.color || (isInc ? "#10b981" : "#a3a3a3");
                const groupId = `${rule.type}-${catName}`;
                
                if (!acc[groupId]) {
                  acc[groupId] = {
                    groupId,
                    categoryName: catName,
                    type: rule.type,
                    color,
                    rules: []
                  };
                }
                acc[groupId].rules.push(rule);
                return acc;
              }, {} as Record<string, { groupId: string, categoryName: string, type: string, color: string, rules: any[] }>)
            )
            .sort((a: any, b: any) => a.categoryName.localeCompare(b.categoryName))
            .map((group: any) => {
              const isExpanded = expandedGroups[group.groupId];
              const toggleGroup = () => setExpandedGroups(prev => ({ ...prev, [group.groupId]: !prev[group.groupId] }));
              
              return (
                <div key={group.groupId} className="group/group bg-white dark:bg-[#141416]">
                  {/* Group Header */}
                  <div 
                    onClick={toggleGroup}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-[#1a1a1c]/80 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                        style={{
                          backgroundColor: group.type === 'INCOME' ? 'rgba(16, 185, 129, 0.1)' : `${group.color}15`,
                          color: group.type === 'INCOME' ? '#10b981' : group.color
                        }}
                      >
                        {getCategoryIcon(group.categoryName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-neutral-900 dark:text-neutral-100">{group.categoryName}</h3>
                          <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full border bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">
                            {group.rules.length} RULES
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 font-medium mt-0.5">
                          {group.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-neutral-400 dark:text-neutral-500">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                  
                  {/* Expanded Rules List */}
                  {isExpanded && (
                    <div className="bg-neutral-50/50 dark:bg-[#1a1a1c]/50 border-t border-neutral-100 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/50">
                      {group.rules.map((rule: any) => (
                        <div key={rule.id} className="p-3 sm:px-12 sm:py-3.5 flex items-center justify-between hover:bg-white dark:hover:bg-[#141416] transition-colors group">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono text-neutral-900 dark:text-neutral-100">
                              &quot;{rule.matchKeyword}&quot;
                            </span>
                            <ArrowRight className="hidden sm:block text-neutral-300 dark:text-neutral-700 shrink-0 mx-2" size={14} />
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                              † {group.categoryName}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleDeleteRule(rule.id); }}
                            className="text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8 shrink-0"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
