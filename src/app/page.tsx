import { ButtonLink } from "@/components/ui/Button";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      title: "Reviews",
      body: "Log every film you watch with ratings and quick review notes.",
      href: "/reviews",
      accent: "bg-emerald-500/20 text-emerald-400",
    },
    {
      title: "My Reviews",
      body: "Browse your full review history in one place.",
      href: "/my-reviews",
      accent: "bg-orange-500/20 text-orange-400",
    },
    {
      title: "To Watch",
      body: "Save titles to your Watch Later list with a quick search.",
      href: "/to-watch",
      accent: "bg-blue-500/20 text-blue-400",
    },
    {
      title: "Curate Lists",
      body: "Compile favorites, genre highlights, or watchlists for yourself.",
      href: "/lists",
      accent: "bg-indigo-500/20 text-indigo-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-white">
      <header className="sticky top-0 z-50 w-full border-b border-[var(--app-border)] bg-[var(--app-bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-[var(--app-header-height)] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link className="flex items-center gap-2 transition-opacity hover:opacity-80" href="/">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--app-primary)] text-white">
                <span className="text-xs font-semibold">ML</span>
              </div>
              <span className="text-lg font-bold tracking-tight">MyFilmLists</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden gap-6 md:flex">
              <Link
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                href="/reviews"
              >
                Reviews
              </Link>
              <Link
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                href="/my-reviews"
              >
                My Reviews
              </Link>
              <Link
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                href="/to-watch"
              >
                To Watch
              </Link>
              <Link
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                href="/lists"
              >
                Lists
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative mx-auto mt-6 max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--app-card)] shadow-2xl">
            <div className="absolute inset-0 z-0">
              <div
                className="h-full w-full bg-cover bg-center transition-transform duration-[20s] hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDbnBJieQ09Go5Zsy3V26zjD5Dr7I9SblUWw-LOvfnfOF8PcwDTyV6FCw2xUse3NdSu3cpnt3Wi_yJVebyzKEUBaVTeFJvy6lC4dRUum184D3wk54XgwWi-2geQH9eAQvgDgSFcOxnxWzk5V8j9oAzmMw86ZwLT-HYVelAseu5DQeP1ukXMRygqYzkV6OCMlhDu6HziAqUewB-oqrvRUJxglN0lBjYcgt68iYRvt31xeO4ZKZ5Jh_8vTARUSSm5U38rQUpKat8Jtw')",
                }}
              />
              <div className="absolute inset-0" style={{ background: "var(--app-gradient-hero)" }} />
              <div className="absolute inset-0" style={{ background: "var(--app-gradient-hero-side)" }} />
            </div>
            <div className="relative z-10 flex min-h-[480px] flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
              <div className="max-w-2xl space-y-6">
                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Your Life in Film
                </h1>
                <p className="max-w-lg text-lg font-light leading-relaxed text-slate-300 sm:text-xl">
                  The social network for film lovers. Log the films you watch,
                  save the ones you want to see, and log what stands out.
                </p>
                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <ButtonLink href="/reviews" size="lg">
                    Start Logging
                  </ButtonLink>
                  <ButtonLink href="/lists" variant="secondary" size="lg">
                    Browse Lists
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 transition-colors hover:bg-[var(--app-border)]"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.accent}`}
                >
                  <span className="text-sm font-bold">+</span>
                </div>
                <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.body}</p>
              </Link>
            ))}
          </div>
        </section>

      </main>

      <footer className="border-t border-[var(--app-border)] bg-[#151c2b]">
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8" />
      </footer>
    </div>
  );
}
