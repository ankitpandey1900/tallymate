import React from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import TallymateLogo from "@/components/TallymateLogo";

export default function PrivacyPolicyPage() {
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
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 border border-emerald-100 dark:border-emerald-500/20">
            <Lock size={24} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-neutral-900 dark:text-white">Privacy Policy</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Last updated: June 2026</p>
        </div>

        <div className="space-y-10 text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <section>
            <p className="font-medium text-neutral-900 dark:text-white text-lg">
              At Tallymate, we take your privacy seriously. We believe that your financial data is your business, and our primary goal is to provide a tool that helps you manage it without compromising your security or privacy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">1. Information We Collect</h2>
            <p className="mb-3">We only collect information that is absolutely necessary to provide you with the Service:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Account Information:</strong> Your name and email address when you sign up.</li>
              <li><strong>Financial Data:</strong> Transactions, budgets, and group data that you manually enter into the app.</li>
              <li><strong>Usage Data:</strong> Basic, anonymized analytics to help us understand how the app is used and how we can improve it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">2. How We Use Your Information</h2>
            <p className="mb-3">We use your information strictly for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>To provide, maintain, and improve the Tallymate application.</li>
              <li>To manage your account and provide customer support.</li>
              <li>To securely calculate your net worth, budgets, and bill splits.</li>
            </ul>
            <p className="mt-4 font-semibold text-emerald-600 dark:text-emerald-400">
              We never sell, rent, or share your personal or financial information with third-party marketers or data brokers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">3. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. All data is encrypted in transit using TLS 1.3 and encrypted at rest using AES-256. Our authentication system relies on secure, HTTP-only cookies to prevent unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">4. Your Rights</h2>
            <p>
              You have full control over your data. You can access, update, or delete your account and all associated financial data at any time from your Account Settings. Once deleted, your data is permanently removed from our active servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">5. Contact Us</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy, please reach out to our privacy team at privacy@tallymate.app.
            </p>
          </section>
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
