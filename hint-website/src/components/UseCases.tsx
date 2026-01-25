const useCases = [
  {
    title: "Birthdays",
    description: "Create a birthday hintlist and share it with family. Set the date and everyone gets reminders to shop in time.",
    emoji: "🎂",
    color: "from-pink-100 to-pink-50",
    borderColor: "border-pink-200",
  },
  {
    title: "Holidays",
    description: "Christmas, Hanukkah, or any holiday. The whole family can have hintlists so nobody has to guess.",
    emoji: "🎄",
    color: "from-red-100 to-red-50",
    borderColor: "border-red-200",
  },
  {
    title: "Weddings",
    description: "A modern alternative to traditional registries. Add items from any store, not just one or two.",
    emoji: "💒",
    color: "from-purple-100 to-purple-50",
    borderColor: "border-purple-200",
  },
  {
    title: "Baby Showers",
    description: "New parents can add exactly what they need from any store. Guests claim items without duplicates.",
    emoji: "👶",
    color: "from-blue-100 to-blue-50",
    borderColor: "border-blue-200",
  },
  {
    title: "Housewarmings",
    description: "Moving into a new place? Create a hintlist for all those things you need but don't want to buy yourself.",
    emoji: "🏠",
    color: "from-orange-100 to-orange-50",
    borderColor: "border-orange-200",
  },
  {
    title: "Just Because",
    description: "Keep a running list of things you'd love. When someone asks what you want, just share your hintlist.",
    emoji: "💝",
    color: "from-[var(--hint-100)] to-[var(--hint-50)]",
    borderColor: "border-[var(--hint-200)]",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-[var(--foreground)]">Perfect for</span>{" "}
            <span className="gradient-text">every occasion</span>
          </h2>
          <p className="text-lg text-[var(--muted)]">
            One tool for all your gift-giving needs
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className={`rounded-2xl p-6 bg-gradient-to-br ${useCase.color} border ${useCase.borderColor} hover:shadow-lg transition-shadow`}
            >
              <div className="text-4xl mb-4">{useCase.emoji}</div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                {useCase.title}
              </h3>
              <p className="text-[var(--muted)] leading-relaxed">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
