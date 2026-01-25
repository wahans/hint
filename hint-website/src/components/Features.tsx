/* eslint-disable @next/next/no-img-element */
const retailers = [
  { name: "Amazon", logo: "/logos/amazon.png", height: "h-6" },
  { name: "Target", logo: "/logos/target.png", height: "h-10" },
  { name: "Walmart", logo: "/logos/walmart.png", height: "h-8" },
  { name: "Best Buy", logo: "/logos/bestbuy.png", height: "h-6" },
  { name: "Nike", logo: "/logos/nike.svg", height: "h-8" },
  { name: "Apple", logo: "/logos/apple.svg", height: "h-7" },
  { name: "REI", logo: "/logos/rei.png", height: "h-8" },
];

const features = [
  {
    title: "One-Click Capture",
    description: "Save products from Amazon, Target, Walmart, and 20+ retailers with a single click. Price, image, and details captured automatically.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    gradient: "from-[var(--accent-mint)] to-[var(--hint-100)]",
    iconBg: "bg-[var(--hint-500)]",
  },
  {
    title: "Secret Claims",
    description: "Friends and family can claim items secretly. You'll see how many items are claimed, but never who claimed what. No ruined surprises.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    gradient: "from-[var(--accent-teal)] to-[var(--hint-100)]",
    iconBg: "bg-[var(--hint-600)]",
  },
  {
    title: "Price Tracking",
    description: "Set target prices and get notified when items drop. Never miss a deal on your wishlist. Track price history over time.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    gradient: "from-[var(--accent-lime)] to-[var(--hint-100)]",
    iconBg: "bg-[var(--hint-700)]",
  },
  {
    title: "Share Anywhere",
    description: "Share your hintlist with a simple link or QR code. Guests can view and claim without creating an account.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    gradient: "from-[var(--accent-emerald)] to-[var(--hint-100)]",
    iconBg: "bg-[var(--hint-500)]",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Create a Hintlist",
    description: "Name it for any occasion—birthday, holiday, wedding, or just because.",
  },
  {
    step: "2",
    title: "Add Items",
    description: "Browse any store. Click the hint button to save products instantly.",
  },
  {
    step: "3",
    title: "Share Your Link",
    description: "Send your unique link to friends and family via text, email, or social.",
  },
  {
    step: "4",
    title: "Get Surprised",
    description: "They claim gifts secretly. You get exactly what you wanted.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-[var(--foreground)]">The smart way to</span>
            <br />
            <span className="gradient-text">share wishlists</span>
          </h2>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            No more spreadsheets, group texts, or duplicate gifts. hint makes gift coordination effortless.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card rounded-3xl p-8 bg-gradient-to-br ${feature.gradient} border border-[var(--hint-100)] cursor-pointer`}
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} text-white flex items-center justify-center mb-6 shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                {feature.title}
              </h3>
              <p className="text-[var(--muted)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* How it works section */}
        <div id="how-it-works" className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-[var(--foreground)]">How </span>
              <span className="gradient-text">hint</span>
              <span className="text-[var(--foreground)]"> works</span>
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Four simple steps to perfect gift-giving
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--hint-400)] to-[var(--hint-600)] text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  {item.title}
                </h3>
                <p className="text-[var(--muted)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Retailers section */}
        <div id="retailers" className="mt-32">
          <div className="text-center mb-12">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Works with your favorite stores
            </h3>
            <p className="text-[var(--muted)]">
              20+ major retailers supported, with more added regularly
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-14">
            {retailers.map((retailer) => (
              <div
                key={retailer.name}
                className="opacity-50 hover:opacity-100 transition-opacity duration-300"
              >
                <img
                  src={retailer.logo}
                  alt={retailer.name}
                  className={`${retailer.height} w-auto`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* CTA section */}
        <div id="download" className="mt-32 bg-gradient-to-r from-[var(--hint-500)] to-[var(--hint-600)] rounded-3xl p-8 lg:p-12 text-white">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                Ready to simplify gift-giving?
              </h3>
              <p className="text-white/80 text-lg mb-6">
                Join thousands of families who use hint for birthdays, holidays, and special occasions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[var(--hint-600)] rounded-full font-semibold hover:bg-[var(--hint-50)] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 3.301A7.144 7.144 0 0112 4.286c1.729 0 3.321.614 4.561 1.636l3.776-3.776A11.919 11.919 0 0012 0z"/>
                    <path d="M23.143 12c0-.846-.088-1.67-.254-2.465H12v4.659h6.258a5.349 5.349 0 01-2.323 3.513l3.765 2.921c2.19-2.019 3.443-5.001 3.443-8.628z"/>
                    <path d="M5.428 14.285a7.159 7.159 0 01-.382-2.285c0-.801.136-1.571.382-2.286L1.475 6.413A11.91 11.91 0 000 12c0 1.939.47 3.769 1.475 5.587l3.953-3.302z"/>
                    <path d="M12 24c3.24 0 5.956-1.075 7.94-2.907l-3.765-2.921a7.097 7.097 0 01-4.175 1.256c-3.334 0-6.158-2.253-7.16-5.285L1.475 17.587C3.675 22.227 7.59 24 12 24z"/>
                  </svg>
                  Add to Chrome
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-white/30 text-white rounded-full font-semibold hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  iOS App (Coming Soon)
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-48 h-48 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-white/20 flex items-center justify-center animate-float mb-3">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm">Free forever</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
