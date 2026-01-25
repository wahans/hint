const testimonials = [
  {
    quote: "Finally, no more asking 'did anyone get this yet?' in the family group chat. hint just works.",
    author: "Sarah M.",
    role: "Mom of 3",
    avatar: "SM",
  },
  {
    quote: "Used hint for my wedding registry and it was so much better than the traditional ones. Guests loved how easy it was.",
    author: "Jessica & Tom",
    role: "Newlyweds",
    avatar: "JT",
  },
  {
    quote: "The price tracking saved me over $200 on my daughter's birthday gifts. I got alerts when everything went on sale.",
    author: "Michael R.",
    role: "Bargain Hunter Dad",
    avatar: "MR",
  },
  {
    quote: "My kids add stuff all year and I never have to ask what they want for Christmas anymore. Game changer.",
    author: "Linda K.",
    role: "Grandmother",
    avatar: "LK",
  },
  {
    quote: "As someone who always gets duplicate gifts, this is a lifesaver. The secret claiming feature is genius.",
    author: "David P.",
    role: "Gift Receiver",
    avatar: "DP",
  },
  {
    quote: "Set up a hintlist for my baby shower in 5 minutes. Way easier than those complicated registry sites.",
    author: "Amanda T.",
    role: "Expecting Mom",
    avatar: "AT",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-[var(--foreground)]">Loved by</span>{" "}
            <span className="gradient-text">gift-givers</span>
          </h2>
          <p className="text-lg text-[var(--muted)]">
            See why families choose hint for every occasion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[var(--hint-50)] rounded-2xl p-6 border border-[var(--hint-100)]"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[var(--foreground)] mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--hint-400)] to-[var(--hint-600)] flex items-center justify-center text-white font-medium text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-[var(--foreground)]">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {testimonial.role}
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
