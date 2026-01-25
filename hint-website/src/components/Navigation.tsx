"use client";

import { useState } from "react";
import Link from "next/link";

const navItems = [
  {
    label: "Features",
    href: "#features",
    submenu: [
      { label: "One-Click Capture", href: "#features" },
      { label: "Secret Claims", href: "#features" },
      { label: "Price Tracking", href: "#features" },
      { label: "Share Anywhere", href: "#features" },
    ],
  },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Retailers", href: "#retailers" },
  { label: "Help", href: "#help" },
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--hint-400)] to-[var(--hint-600)] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <span className="text-2xl text-[var(--hint-600)]" style={{ fontFamily: 'var(--font-logo)' }}>hint</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.submenu && setActiveSubmenu(item.label)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <Link
                  href={item.href}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-medium"
                >
                  {item.label}
                  {item.submenu && (
                    <svg
                      className="inline-block ml-1 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Link>
                {item.submenu && activeSubmenu === item.label && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[var(--border)] py-2">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.label}
                        href={subItem.href}
                        className="block px-4 py-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hint-50)] transition-colors"
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="#download"
              className="px-5 py-2.5 bg-gradient-to-r from-[var(--hint-500)] to-[var(--hint-600)] text-white rounded-full font-medium hover:from-[var(--hint-600)] hover:to-[var(--hint-700)] transition-all shadow-lg shadow-[var(--hint-500)]/25 flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 3.301A7.144 7.144 0 0112 4.286c1.729 0 3.321.614 4.561 1.636l3.776-3.776A11.919 11.919 0 0012 0z"/>
                <path d="M23.143 12c0-.846-.088-1.67-.254-2.465H12v4.659h6.258a5.349 5.349 0 01-2.323 3.513l3.765 2.921c2.19-2.019 3.443-5.001 3.443-8.628z"/>
                <path d="M5.428 14.285a7.159 7.159 0 01-.382-2.285c0-.801.136-1.571.382-2.286L1.475 6.413A11.91 11.91 0 000 12c0 1.939.47 3.769 1.475 5.587l3.953-3.302z"/>
                <path d="M12 24c3.24 0 5.956-1.075 7.94-2.907l-3.765-2.921a7.097 7.097 0 01-4.175 1.256c-3.334 0-6.158-2.253-7.16-5.285L1.475 17.587C3.675 22.227 7.59 24 12 24z"/>
              </svg>
              Add to Chrome
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[var(--hint-50)] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[var(--border)]">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block py-3 text-[var(--muted)] hover:text-[var(--foreground)] font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="#download"
              className="mt-4 block w-full text-center px-5 py-2.5 bg-gradient-to-r from-[var(--hint-500)] to-[var(--hint-600)] text-white rounded-full font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Add to Chrome
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
