import Link from "next/link";
import type { TmdbMovieSummary } from "@/lib/tmdb";

type PosterRowProps = {
  title: string;
  items: TmdbMovieSummary[];
};

export default function PosterRow({ title, items }: PosterRowProps) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {items.length > 0 ? (
          <span className="text-xs text-[var(--app-muted)]">{items.length} titles</span>
        ) : null}
      </div>
      {items.length === 0 ? (
        <div className="mt-4 rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-sm text-[var(--app-muted)]">
          No titles available.
        </div>
      ) : (
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {items.map((item) => {
            const posterUrl = item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null;

            return (
              <Link
                key={item.id}
                className="group flex w-32 shrink-0 flex-col gap-2 sm:w-36"
                href={`/titles/${item.id}?mediaType=movie`}
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-[var(--app-border)] shadow-lg">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: posterUrl
                        ? `url('${posterUrl}')`
                        : "var(--app-gradient-poster)",
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                </div>
                <div className="flex flex-col">
                  <span className="truncate text-sm font-semibold text-white">{item.title}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
