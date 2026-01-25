import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--hint-50)] via-white to-white" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--hint-200)] rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--hint-300)] rounded-full blur-3xl opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--hint-100)] rounded-full blur-3xl opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Announcement badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[var(--hint-200)] shadow-sm mb-8 mt-8">
          <span className="w-2 h-2 bg-[var(--hint-500)] rounded-full animate-pulse" />
          <span className="text-sm font-medium text-[var(--hint-700)]">Now with price tracking</span>
          <svg className="w-4 h-4 text-[var(--hint-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="text-[var(--foreground)]">Gift-giving,</span>
          <br />
          <span className="gradient-text">simplified</span>
        </h1>

        {/* Subheading */}
        <p className="text-xl sm:text-2xl text-[var(--muted)] max-w-2xl mx-auto mb-10">
          Create hintlists. Share with friends and family. Let them claim gifts secretly. No more duplicate presents.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="#download"
            className="group px-8 py-4 bg-gradient-to-r from-[var(--hint-500)] to-[var(--hint-600)] text-white rounded-full font-semibold text-lg hover:from-[var(--hint-600)] hover:to-[var(--hint-700)] transition-all shadow-xl shadow-[var(--hint-500)]/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add to Chrome
            <span className="text-white/70 text-sm font-normal">— it&apos;s free</span>
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-4 bg-white text-[var(--foreground)] rounded-full font-semibold text-lg border border-[var(--border)] hover:border-[var(--hint-300)] hover:bg-[var(--hint-50)] transition-all"
          >
            See How It Works
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--hint-500)]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium">No more awkward gift duplicates</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--hint-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium">Claims stay secret</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--hint-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Price drop alerts</span>
          </div>
        </div>

        {/* Hero image/mockup */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative mx-auto max-w-4xl">
            <div className="bg-gradient-to-br from-[var(--hint-100)] to-[var(--hint-200)] rounded-3xl p-8 shadow-2xl border border-[var(--hint-200)]">
              <div className="bg-white rounded-2xl p-6 shadow-inner">
                {/* Browser chrome mockup */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="flex-1 ml-4 h-6 bg-gray-100 rounded-full flex items-center px-3">
                    <span className="text-xs text-gray-400">amazon.com/dp/B09V3KXJPB</span>
                  </div>
                </div>
                {/* Product capture UI mockup */}
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-[var(--hint-50)] to-[var(--hint-100)] rounded-xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-[var(--hint-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-[var(--hint-100)] rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[var(--hint-600)]">$49.99</span>
                      <span className="text-sm text-gray-400 line-through">$79.99</span>
                      <span className="px-2 py-0.5 bg-[var(--hint-100)] text-[var(--hint-700)] text-xs font-medium rounded-full">38% off</span>
                    </div>
                  </div>
                  <button className="self-start px-4 py-2 bg-gradient-to-r from-[var(--hint-500)] to-[var(--hint-600)] text-white rounded-lg font-medium text-sm shadow-lg animate-pulse-glow">
                    + Add to Hintlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
