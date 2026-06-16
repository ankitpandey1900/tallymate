"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Loader2, ArrowRight, Lock, Mail, User } from "lucide-react";
import TallymateLogo from "@/components/TallymateLogo";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === "signin") {
        await signIn.email({
          email,
          password,
          callbackURL: "/dashboard",
        }, {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onSuccess: () => { toast.success("Signed in successfully"); },
          onError: (ctx) => {
            setError(ctx.error.message || "Invalid email or password.");
          }
        });
      } else {
        await signUp.email({
          email,
          password,
          name,
          callbackURL: "/dashboard",
        }, {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onSuccess: () => { toast.success("Account created successfully"); },
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to create account. Please try again.");
          }
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected authentication error occurred.";
      setError(message);
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#09090b]">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#09090b] text-[#09090b] dark:text-[#fafafa] transition-colors duration-200 p-4">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <TallymateLogo size={40} className="text-neutral-900 dark:text-white" />
          <h2 className="text-xl font-bold tracking-tight">Tallymate</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Professional finance management &amp; shared ledgers.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
          <button
            onClick={() => {
              setActiveTab("signin");
              setError(null);
            }}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
              activeTab === "signin"
                ? "bg-white dark:bg-[#18181b] shadow-xs text-black dark:text-white"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            )}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab("signup");
              setError(null);
            }}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
              activeTab === "signup"
                ? "bg-white dark:bg-[#18181b] shadow-xs text-black dark:text-white"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            )}
          >
            Sign Up
          </button>
        </div>

        {/* Main Card */}
        <div className="panel-card p-6 bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-md font-mono border border-rose-100 dark:border-rose-900/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {activeTab === "signup" && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    placeholder="Elon Musk"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-neutral-200 dark:border-neutral-800 rounded-md text-sm bg-transparent outline-hidden focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 dark:border-neutral-800 rounded-md text-sm bg-transparent outline-hidden focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 dark:border-neutral-800 rounded-md text-sm bg-transparent outline-hidden focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-md bg-[#09090b] text-white hover:bg-neutral-800 dark:bg-[#fafafa] dark:text-[#09090b] dark:hover:bg-neutral-200 text-xs font-semibold shadow-xs disabled:opacity-55"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : activeTab === "signin" ? (
                <>
                  Sign In
                  <ArrowRight size={14} />
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
