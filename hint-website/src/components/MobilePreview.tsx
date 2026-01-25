export function MobilePreview() {
  return (
    <section id="mobile" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--hint-100)] rounded-full text-[var(--hint-700)] text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Coming Soon
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-[var(--foreground)]">hint in your</span>
              <br />
              <span className="gradient-text">pocket</span>
            </h2>
            <p className="text-lg text-[var(--muted)] mb-8 leading-relaxed">
              The hint mobile app is coming soon for iOS and Android. Manage your
              hintlists, capture products on the go, and get notifications right
              on your phone.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "Manage hintlists anywhere",
                "Capture products with your camera",
                "Push notifications for claims & price drops",
                "Syncs with your Chrome extension",
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-[var(--hint-500)] flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[var(--foreground)]">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">Get it on</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </a>
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">
              Join the waitlist to be notified when the app launches.
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            {/* Phone mockup */}
            <div className="relative">
              <div className="w-[280px] h-[580px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="h-12 bg-[var(--hint-500)] flex items-center justify-center">
                    <div className="w-20 h-6 bg-black rounded-full" />
                  </div>
                  {/* App content mockup */}
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--hint-400)] to-[var(--hint-600)] flex items-center justify-center">
                        <span className="text-white text-lg">🎁</span>
                      </div>
                      <div className="font-semibold text-lg">My Hintlists</div>
                    </div>
                    {/* List items */}
                    {[
                      { name: "Birthday Wishlist", count: 12, emoji: "🎂" },
                      { name: "Christmas 2026", count: 8, emoji: "🎄" },
                      { name: "Home Office", count: 5, emoji: "🏠" },
                    ].map((list, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-[var(--hint-50)] rounded-xl mb-3"
                      >
                        <div className="text-2xl">{list.emoji}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{list.name}</div>
                          <div className="text-xs text-[var(--muted)]">{list.count} items</div>
                        </div>
                        <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    ))}
                    {/* Add button */}
                    <button className="w-full mt-4 py-3 bg-gradient-to-r from-[var(--hint-500)] to-[var(--hint-600)] text-white rounded-xl font-medium text-sm">
                      + Create New Hintlist
                    </button>
                  </div>
                </div>
              </div>
              {/* Floating notification */}
              <div className="absolute -right-4 top-32 bg-white rounded-2xl p-4 shadow-xl border border-[var(--hint-100)] w-48 animate-float">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--hint-100)] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[var(--hint-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-[var(--hint-600)]">Price Drop!</span>
                </div>
                <p className="text-xs text-[var(--muted)]">AirPods Pro is now $50 off</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
