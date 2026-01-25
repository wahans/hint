const CakeIcon = () => (
  <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15h-2.316l.149-5.218A6.834 6.834 0 0012 3a6.834 6.834 0 00-6.833 6.782l.149 5.218H3a1 1 0 00-1 1v2a1 1 0 001 1h18a1 1 0 001-1v-2a1 1 0 00-1-1zM12 3v2M8 3c0 2 4 2.5 4 2.5s4-.5 4-2.5" />
  </svg>
);

const TreeIcon = () => (
  <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l3 5h-2l3 5h-2l3 6H7l3-6H8l3-5H9l3-5zM12 22v-4" />
  </svg>
);

const RingsIcon = () => (
  <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8 4 4 0 000 8z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8a4 4 0 104 4M12 8a4 4 0 00-4 4" />
  </svg>
);

const BabyIcon = () => (
  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" strokeWidth={1.5} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12c-4 0-7 2-7 5v3h14v-3c0-3-3-5-7-5z" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const HeartGiftIcon = () => (
  <svg className="w-10 h-10 text-[var(--hint-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const useCases = [
  {
    title: "Birthdays",
    description: "Create a birthday hintlist and share it with family. Set the date and everyone gets reminders to shop in time.",
    icon: <CakeIcon />,
    color: "from-pink-100 to-pink-50",
    borderColor: "border-pink-200",
  },
  {
    title: "Holidays",
    description: "Christmas, Hanukkah, or any holiday. The whole family can have hintlists so nobody has to guess.",
    icon: <TreeIcon />,
    color: "from-red-100 to-red-50",
    borderColor: "border-red-200",
  },
  {
    title: "Weddings",
    description: "A modern alternative to traditional registries. Add items from any store, not just one or two.",
    icon: <RingsIcon />,
    color: "from-purple-100 to-purple-50",
    borderColor: "border-purple-200",
  },
  {
    title: "Baby Showers",
    description: "New parents can add exactly what they need from any store. Guests claim items without duplicates.",
    icon: <BabyIcon />,
    color: "from-blue-100 to-blue-50",
    borderColor: "border-blue-200",
  },
  {
    title: "Housewarmings",
    description: "Moving into a new place? Create a hintlist for all those things you need but don't want to buy yourself.",
    icon: <HomeIcon />,
    color: "from-orange-100 to-orange-50",
    borderColor: "border-orange-200",
  },
  {
    title: "Just Because",
    description: "Keep a running list of things you'd love. When someone asks what you want, just share your hintlist.",
    icon: <HeartGiftIcon />,
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
              className={`rounded-2xl p-6 bg-gradient-to-br ${useCase.color} border ${useCase.borderColor} hover:shadow-lg transition-shadow cursor-pointer`}
            >
              <div className="mb-4">{useCase.icon}</div>
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
