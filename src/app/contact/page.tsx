"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { sendContactMessage } from "@/app/actions/contact";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await sendContactMessage(formData);

    if (result.success) {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error || "Something went wrong.");
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0c0c0e] text-neutral-900 dark:text-neutral-50 flex flex-col">
      <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0f0f11] flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <ArrowLeft size={16} className="text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
          <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">Back to Home</span>
        </Link>
      </header>
      
      <main className="flex-1 max-w-5xl mx-auto w-full py-16 px-6">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-neutral-900 dark:text-white">Contact Us</h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400">
            Have a question, found incorrect data, or want to suggest a feature? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* Developer Card */}
            <div className="bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Developer</h2>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
                Built and maintained by the Tallymate Team — passionate about making Indian fintech tools accessible to everyone.
              </p>
              
              <div className="space-y-4">
                <a href="https://x.com/AnkitPande5641" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors group">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="opacity-70 group-hover:opacity-100 transition-opacity"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <span className="font-medium">@AnkitPande5641 on X (Twitter)</span>
                </a>
                <a href="https://www.instagram.com/ankit.pandey19/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors group">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  <span className="font-medium">@ankit.pandey19 on Instagram</span>
                </a>
                <a href="https://github.com/ankitpandey1900/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors group">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                  <span className="font-medium">ankitpandey1900 on GitHub</span>
                </a>
              </div>
            </div>

            {/* Report an Issue Card */}
            <div className="bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Report an Issue</h2>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Found a bug or something not working quite right? DM on Twitter or Instagram and we'll fix it within 24 hours.
              </p>
            </div>
            
          </div>

          {/* Right Column - Form */}
          <div className="bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm relative">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Send a Message</h2>
            
            {success ? (
              <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                <p className="text-neutral-500 dark:text-neutral-400">Thanks for reaching out. We'll get back to you soon.</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="mt-6 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-500"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-200 dark:border-red-500/20">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-semibold text-neutral-900 dark:text-white block">
                    Name
                  </label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    required
                    placeholder="Your name" 
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0c0e] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-neutral-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-semibold text-neutral-900 dark:text-white block">
                    Email
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    required
                    placeholder="you@example.com" 
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0c0e] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-neutral-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-sm font-semibold text-neutral-900 dark:text-white block">
                    Message
                  </label>
                  <textarea 
                    id="message" 
                    name="message"
                    required
                    rows={4}
                    placeholder="How can we help?" 
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0c0e] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none placeholder:text-neutral-400"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-bold transition-colors mt-2"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
      
    </div>
  );
}
