export default function Home() {
  const features = [
    {
      title: "Track Films",
      body: "Keep a diary of every film you watch. Add the date, your rating, and notes.",
      accent: "bg-emerald-500/20 text-emerald-400",
    },
    {
      title: "Rate & Review",
      body: "Share your opinion with a 5-star rating system and in-depth reviews.",
      accent: "bg-orange-500/20 text-orange-400",
    },
    {
      title: "Curate Lists",
      body: "Compile favorites, genre highlights, or watchlists for yourself.",
      accent: "bg-blue-500/20 text-blue-400",
    },
  ];

  const newArrivals = [
    {
      title: "The Night Watcher",
      rating: "3.8",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBxJ-hVta1tSz79v3avJZjwwy17nux1xRdZL9KTo5FzB2L8RUx8lfcxpP0aVc6DjhomAlp_GHSun4edaV_afHrUXiS0t4uSwrnmJr-kzuJN6jTMMEJOxit4gBhKDP8dctcTLkmyABtwoBY05cUUxW8Un3cm8Y7MCy-ru4d-MyiY3VlBTkVK1jAmnC_U9dtTqV-N80xyMgGRJHsVni9oBg0X8t2MZ5wTHnDvvHMBNOpHhNKfLRfRfamM4K1u-05_1OgeIYxovS01cA",
    },
    {
      title: "Soft Light",
      rating: "4.1",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBnCjthqx6hUbKrLHVeYLkUIzI0w0L9n8r2bt2lJhfjKa_dhTNMYWcfzC31T4f5PlRqSESvfWnbTlyCNVsHOcYjJ1lWrvRDa20Ika9cYPXOiDIbbGou7w8N6HwBgmhVxH7O-GlAcggSUTe7eXgzQrYYe8aWUbXonTlCJIaZMtzl5ZLXqYUsTWxFtoZjCRrGCpA4YCYnHM5h92x7VGsUCNjVzZvaIlrR3dSrOoODyvIw4mbfDETlnIQ0JmvEqA3dPsAcmNWyX8DogA",
    },
    {
      title: "Velocity",
      rating: "3.5",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBHoGApaTCC0lntIZUnfaO3uM73FfEzTACqFuN6HC7cMcY5e_OObZxyzoSPKUmddaaLkEwjq_6Xwzazb_aitX5S4BeOJFZ5_RyCAh9G2DOqPF3cITXs_zCvtJhpxfWfaRJERd81AbL-5WorJ4tMBnXN4QRQS6sCsPAc_Kr0Fz0DjLVxyT9bv1sLKc-FFI6-x-pisBhSt03mW30fByNaafV5ytJVZA3Z9dFyZGyArdvnkH9G4ZdJIlD7ZxS4mqFfp9zOHILEMgcNzA",
    },
    {
      title: "Planet Earth III",
      rating: "4.9",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAx9ewVCt6l5OdF7vCAXKCxcOZcva9ne1HWrdT04g49_ZByxIDXITvzwA2bPnj0mcgqyymtYryWVdfv1ZIdobsupqIfbftPV6qnqWb_on4FQ3_4kxwrfy23AnIr0gqRZ9jqjxBGdp1nFqMw9AkOHLEsHuPCKDUIc6IW9fWzVjBNHxqkOjE711XOGnvD0FJb1Ow3LbWwQwMTtaAgvUTbXQe5JN-UNNhU21kp60kRndFHwkfvu8XkoMm6LDHZr83Ce_tL9d1AGIfrdg",
    },
    {
      title: "Summer Days",
      rating: "4.2",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBOVccTkLEbfKzxsYIgLFqmAEN43XAkhc3bctZrVuW5Jj2VoyUzeSFOoWCPO7EeaJ2zuXKlcr6UhevpeqdvtuY5iQQkoa2qFSQdcBmtoGnduDZ-472jKRSf6t3EWGDisEiUL9twNT2hxCfYRlSgy-zOu3h8vtMrrfCspElBlwYOPevYZxFSPVApO4iNHTt2CbiD-PYdt6GYvIt4EmRbN-QWnzz8SZzQfYtVsQ5I1gyS18ALOLVv1aDFr_YKaignwrRFAmHrBLd1GQ",
    },
    {
      title: "Into the Woods",
      rating: "3.9",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBxwO8sK7ccSzTm5YL-5GaXEzlpadv8QMzyBRyBVQsyFWkSEcd-zehNtI44tDP3dDqv_VXisEG8KPL03lXf7rdlJ-Ju0rgfbz-dvuFzfRm6qF-65xDMokn0Bt8aiBkwK7MKn_5NjUSzExZa-eOMB2AA-xvmBQgV2kf3zkvNFvQrZZdh3IqfoN-mhY_y2e1ueDIuRHUzMM56-psjQavRmDhf0ZYlV1hAli9dYf4dDi9u1i7DcRBQkTcM7saxxFrk-UPjgCvlpbkLAw",
    },
  ];

  return (
    <div className="min-h-screen bg-[#101622] text-white">
      <header className="sticky top-0 z-50 w-full border-b border-[#222f49] bg-[#101622]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <a className="flex items-center gap-2 transition-opacity hover:opacity-80" href="#">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d59f2] text-white">
                <span className="text-xs font-semibold">MF</span>
              </div>
              <span className="text-lg font-bold tracking-tight">FilmTrack</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden gap-6 md:flex">
              <a
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                href="/track"
              >
                Track
              </a>
              <a
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                href="/review/603"
              >
                Review
              </a>
              <a
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                href="/lists/test/edit"
              >
                Lists
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative mx-auto mt-6 max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-[#1a2233] shadow-2xl">
            <div className="absolute inset-0 z-0">
              <div
                className="h-full w-full bg-cover bg-center transition-transform duration-[20s] hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDbnBJieQ09Go5Zsy3V26zjD5Dr7I9SblUWw-LOvfnfOF8PcwDTyV6FCw2xUse3NdSu3cpnt3Wi_yJVebyzKEUBaVTeFJvy6lC4dRUum184D3wk54XgwWi-2geQH9eAQvgDgSFcOxnxWzk5V8j9oAzmMw86ZwLT-HYVelAseu5DQeP1ukXMRygqYzkV6OCMlhDu6HziAqUewB-oqrvRUJxglN0lBjYcgt68iYRvt31xeO4ZKZ5Jh_8vTARUSSm5U38rQUpKat8Jtw')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101622] via-[#101622]/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#101622]/90 via-transparent to-transparent" />
            </div>
            <div className="relative z-10 flex min-h-[480px] flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
              <div className="max-w-2xl space-y-6">
                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Your Life in Film
                </h1>
                <p className="max-w-lg text-lg font-light leading-relaxed text-slate-300 sm:text-xl">
                  The social network for film lovers. Track the films you watch,
                  save the ones you want to see, and log what stands out.
                </p>
                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <a
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-[#0d59f2] px-8 text-base font-bold text-white transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30"
                    href="/track"
                  >
                    Start Logging
                  </a>
                  <a
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-white/10 px-8 text-base font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                    href="/review/603"
                  >
                    Review a Film
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-[#222f49] bg-[#1a2233] p-6 transition-colors hover:bg-[#222f49]"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.accent}`}
                >
                  <span className="text-sm font-bold">+</span>
                </div>
                <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mb-12 max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between pb-6">
            <h2 className="text-2xl font-bold tracking-tight">New Arrivals</h2>
            <a className="group flex items-center text-sm font-medium text-[#0d59f2] hover:text-blue-400" href="#">
              Browse all
              <svg
                aria-hidden="true"
                className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M5 12h14M13 5l6 7-6 7" stroke="currentColor" strokeWidth="2" />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {newArrivals.map((movie) => (
              <div key={movie.title} className="group relative cursor-pointer">
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-800 shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-blue-500/10">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url('${movie.image}')` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="rounded-full border border-white/40 bg-white/10 px-3 py-2 text-xs font-semibold">
                      View
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="truncate text-sm font-semibold">{movie.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <svg aria-hidden="true" className="h-3 w-3 text-yellow-500" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2l2.9 6.4 7.1.7-5.3 4.7 1.6 6.8-6.3-3.6-6.3 3.6 1.6-6.8L2 9.1l7.1-.7L12 2z"
                      />
                    </svg>
                    <span>{movie.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#222f49] bg-[#151c2b]">
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-700 text-slate-200">
                <span className="text-[10px] font-semibold">MF</span>
              </div>
              <span className="text-sm font-semibold text-slate-400">
                (c) 2026 FilmTrack
              </span>
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
              {["About", "News", "Pro", "Apps", "Podcast"].map((link) => (
                <a key={link} className="transition-colors hover:text-[#0d59f2]" href="#">
                  {link}
                </a>
              ))}
            </div>
            <div className="flex gap-4 text-slate-400">
              <a className="transition-colors hover:text-[#0d59f2]" href="#" aria-label="Twitter">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a className="transition-colors hover:text-[#0d59f2]" href="#" aria-label="Instagram">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
