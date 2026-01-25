const highlights = [
  {
    title: "Key Date Reminders",
    description: "Never forget an important date. Add birthdays, anniversaries, or holidays to your hintlists and we'll remind everyone who can view it—60, 30, and 15 days before.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    features: [
      "Automatic email reminders",
      "60, 30, and 15 day alerts",
      "Works for any occasion",
    ],
  },
  {
    title: "Friends & Family",
    description: "Connect with friends and family to see their hintlists anytime. Send friend requests, accept invites, and always know what to get the people you care about.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    features: [
      "See friends' public hintlists",
      "Easy friend requests",
      "Family coordination",
    ],
  },
  {
    title: "Smart Notifications",
    description: "Stay in the loop without being overwhelmed. Get notified when items are claimed, prices drop, or key dates approach. Customize exactly what you want to hear about.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    features: [
      "Claim notifications",
      "Price drop alerts",
      "Customizable preferences",
    ],
  },
];

export function FeatureHighlights() {
  return (
    <section id="more-features" className="py-24 bg-[var(--hint-50)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-[var(--foreground)]">More ways hint</span>{" "}
            <span className="gradient-text">helps you</span>
          </h2>
          <p className="text-lg text-[var(--muted)]">
            Features designed to make gift coordination effortless
          </p>
        </div>

        <div className="space-y-16">
          {highlights.map((highlight, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              } items-center gap-12`}
            >
              <div className="flex-1">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--hint-400)] to-[var(--hint-600)] text-white flex items-center justify-center mb-6 shadow-lg">
                  {highlight.icon}
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)] mb-4">
                  {highlight.title}
                </h3>
                <p className="text-lg text-[var(--muted)] mb-6 leading-relaxed">
                  {highlight.description}
                </p>
                <ul className="space-y-3">
                  {highlight.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
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
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-[var(--hint-100)]">
                  <div className="aspect-video bg-gradient-to-br from-[var(--hint-100)] to-[var(--hint-200)] rounded-2xl flex items-center justify-center">
                    <div className="text-[var(--hint-400)]">
                      {highlight.icon}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
