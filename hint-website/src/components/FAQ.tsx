"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How does secret claiming work?",
    answer: "When someone claims an item from your hintlist, you'll only see that an item has been claimed—not who claimed it. This keeps the surprise intact while preventing duplicate gifts. The claimer can also unclaim if plans change.",
  },
  {
    question: "Do my friends need an account to claim gifts?",
    answer: "No! Anyone can view your shared hintlist and claim items as a guest. They just enter their name and email so you can thank them later. No sign-up required.",
  },
  {
    question: "What stores does hint support?",
    answer: "hint works with 20+ major retailers including Amazon, Target, Walmart, Best Buy, Nordstrom, REI, Nike, Apple, Costco, Macy's, Kohl's, Crate & Barrel, Pottery Barn, Williams Sonoma, Patagonia, Adidas, and more. You can also manually add items from any website.",
  },
  {
    question: "Is hint free?",
    answer: "Yes! hint is completely free to use. Create unlimited hintlists, add unlimited items, and share with unlimited friends. No premium tiers, no hidden fees.",
  },
  {
    question: "How does price tracking work?",
    answer: "hint automatically monitors prices for items on your hintlist. Set a target price and we'll email you when the price drops. You can also view price history to see trends over time.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. We use industry-standard encryption and never sell your data. Your hintlists are private by default—only people you share with can see them. You can export or delete your data anytime.",
  },
  {
    question: "Can I use hint for group gifts?",
    answer: "Yes! Share a hintlist for a group event like a wedding or baby shower. Multiple people can claim different items, and everyone stays coordinated without spoiling surprises.",
  },
  {
    question: "What about key date reminders?",
    answer: "Add birthdays, holidays, or any special date to your hintlists. We'll remind your friends 60, 30, and 15 days before so they have time to shop and ship.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-[var(--hint-50)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-[var(--foreground)]">Frequently asked</span>{" "}
            <span className="gradient-text">questions</span>
          </h2>
          <p className="text-lg text-[var(--muted)]">
            Everything you need to know about hint
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden"
            >
              <button
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-[var(--hint-50)] transition-colors cursor-pointer"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-semibold text-[var(--foreground)]" id={`faq-question-${index}`}>
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-[var(--hint-500)] flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div id={`faq-answer-${index}`} className="px-6 pb-5" role="region" aria-labelledby={`faq-question-${index}`}>
                  <p className="text-[var(--muted)] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[var(--muted)] mb-4">Still have questions?</p>
          <a
            href="mailto:support@hint.gift"
            className="inline-flex items-center gap-2 text-[var(--hint-600)] font-medium hover:text-[var(--hint-700)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
