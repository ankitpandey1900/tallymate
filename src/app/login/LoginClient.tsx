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
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#09090b] text-[#09090b] dark:text-[#fafafa] transition-colors duration-200 p-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <TallymateLogo size={40} className="text-neutral-900 dark:text-white" />
          <h2 className="text-xl font-bold tracking-tight">Tallymate</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Track spending, split bills, and stay on budget — together.
          </p>
        </div>

        <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
          <Button
            type="button"
            variant={activeTab === "signin" ? "auth-tab-active" : "auth-tab-inactive"}
            onClick={() => {
              setActiveTab("signin");
              setError(null);
            }}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={activeTab === "signup" ? "auth-tab-active" : "auth-tab-inactive"}
            onClick={() => {
              setActiveTab("signup");
              setError(null);
            }}
          >
            Sign Up
          </Button>
        </div>

        <div className="panel-card p-6 bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-md border border-rose-100 dark:border-rose-900/30">
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
                className="w-full gap-2 py-2.5 font-semibold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-white dark:bg-[#18181b] px-2 text-neutral-400">or use email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {activeTab === "signup" && (
              <div className="space-y-1">
                <FieldLabel className="tracking-wider">Full Name</FieldLabel>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <Input
                    type="text"
                    required
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={loginInputClass}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <FieldLabel className="tracking-wider">Email Address</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={loginInputClass}
                />
              </div>
            </div>

            <div className="space-y-1">
              <FieldLabel className="tracking-wider">Password</FieldLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={loginInputClass}
                />
              </div>
            </div>

            <Button type="submit" variant="auth-submit" disabled={loading}>
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
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
