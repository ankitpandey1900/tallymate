"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { toast } from "@/lib/toast";
import { Loader2, ArrowRight, Lock, Mail, User } from "lucide-react";
import TallymateLogo from "@/components/TallymateLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field-label";
import { loginInputClass } from "@/components/ui/app-styles";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  const messages: Record<string, string> = {
    account_not_linked:
      "This email already has an account. Sign in with email and password, or try Google again to link your accounts.",
    email_doesnt_match: "Google email doesn't match your account email.",
    signup_disabled: "Sign up is disabled for this provider.",
    internal_server_error: "Something went wrong on our side. Please try again.",
  };
  return messages[code] ?? `Sign-in failed (${code.replace(/_/g, " ")}). Please try again.`;
}

export default function LoginClient({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    const description = searchParams.get("error_description");
    if (oauthError) {
      setError(description || oauthErrorMessage(oauthError));
      window.history.replaceState({}, "", "/login");
    }
  }, [searchParams, router]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn.social(
        {
          provider: "google",
          callbackURL: "/dashboard",
        },
        {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onSuccess: () => {
            toast.success("Signed in with Google");
          },
          onError: (ctx) => {
            setError(ctx.error.message || "Google sign-in failed. Check your credentials and redirect URI.");
          },
        }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed.";
      setError(message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === "signin") {
        await signIn.email(
          {
            email,
            password,
            callbackURL: "/dashboard",
          },
          {
            onRequest: () => setLoading(true),
            onResponse: () => setLoading(false),
            onSuccess: () => {
              toast.success("Signed in successfully");
            },
            onError: (ctx) => {
              setError(ctx.error.message || "Invalid email or password.");
            },
          }
        );
      } else {
        await signUp.email(
          {
            email,
            password,
            name,
            callbackURL: "/dashboard",
          },
          {
            onRequest: () => setLoading(true),
            onResponse: () => setLoading(false),
            onSuccess: () => {
              toast.success("Account created successfully");
            },
            onError: (ctx) => {
              setError(ctx.error.message || "Failed to create account. Please try again.");
            },
          }
        );
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
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#000000] text-[#09090b] dark:text-[#fafafa] selection:bg-emerald-500/30 p-4 relative overflow-hidden">
      {/* Extremely subtle professional grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-[380px] space-y-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-center">
            <TallymateLogo size={32} className="text-neutral-900 dark:text-white" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              {activeTab === "signin" ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
              {activeTab === "signin" 
                ? "Enter your details to access your dashboard." 
                : "Track spending and stay on budget — together."}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800/80 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
          <div className="flex p-1 bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-neutral-100 dark:border-neutral-800/50">
            <button
              type="button"
              className={`flex-1 text-[13px] font-medium py-2 rounded-md transition-all ${
                activeTab === "signin" 
                  ? "bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white shadow-sm border border-neutral-200/50 dark:border-neutral-800" 
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
              onClick={() => { setActiveTab("signin"); setError(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 text-[13px] font-medium py-2 rounded-md transition-all ${
                activeTab === "signup" 
                  ? "bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white shadow-sm border border-neutral-200/50 dark:border-neutral-800" 
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
              onClick={() => { setActiveTab("signup"); setError(null); }}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 text-[13px] font-medium bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            {googleEnabled && (
              <>
                <Button
                  type="button"
                  variant="outline-app"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="w-full h-10 gap-2 font-medium text-[14px] bg-white dark:bg-[#111] hover:bg-neutral-50 dark:hover:bg-[#161616] transition-colors border-neutral-200 dark:border-neutral-800 rounded-lg"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" /> : <GoogleIcon />}
                  Continue with Google
                </Button>
                
                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-100 dark:border-neutral-800/80" />
                  </div>
                  <span className="relative bg-white dark:bg-[#0a0a0a] px-3 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                    Or continue with email
                  </span>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "signup" && (
                <div className="space-y-1.5">
                  <FieldLabel className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300">Full Name</FieldLabel>
                  <div className="relative group">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 group-focus-within:text-neutral-600 dark:group-focus-within:text-neutral-300 transition-colors" />
                    <Input
                      type="text"
                      required
                      placeholder="Sachin Yadav"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 pl-9 bg-transparent border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <FieldLabel className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300">Email Address</FieldLabel>
                <div className="relative group">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 group-focus-within:text-neutral-600 dark:group-focus-within:text-neutral-300 transition-colors" />
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 pl-9 bg-transparent border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300">Password</FieldLabel>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 group-focus-within:text-neutral-600 dark:group-focus-within:text-neutral-300 transition-colors" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pl-9 bg-transparent border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="cta"
                disabled={loading}
                className="w-full h-10 mt-2 font-medium text-[14px] bg-neutral-900 hover:bg-neutral-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-neutral-950 transition-colors rounded-lg shadow-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {activeTab === "signin" ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
        <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-500">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
