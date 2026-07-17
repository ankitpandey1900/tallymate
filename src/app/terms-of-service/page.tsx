import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Tallymate Terms of Service. Learn about your rights and responsibilities when using our platform.",
  alternates: {
    canonical: "https://tallymate.alltracker.online/terms-of-service",
  },
};
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import TallymateLogo from "@/components/TallymateLogo";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0c0c0e] text-neutral-900 dark:text-neutral-50 flex flex-col">
      <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0f0f11] flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <ArrowLeft size={16} className="text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
          <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">Back to Home</span>
        </Link>
      </header>
      
      <main className="flex-1 max-w-3xl mx-auto w-full py-16 px-6">
        <div className="mb-12">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 border border-blue-100 dark:border-blue-500/20">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-neutral-900 dark:text-white">Terms of Service</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Last updated: June 2026</p>
        </div>

        <div className="space-y-10 text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Tallymate (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">2. Description of Service</h2>
            <p>
              Tallymate is a personal finance and bill-splitting application that allows you to manually track your spending, set budgets, and manage shared group expenses. The Service is provided &quot;as is&quot; and relies on the accuracy of the data you input.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">4. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding content provided by you), features, and functionality are and will remain the exclusive property of Tallymate and its licensors. The Service is protected by copyright, trademark, and other laws of both the country and foreign countries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">5. Termination</h2>
            <p>
              We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">6. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>
          
          <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">
              If you have any questions about these Terms, please contact us at support@tallymate.app.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="py-8 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <TallymateLogo size={16} className="text-neutral-400" />
            <span className="text-xs font-semibold text-neutral-400">© 2026 Tallymate</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
