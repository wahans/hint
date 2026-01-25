const privacyFeatures = [
  {
    title: "Private by Default",
    description: "Your hintlists are only visible to people you share them with. You control who sees what.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "Encrypted Data",
    description: "All data is encrypted in transit and at rest using industry-standard encryption protocols.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "No Data Selling",
    description: "We never sell your data to advertisers or third parties. Your information stays yours.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  {
    title: "Export Anytime",
    description: "Download all your data in CSV format whenever you want. Full data portability.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
];

export function Privacy() {
  return (
    <section id="privacy" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-[var(--foreground)]">Your privacy,</span>
              <br />
              <span className="gradient-text">protected</span>
            </h2>
            <p className="text-lg text-[var(--muted)] mb-8 leading-relaxed">
              We built hint with privacy at the core. Your gift lists are personal,
              and we treat them that way. No tracking, no selling, no surprises
              (except the ones you want).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {privacyFeatures.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--hint-100)] text-[var(--hint-600)] flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--muted)]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[var(--hint-100)] to-[var(--hint-200)] rounded-3xl p-8 border border-[var(--hint-200)]">
              <div className="bg-white rounded-2xl p-6 shadow-inner">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[var(--hint-100)] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--hint-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">Security Status</div>
                    <div className="text-sm text-[var(--hint-600)]">All systems secure</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {["Data encrypted", "No trackers", "HTTPS everywhere", "Regular audits"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <svg className="w-5 h-5 text-[var(--hint-500)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[var(--foreground)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
