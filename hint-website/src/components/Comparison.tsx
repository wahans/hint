const comparisonData = [
  { feature: "Add items from any store", hint: true, spreadsheets: false, amazonList: false, traditional: false },
  { feature: "Secret claiming (no spoilers)", hint: true, spreadsheets: false, amazonList: false, traditional: true },
  { feature: "Price tracking & alerts", hint: true, spreadsheets: false, amazonList: true, traditional: false },
  { feature: "Key date reminders", hint: true, spreadsheets: false, amazonList: false, traditional: false },
  { feature: "No account needed to claim", hint: true, spreadsheets: true, amazonList: false, traditional: false },
  { feature: "QR code sharing", hint: true, spreadsheets: false, amazonList: false, traditional: false },
  { feature: "Friends list integration", hint: true, spreadsheets: false, amazonList: false, traditional: false },
  { feature: "One-click product capture", hint: true, spreadsheets: false, amazonList: true, traditional: false },
  { feature: "Works on mobile", hint: true, spreadsheets: true, amazonList: true, traditional: true },
  { feature: "Free to use", hint: true, spreadsheets: true, amazonList: true, traditional: false },
];

const CheckIcon = () => (
  <svg className="w-5 h-5 text-[var(--hint-500)]" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

export function Comparison() {
  return (
    <section id="comparison" className="py-24 bg-[var(--hint-50)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-[var(--foreground)]">Why choose</span>{" "}
            <span className="gradient-text">hint?</span>
          </h2>
          <p className="text-lg text-[var(--muted)]">
            See how hint compares to other ways of sharing wishlists
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-2xl overflow-hidden shadow-lg">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left p-4 font-semibold text-[var(--foreground)]">Feature</th>
                <th className="p-4 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--hint-500)] to-[var(--hint-600)] text-white rounded-full font-semibold">
                    🎁 hint
                  </div>
                </th>
                <th className="p-4 text-center font-medium text-[var(--muted)]">Spreadsheets</th>
                <th className="p-4 text-center font-medium text-[var(--muted)]">Amazon Lists</th>
                <th className="p-4 text-center font-medium text-[var(--muted)]">Traditional Registry</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="p-4 text-[var(--foreground)]">{row.feature}</td>
                  <td className="p-4 text-center">
                    {row.hint ? <CheckIcon /> : <XIcon />}
                  </td>
                  <td className="p-4 text-center">
                    {row.spreadsheets ? <CheckIcon /> : <XIcon />}
                  </td>
                  <td className="p-4 text-center">
                    {row.amazonList ? <CheckIcon /> : <XIcon />}
                  </td>
                  <td className="p-4 text-center">
                    {row.traditional ? <CheckIcon /> : <XIcon />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center">
          <a
            href="#download"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--hint-500)] to-[var(--hint-600)] text-white rounded-full font-semibold text-lg hover:from-[var(--hint-600)] hover:to-[var(--hint-700)] transition-all shadow-xl shadow-[var(--hint-500)]/30"
          >
            Try hint free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
