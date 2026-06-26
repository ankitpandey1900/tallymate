"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Is Tallymate really free?",
      answer: "Yes, Tallymate's core features—including budgeting and bill splitting—are entirely free to use with no hidden fees or ads."
    },
    {
      question: "How does the 'Split a Bill' feature work?",
      answer: "When you record a shared expense, you can split it equally, by percentage, or custom amounts. Tallymate automatically deducts your portion from your personal budget, and records the rest as pending money your friends owe you."
    },
    {
      question: "Is my financial data secure?",
      answer: "Absolutely. We use bank-level AES-256 encryption for data at rest and TLS 1.3 for data in transit. We never sell your data to third parties."
    },
    {
      question: "Can I connect my bank accounts?",
      answer: "Currently, Tallymate is a manual entry and import-based system. We believe manual entry promotes better financial mindfulness, but automatic bank syncing is on our roadmap for future premium tiers."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Tallymate is designed as a responsive web app, which means it works perfectly on your mobile browser. Native iOS and Android apps are currently in development."
    },
    {
      question: "Can I use Tallymate with different currencies?",
      answer: "Yes! You can choose your default currency in your settings, and when you create a group for bill splitting, you can choose a specific currency for that group."
    },
    {
      question: "How do I settle up with friends?",
      answer: "Tallymate calculates the simplest way for everyone to pay each other back. When someone pays you (via cash, UPI, or bank transfer), you just tap 'Mark as paid' in the app to clear the debt."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index} 
            className="border border-black/[0.06] dark:border-neutral-800 rounded-2xl bg-white dark:bg-[#111113] overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
            >
              <span className="font-semibold text-neutral-900 dark:text-white text-lg">
                {faq.question}
              </span>
              <ChevronDown 
                className={`text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <p className="px-6 pb-6 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
